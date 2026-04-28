// public/js/components/sidebar.js

export function renderSidebar() {
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (overlay) overlay.remove();
    
    const main = document.querySelector('#main-content main') || document.querySelector('main');
    const header = document.querySelector('header');
    
    if (main) main.classList.remove('translate-x-[25%]');
    if (header) header.classList.remove('translate-x-[25%]');
    
    document.documentElement.style.overflowY = 'scroll';
    document.body.style.overflowY = 'scroll';

    const mountPoint = document.getElementById('sidebar-mount');
    if (!mountPoint) return; 

    const hash = window.location.hash;
    const role = window.currentUserRole || (hash.startsWith('#/admin') ? 'admin' : 'client');

    const adminLinks = [
        { path: '#/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '#/admin/project/view', icon: 'account_tree', label: 'Projects' },
        { path: '#/admin/clients', icon: 'monitoring', label: 'Clients / Analytics' },
        { path: '#/admin/team', icon: 'groups', label: 'Team' },
        { path: '#/admin/settings', icon: 'settings', label: 'Settings' }
    ];

    const clientLinks = [
        { path: '#/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '#/files', icon: 'account_tree', label: 'Files & Billing' },
        { path: '#/settings', icon: 'settings', label: 'Settings' }
    ];

    const links = role === 'admin' ? adminLinks : clientLinks;
    const portalName = role === 'admin' ? 'Agency Portal' : 'Client Portal';
    const dashPath = role === 'admin' ? '#/admin/dashboard' : '#/dashboard';
    const mobileClickAction = `onclick="if(window.innerWidth < 768 && window.toggleSidebar) window.toggleSidebar()"`;

    let navHtml = '';
    links.forEach(link => {
        const isActive = hash === link.path || (hash === '' && link.path === dashPath);
        
        const activeClass = isActive 
            ? 'font-bold border-r-2 border-primary bg-surface-container-highest text-on-surface' 
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200';
            
        const iconColor = isActive ? 'text-primary' : 'inherit';
        
        const linkId = `nav-link-${link.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
        
        navHtml += `
            <a id="${linkId}" ${mobileClickAction} class="flex items-center gap-3 px-4 py-3 rounded-xl group active:scale-[0.98] ${activeClass}" href="${link.path}">
                <span class="material-symbols-outlined text-[20px] ${iconColor}">${link.icon}</span>
                <span class="text-sm font-inter tracking-tight">${link.label}</span>
            </a>
        `;
    });

    let actionBtn = '';
    if (role === 'admin') {
        const isNewProjectActive = hash === '#/admin/project/new';
        
        const newProjectClass = isNewProjectActive
            ? 'bg-primary text-[#09090b]' 
            : 'bg-[var(--color-primary-alpha-30)] text-on-surface hover:bg-primary hover:text-[#09090b]'; 

        actionBtn = `
            <a id="nav-btn-new-project" ${mobileClickAction} href="#/admin/project/new" class="flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-xl font-bold transition-all duration-200 active:scale-[0.98] ${newProjectClass}">
                <span class="material-symbols-outlined text-[18px]">add</span> New Project
            </a>
        `;
    }

    // FIXED: Mobile nav top border changed to surface-container-highest for dynamic cross-theme visibility
    const mobileClientNav = role === 'client' ? `
        <div class="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-low px-6 py-4 flex justify-between items-center z-[90] border-t border-surface-container-highest">
            <a href="#/dashboard" class="material-symbols-outlined ${hash === '#/dashboard' ? 'text-primary' : 'text-on-surface-variant'}">dashboard</a>
            <a href="#/files" class="material-symbols-outlined ${hash === '#/files' ? 'text-primary' : 'text-on-surface-variant'}">account_tree</a>
            <a href="#/settings" class="material-symbols-outlined ${hash === '#/settings' ? 'text-primary' : 'text-on-surface-variant'}">settings</a>
        </div>
    ` : '';

    const sidebarHtml = `
        <aside id="global-sidebar" class="bg-surface-container-low h-[100dvh] w-64 fixed left-0 top-0 flex flex-col py-8 px-4 z-[100] transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-[var(--layout-border)]">
            <div class="mb-10 px-2 flex justify-between items-start">
                <div>
                    <a href="${dashPath}">
                        <img src="/assets/icons/ethan01logo.svg" alt="ETHAN01 Logo" class="h-8 sm:h-9 w-auto object-contain mb-1 hover:opacity-80 transition-opacity">
                    </a>
                    <p class="font-inter tracking-tight text-on-surface-variant text-[10px] uppercase tracking-widest mt-1">${portalName}</p>
                </div>
                <button onclick="window.toggleSidebar()" class="md:hidden text-on-surface-variant hover:text-on-surface -mt-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <nav class="flex-1 flex flex-col space-y-1 overflow-y-auto no-scrollbar pb-4">
                ${navHtml}
                ${actionBtn}
            </nav>

            <div class="mt-auto pt-6 border-t border-surface-container-highest space-y-1">
                <button onclick="window.toggleTheme()" class="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-highest rounded-lg text-left">
                    <span class="material-symbols-outlined text-[20px]">brightness_6</span>
                    <span class="font-inter tracking-tight">Toggle Theme</span>
                </button>
                <a ${mobileClickAction} class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-highest rounded-lg" href="#/admin/auth" onclick="if(window.processLogout) window.processLogout();">
                    <span class="material-symbols-outlined text-[20px]">logout</span>
                    <span class="font-inter tracking-tight">Log Out</span>
                </a>
            </div>
        </aside>
        ${mobileClientNav}
    `;

    mountPoint.innerHTML = sidebarHtml;

    window.hydrateSidebar = function(user) {
        if (!user) return;
        if (user.role === 'Admin') {
            const teamLink = document.getElementById('nav-link-team');
            const settingsLink = document.getElementById('nav-link-settings');
            if (teamLink) teamLink.style.display = 'none';
            if (settingsLink) settingsLink.style.display = 'none';
        } else {
            const teamLink = document.getElementById('nav-link-team');
            const settingsLink = document.getElementById('nav-link-settings');
            if (teamLink) teamLink.style.display = 'flex';
            if (settingsLink) settingsLink.style.display = 'flex';
        }
    };

    if (!window._sidebarHydrationAttached) {
        window.addEventListener('vanguard-dashboard-sync', (e) => window.hydrateSidebar(e.detail?.currentUser));
        window.addEventListener('vanguard-wizard-sync', (e) => window.hydrateSidebar(e.detail?.currentUser));
        window._sidebarHydrationAttached = true;
    }

    setTimeout(() => {
        if (window.ethan01_currentUser) window.hydrateSidebar(window.ethan01_currentUser);
    }, 50);
}

window.toggleSidebar = (btnElement) => {
    const sidebar = document.getElementById('global-sidebar');
    const main = document.querySelector('#main-content main') || document.querySelector('main');
    const header = document.querySelector('header');
    
    if (sidebar) {
        const isOpening = sidebar.classList.contains('-translate-x-full');
        sidebar.classList.toggle('-translate-x-full');

        if (window.innerWidth < 768 && main) {
            if (isOpening) {
                main.classList.add('translate-x-[25%]');
                if (header) header.classList.add('translate-x-[25%]');
                
                document.documentElement.style.overflowY = 'hidden';
                document.body.style.overflowY = 'hidden';
                
                let overlay = document.getElementById('mobile-sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'mobile-sidebar-overlay';
                    overlay.className = 'fixed inset-0 z-[90] cursor-pointer bg-black/40 backdrop-blur-[2px] transition-opacity duration-300'; 
                    overlay.onclick = () => window.toggleSidebar();
                    document.body.appendChild(overlay);
                }
            } else {
                main.classList.remove('translate-x-[25%]');
                if (header) header.classList.remove('translate-x-[25%]');
                
                document.documentElement.style.overflowY = 'scroll';
                document.body.style.overflowY = 'scroll';
                
                const overlay = document.getElementById('mobile-sidebar-overlay');
                if (overlay) overlay.remove();
            }
        }
    }
};

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        const main = document.querySelector('#main-content main') || document.querySelector('main');
        const header = document.querySelector('header');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        
        if (main) main.classList.remove('translate-x-[25%]');
        if (header) header.classList.remove('translate-x-[25%]');
        
        document.documentElement.style.overflowY = 'scroll';
        document.body.style.overflowY = 'scroll';
        
        if (overlay) overlay.remove();
    }
});