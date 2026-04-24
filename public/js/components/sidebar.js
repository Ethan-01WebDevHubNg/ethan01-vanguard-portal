// public/js/components/sidebar.js

export function renderSidebar() {
    // =========================================================================
    // Global Mobile State Cleanup Failsafe
    // =========================================================================
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (overlay) overlay.remove();
    
    const main = document.querySelector('#main-content main') || document.querySelector('main');
    const header = document.querySelector('header');
    
    if (main) main.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
    if (header) header.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
    // =========================================================================

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

    const mobileClickAction = `onclick="if(window.innerWidth < 768 && window.toggleSidebar) window.toggleSidebar()"`;

    let navHtml = '';
    links.forEach(link => {
        const isActive = hash === link.path || (hash === '' && link.path === (role === 'admin' ? '#/admin/dashboard' : '#/dashboard'));
        
        const activeClass = isActive 
            ? 'text-[#ccff00] font-bold border-r-2 border-[#ccff00] bg-[#201f1f]' 
            : 'text-zinc-500 hover:text-white hover:bg-[#201f1f] transition-all duration-200';
        
        navHtml += `
            <a ${mobileClickAction} class="flex items-center gap-3 px-4 py-3 rounded-xl group active:scale-[0.98] ${activeClass}" href="${link.path}">
                <span class="material-symbols-outlined text-[20px]">${link.icon}</span>
                <span class="text-sm font-inter tracking-tight">${link.label}</span>
            </a>
        `;
    });

    let actionBtn = '';
    if (role === 'admin') {
        const isNewProjectActive = hash === '#/admin/project/new';
        const newProjectClass = isNewProjectActive
            ? 'bg-[#ccff00] text-[#0e0e0e]' 
            : 'bg-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00] hover:text-[#0e0e0e]'; 

        actionBtn = `
            <a ${mobileClickAction} href="#/admin/project/new" class="flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-xl font-bold transition-all duration-200 active:scale-[0.98] ${newProjectClass}">
                <span class="material-symbols-outlined text-[18px]">add</span> New Project
            </a>
        `;
    }

    const mobileClientNav = role === 'client' ? `
        <div class="md:hidden fixed bottom-0 left-0 w-full bg-surface-container px-6 py-4 flex justify-between items-center z-[90] border-t border-outline-variant/10">
            <a href="#/dashboard" class="material-symbols-outlined ${hash === '#/dashboard' ? 'text-[#ccff00]' : 'text-zinc-500'}">dashboard</a>
            <a href="#/files" class="material-symbols-outlined ${hash === '#/files' ? 'text-[#ccff00]' : 'text-zinc-500'}">account_tree</a>
            <a href="#/settings" class="material-symbols-outlined ${hash === '#/settings' ? 'text-[#ccff00]' : 'text-zinc-500'}">settings</a>
        </div>
    ` : '';

    const sidebarHtml = `
        <aside id="global-sidebar" class="bg-[#131313] dark:bg-[#131313] h-[100dvh] w-64 fixed left-0 top-0 flex flex-col py-8 px-4 z-[100] transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out border-r border-white/5">
            <div class="mb-10 px-2 flex justify-between items-start">
                <div>
                    <img src="/assets/icons/ethan01logo.svg" alt="ETHAN01 Logo" class="h-6 w-auto object-contain mb-1">
                    <p class="font-inter tracking-tight text-zinc-500 text-[10px] uppercase tracking-widest mt-1">${portalName}</p>
                </div>
                <button onclick="window.toggleSidebar()" class="md:hidden text-zinc-400 hover:text-white -mt-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <nav class="flex-1 flex flex-col space-y-1 overflow-y-auto no-scrollbar pb-4">
                ${navHtml}
                ${actionBtn}
            </nav>

            <div class="mt-auto pt-6 border-t border-white/5 space-y-1">
                <button onclick="window.toggleTheme()" class="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-200 transition-colors hover:bg-[#201f1f] rounded-lg text-left">
                    <span class="material-symbols-outlined text-[20px]">brightness_6</span>
                    <span class="font-inter tracking-tight">Toggle Theme</span>
                </button>
                <a ${mobileClickAction} class="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-zinc-200 transition-colors hover:bg-[#201f1f] rounded-lg" href="javascript:void(0)" onclick="window.processLogout()">
                    <span class="material-symbols-outlined text-[20px]">logout</span>
                    <span class="font-inter tracking-tight">Log Out</span>
                </a>
            </div>
        </aside>
        ${mobileClientNav}
    `;

    mountPoint.innerHTML = sidebarHtml;
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
                main.classList.add('translate-x-[25%]', 'blur-sm', 'brightness-50');
                if (header) header.classList.add('translate-x-[25%]', 'blur-sm', 'brightness-50');
                
                let overlay = document.getElementById('mobile-sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'mobile-sidebar-overlay';
                    overlay.className = 'fixed inset-0 z-[90] cursor-pointer bg-transparent'; 
                    overlay.onclick = () => window.toggleSidebar();
                    document.body.appendChild(overlay);
                }
            } else {
                main.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
                if (header) header.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
                
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
        
        if (main) main.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
        if (header) header.classList.remove('translate-x-[25%]', 'blur-sm', 'brightness-50');
        if (overlay) overlay.remove();
    }
});