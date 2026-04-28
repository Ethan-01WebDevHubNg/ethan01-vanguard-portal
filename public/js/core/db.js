// public/js/core/db.js
import { db, auth } from '../config/firebase-dev.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    limit, 
    getDocs, 
    writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- CORE HYDRATION CONTROLLER ---

// 1. Listen for Auth State & Route Changes to trigger Syncs
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await establishAdminContext(user);
        triggerRouteSync();
    }
});

window.addEventListener('hashchange', () => {
    triggerRouteSync();
});

// 2. Establish 3-Tier Security Context
async function establishAdminContext(user) {
    try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
            window.ethan01_currentUser = adminSnap.data();
        } else {
            console.warn("Vanguard Protocol: Unregistered admin UID detected.");
            window.ethan01_currentUser = { role: 'Admin', visibility: 'visible', permissions: [] }; 
        }
    } catch (error) {
        console.error("Failed to establish Admin Context:", error);
    }
}

// 3. Router Switchboard
function triggerRouteSync() {
    const user = auth.currentUser;
    const adminData = window.ethan01_currentUser;
    if (!user || !adminData) return;

    const hash = window.location.hash;
    if (hash === '#/admin/dashboard' || hash === '') {
        syncDashboard(user.uid, adminData);
    } else if (hash === '#/admin/setup_wizard') {
        syncWizard(user.uid, adminData);
    } else if (hash === '#/admin/clients') {
        syncDirectory(user.uid, adminData);
    } else if (hash === '#/admin/project/view') {
        syncCommandCenter(user.uid, adminData);
    } else if (hash === '#/admin/team') {
        syncTeam(user.uid, adminData);
    } else if (hash === '#/admin/settings') {
        syncSettings(user.uid, adminData);
    }
}

// --- MODULE: DASHBOARD SYNC ---
async function syncDashboard(uid, adminData) {
    try {
        const countersRef = doc(db, 'metadata', 'counters');
        const countersSnap = await getDoc(countersRef);
        const counters = countersSnap.exists() ? countersSnap.data() : { projectCount: 0, clientCount: 0, invoiceCount: 0 };

        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where("status", "==", "Active"), limit(20));
        const querySnapshot = await getDocs(q);
        
        const deliverables = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const budgetUsed = data.budgetConsumed || 0;
            const totalBudget = data.totalBudget || 1; 
            const pct = Math.min(Math.round((budgetUsed / totalBudget) * 100), 100);
            const ringTarget = 175.9 - (175.9 * pct / 100);

            deliverables.push({
                id: data.projectId,
                projectName: data.projectName,
                leadName: data.leadArchitectId === uid ? "You" : "Assigned Lead", 
                status: data.phase || "Active",
                progress: `${pct}%`,
                target: ringTarget
            });
        });

        const payload = {
            currentUser: adminData,
            stats: {
                projects: counters.projectCount,
                clients: counters.clientCount,
                revenue: "₦0.00", 
                invoices: counters.invoiceCount
            },
            deliverables: deliverables,
            logs: [
                {
                    dotColor: 'bg-primary', textColor: 'text-primary', time: 'Just Now',
                    title: 'Vanguard Auth Sync', desc: `Session securely initialized for [${adminData.role}].`,
                    initiatorColor: 'text-primary', initiator: 'System Controller'
                }
            ]
        };

        window.dispatchEvent(new CustomEvent('vanguard-dashboard-sync', { detail: payload }));
    } catch (error) {
        console.error("Dashboard Sync Failed:", error);
    }
}

// --- MODULE: SETUP WIZARD SYNC ---
async function syncWizard(uid, adminData) {
    const payload = {
        currentUser: adminData,
        drafts: [
            { name: "Horizon Labs Setup", time: "2h ago" }
        ]
    };
    window.dispatchEvent(new CustomEvent('vanguard-wizard-sync', { detail: payload }));
}

