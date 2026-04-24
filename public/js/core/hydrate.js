// public/js/core/hydrate.js
import { db } from '../config/firebase-dev.js';
import { collection, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * 1. GENERIC HYDRATION ENGINE (Restored: This fixes the notifications.js crash)
 */
export function hydrate(htmlString, dataPayload) {
    let result = htmlString;
    for (const key in dataPayload) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        const value = dataPayload[key] !== undefined && dataPayload[key] !== null ? dataPayload[key] : '';
        result = result.replace(regex, value);
    }
    return result;
}

/**
 * 2. GLOBAL HYDRATION DATA (Restored: Feeds data to header drops and modals)
 */
window.getHydrationData = function() {
    if (!window.ActiveProfile) return {};
    return {
        FullName: window.ActiveProfile.fullName || 'Vanguard Admin',
        Email: window.ActiveProfile.email || '',
        AgencyName: window.ActiveProfile.agencyName || 'Ethan01'
    };
};

/**
 * 3. VANGUARD TEMPLATE COMPILER
 */
function compileTemplate(templateId, dataPayload) {
    const templateNode = document.getElementById(templateId);
    if (!templateNode) {
        console.warn(`Vanguard Engine: Template '${templateId}' not found in DOM.`);
        return '';
    }
    return hydrate(templateNode.innerHTML, dataPayload);
}

/**
 * 4. CORE DASHBOARD HYDRATION SEQUENCE
 */
export async function hydrateAdminDashboard() {
    if (!window.currentUser) return;
    
    console.log("Initiating Vanguard Hydration Sequence...");
    
    try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const projectsContainer = document.getElementById('active-projects-grid'); 
        let projectsHtmlOutput = '';

        projectsSnap.forEach(docSnap => {
            const project = docSnap.data();
            
            const displayBudget = new Intl.NumberFormat('en-NG', { 
                style: 'currency', 
                currency: 'NGN' 
            }).format((project.totalBudget || 0) / 100);
            
            const displayConsumed = new Intl.NumberFormat('en-NG', { 
                style: 'currency', 
                currency: 'NGN' 
            }).format((project.budgetConsumed || 0) / 100);

            const burnPercentage = project.totalBudget ? Math.round((project.budgetConsumed / project.totalBudget) * 100) : 0;

            projectsHtmlOutput += compileTemplate('tpl-project-card', {
                ProjectId: project.projectId,
                ProjectName: project.projectName,
                Status: project.status,
                Phase: project.phase,
                TotalBudget: displayBudget,
                BudgetConsumed: displayConsumed,
                BurnPercentage: burnPercentage
            });
        });

        if (projectsContainer) {
            projectsContainer.innerHTML = projectsHtmlOutput;
        }

        const globalTasksSnap = await getDocs(collectionGroup(db, 'tasks'));
        
        let todoHtml = '';
        let inProgressHtml = '';
        let reviewHtml = '';

        globalTasksSnap.forEach(docSnap => {
            const task = docSnap.data();
            const taskMarkup = compileTemplate('tpl-task-card', {
                TaskId: task.taskId,
                Title: task.title,
                Priority: task.priority,
                DueDate: task.dueDate ? task.dueDate.toDate().toLocaleDateString() : 'TBD'
            });

            if (task.status === "To Do") todoHtml += taskMarkup;
            else if (task.status === "In Progress") inProgressHtml += taskMarkup;
            else if (task.status === "Under Review") reviewHtml += taskMarkup;
        });

        const colTodo = document.getElementById('kanban-todo');
        const colInProgress = document.getElementById('kanban-inprogress');
        const colReview = document.getElementById('kanban-review');

        if (colTodo) colTodo.innerHTML = todoHtml;
        if (colInProgress) colInProgress.innerHTML = inProgressHtml;
        if (colReview) colReview.innerHTML = reviewHtml;

    } catch (error) {
        console.error("Vanguard Hydration Error:", error);
    }
}

window.addEventListener('profileLoaded', () => {
    if (window.location.hash === '#/admin/dashboard') {
        hydrateAdminDashboard();
    }
});