// --- MODULE: CLIENT DIRECTORY SYNC ---
async function syncDirectory(uid, adminData) {
    try {
        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef, limit(50));
        const querySnapshot = await getDocs(q);
        
        const clients = [];
        let totalBurn = 0;
        let premiumCount = 0;

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const burnValue = (data.monthlyBurn || 0) / 100;
            totalBurn += burnValue;
            
            if (data.slaTier === 'Premium' || data.slaTier === 'Enterprise') {
                premiumCount++;
            }

            clients.push({
                name: data.companyName,
                domain: data.domain,
                activeProjects: "1", 
                slaTier: data.slaTier || "Standard",
                monthlyBurn: `₦${burnValue.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                burnTrend: "+0.0% vs last mo", 
                logoUrl: data.logoUrl || "/assets/icons/ethan01logo.svg",
                portalLink: `https://${data.domain || 'ethan01.com'}/portal`
            });
        });

        const slaCompliance = clients.length > 0 ? Math.round((premiumCount / clients.length) * 100) : 0;

        const payload = {
            currentUser: adminData,
            stats: {
                combinedRevenue: `₦${(totalBurn >= 1000 ? (totalBurn / 1000).toFixed(1) + 'K' : totalBurn)}`,
                slaCompliance: `${slaCompliance}%`,
                globalReach: "1 COUNTRY"
            },
            clients: clients
        };

        window.dispatchEvent(new CustomEvent('vanguard-directory-sync', { detail: payload }));
    } catch (error) {
        console.error("Directory Sync Failed:", error);
    }
}

// --- MODULE: COMMAND CENTER SYNC ---
async function syncCommandCenter(uid, adminData) {
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, limit(20));
        const querySnapshot = await getDocs(q);
        
        const projects = [];

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const budgetUsed = data.budgetConsumed || 0;
            const totalBudget = data.totalBudget || 1; 
            const pct = Math.min(Math.round((budgetUsed / totalBudget) * 100), 100);
            
            const bgGradient = pct >= 80 ? 'bg-gradient-to-br from-green-500/20 to-teal-500/20' : 
                               pct >= 30 ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 
                               'bg-gradient-to-br from-orange-500/20 to-red-500/20';

            projects.push({
                id: data.projectId,
                title: data.projectName,
                desc: `${data.phase || 'Architecture'} Workflow`,
                status: `Status: ${data.phase || 'Active'}`,
                pct: pct,
                bgGradient: bgGradient,
                logoUrl: "/assets/icons/ethan01logo.svg"
            });
        });

        const payload = {
            currentUser: adminData,
            projects: projects
        };

        window.dispatchEvent(new CustomEvent('vanguard-cmd-sync', { detail: payload }));
    } catch (error) {
        console.error("Command Center Sync Failed:", error);
    }
}

// --- MODULE: TEAM DIRECTORY SYNC ---
async function syncTeam(uid, adminData) {
    try {
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, limit(50));
        const querySnapshot = await getDocs(q);
        
        const team = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            
            // Only output visible profiles to the frontend
            if (data.visibility !== 'hidden') {
                const deptLabel = data.department || 'Engineering';
                const statusColor = data.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600';
                const statusShadow = data.status === 'online' ? 'rgba(16,185,129,0.5)' : 'rgba(0,0,0,0)';
                
                team.push({
                    department: deptLabel.toLowerCase(),
                    departmentLabel: deptLabel,
                    statusColor: statusColor,
                    statusShadow: statusShadow,
                    statusTitle: data.status === 'online' ? 'Online' : 'Offline',
                    avatarUrl: data.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeve8dY11GD3ZHg3UNnLMKR3jLOd7Z6AesFQARw7yF9j3X7LaXXB-Ha97EurbHheNEiCU11X3BRpqQRKxpyZR_yjSXoemFR1URz27GwKkJpJEZmews4dzmfMc1iaC3M-3L41qqJegmWwUY1ldVO-JeF7svL1q-5Vwxfjk5HFkr7yC0QBGzwZljGzBeoGbi7LD-xoYqaFaZ0FZrnZ5bnITB7B0AUl_6bujb5WJHEqzQCocPuTcwLVFkG9TkI72M3TUJR0gIvKiLtQ',
                    name: data.fullName || 'System User',
                    role: data.role || 'Staff',
                    email: data.email || 'user@ethan01.com',
                    phone: data.phone || '--'
                });
            }
        });

        const payload = {
            currentUser: adminData,
            team: team
        };

        window.dispatchEvent(new CustomEvent('vanguard-team-sync', { detail: payload }));
    } catch (error) {
        console.error("Team Sync Failed:", error);
    }
}

// --- MODULE: SYSTEM SETTINGS SYNC ---
async function syncSettings(uid, adminData) {
    try {
        // Data-Layer Hard Guard
        if (adminData.role !== 'Super Admin' && adminData.role !== 'Supreme Admin') {
            window.dispatchEvent(new CustomEvent('vanguard-settings-sync', { detail: { currentUser: adminData } }));
            return;
        }

        // Fetch Agency Configurations
        const configRef = doc(db, 'metadata', 'agency_config');
        const configSnap = await getDoc(configRef);
        const config = configSnap.exists() ? configSnap.data() : {};

        // Fetch Staff List for Management Table
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, limit(30));
        const staffSnap = await getDocs(q);
        
        const staffList = [];
        staffSnap.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            if (data.visibility !== 'hidden') {
                staffList.push({
                    name: data.fullName || 'System User',
                    email: data.email || '--',
                    avatarUrl: data.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeve8dY11GD3ZHg3UNnLMKR3jLOd7Z6AesFQARw7yF9j3X7LaXXB-Ha97EurbHheNEiCU11X3BRpqQRKxpyZR_yjSXoemFR1URz27GwKkJpJEZmews4dzmfMc1iaC3M-3L41qqJegmWwUY1ldVO-JeF7svL1q-5Vwxfjk5HFkr7yC0QBGzwZljGzBeoGbi7LD-xoYqaFaZ0FZrnZ5bnITB7B0AUl_6bujb5WJHEqzQCocPuTcwLVFkG9TkI72M3TUJR0gIvKiLtQ',
                    role: data.role || 'Staff',
                    activity: data.status === 'online' ? 'Just now' : 'Offline'
                });
            }
        });

        // Construct Payload
        const payload = {
            currentUser: adminData,
            agency: {
                name: config.agencyName || 'ETHAN01 Enterprise',
                hq: config.headquarters || 'Abuja, Nigeria',
                domain: config.primaryDomain || 'ethan01.com',
                logoUrl: config.logoUrl || '/assets/icons/ethan01logo.svg'
            },
            integrations: config.integrations || [
                { name: 'Squad API', active: true, key: 'sk_live_dummy_key_123' },
                { name: 'GTCO Webhook', active: false, key: '' }
            ],
            staff: staffList
        };

        window.dispatchEvent(new CustomEvent('vanguard-settings-sync', { detail: payload }));
    } catch (error) {
        console.error("Settings Sync Failed:", error);
    }
}

// --- ACTION LISTENER: CREATE WORKSPACE ---
window.addEventListener('vanguard-create-workspace', async (e) => {
    const data = e.detail;
    const user = auth.currentUser;
    if (!user || !data) return;

    try {
        const batch = writeBatch(db);
        const timestamp = new Date();
        const currentYear = timestamp.getFullYear();

        const randomId = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const clientId = `#CLI-${currentYear}-${randomId}`;
        const projectId = `#PRJ-${currentYear}-${randomId}`;

        const clientRef = doc(db, 'clients', clientId);
        const projectRef = doc(db, 'projects', projectId);

        batch.set(clientRef, {
            clientId: clientId,
            companyName: data.companyName,
            domain: data.domain,
            brandColor: data.brandColor,
            slaTier: data.sla,
            createdAt: timestamp,
            authorizedUsers: []
        });

        batch.set(projectRef, {
            projectId: projectId,
            clientId: clientId,
            projectName: `${data.companyName} Architecture Setup`,
            status: "Active",
            phase: "Discovery",
            totalBudget: parseFloat(data.totalBudgetRaw.replace(/,/g, '')) * 100 || 0,
            currency: data.currency,
            createdAt: timestamp,
            leadArchitectId: user.uid
        });

        await batch.commit();
        
        if (window.Toast) window.Toast.show("Workspace successfully created in eth-db!", "success");
        setTimeout(() => { window.location.hash = '#/admin/project/view'; }, 1500);

    } catch (error) {
        console.error("Workspace Batched Write Failed:", error);
        if (window.Toast) window.Toast.show("Transaction failed. Check console.", "error");
    }
});