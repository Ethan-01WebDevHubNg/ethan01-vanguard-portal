// public/js/components/header.js

export function renderHeader() {
    const mountPoint = document.getElementById("header-mount");
    if (!mountPoint) return;

    // =====================================================================
    // UPGRADE: DOM Auto-Realignment
    // Detach the header from inside <main> to prevent CSS transform trapping.
    // This allows it to stay 'fixed' to the viewport while still shifting.
    // =====================================================================
    const mainNode = document.querySelector('main');
    if (mainNode && mainNode.contains(mountPoint)) {
        mainNode.parentNode.insertBefore(mountPoint, mainNode);
    }
    // =====================================================================

    const placeholder = mountPoint.dataset.searchPlaceholder || "SEARCH SYSTEM...";
    const toastMsg = mountPoint.dataset.searchToast || "Searching global index...";
    const showRoleSim = mountPoint.dataset.roleSimulator === "true";
    const roleOptionsRaw = mountPoint.dataset.roleOptions || "Super Admin,Staff";
    
    let roleSimulatorHtml = '';
    if (showRoleSim) {
        const options = roleOptionsRaw.split(',').map(role => 
            `<option value="${role.trim()}">View as: ${role.trim()}</option>`
        ).join('');
        
        roleSimulatorHtml = `
            <div id="header-role-sim" class="hidden sm:block ml-4">
                <select onchange="window.setRole && window.setRole(this.value)" class="bg-surface-container-highest border-none text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm">
                    ${options}
                </select>
            </div>
        `;
    }

    const headerHTML = `
        <header class="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-[#0e0e0e]/60 backdrop-blur-xl flex justify-between items-center h-16 px-4 sm:px-8 shadow-[0_4px_24px_rgba(255,255,255,0.04)] transition-all duration-300 border-b border-white/5">
            
            <div class="flex items-center gap-4 shrink-0">
                <button id="hamburger-btn" onclick="window.toggleSidebar && window.toggleSidebar(this)" class="md:hidden relative w-8 h-8 flex items-center justify-center group z-[80] shrink-0">
                    <div class="flex flex-col justify-between w-5 h-4 transform transition-all duration-300 origin-center">
                        <div class="bg-white h-[2px] w-full transform transition-all duration-300 origin-left group-[.active]:rotate-[42deg] group-[.active]:w-5 group-[.active]:bg-primary"></div>
                        <div class="bg-white h-[2px] w-full transform transition-all duration-300 group-[.active]:opacity-0"></div>
                        <div class="bg-white h-[2px] w-full transform transition-all duration-300 origin-left group-[.active]:-rotate-[42deg] group-[.active]:w-5 group-[.active]:bg-primary"></div>
                    </div>
                </button>
                
                <img src="/assets/icons/ethan01logo.svg" alt="ETHAN01 Logo" class="h-7 w-auto object-contain md:hidden">
            </div>

            <div class="flex-1 flex items-center justify-end md:justify-start px-4 md:px-8 overflow-hidden">
                <div class="relative w-full max-w-md hidden md:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">search</span>
                    <input class="bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-2 text-[0.6875rem] tracking-widest w-full focus:ring-1 focus:ring-primary text-white placeholder-zinc-500 outline-none transition-all" placeholder="${placeholder}" type="text" onkeydown="if(event.key === 'Enter') { if(window.Toast) window.Toast.show('${toastMsg}', 'info'); }"/>
                </div>

                <div id="mobile-search-wrapper" class="hidden md:hidden w-0 opacity-0 px-0 overflow-hidden items-center bg-surface-container-highest rounded-full py-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                    <span class="material-symbols-outlined text-zinc-500 text-sm shrink-0">search</span>
                    <input id="mobile-search-input" type="text" class="flex-1 bg-transparent border-none text-xs text-white focus:ring-0 outline-none px-2 w-full" placeholder="${placeholder}" 
                        onkeydown="if(event.key === 'Enter') { window.executeMobileSearchAction(); }"
                        oninput="window.handleMobileSearchInput(this)" />
                    <span id="mobile-search-action" class="material-symbols-outlined text-zinc-500 text-sm cursor-pointer hover:text-white transition-colors shrink-0" onclick="window.executeMobileSearchAction()">close</span>
                </div>

                ${roleSimulatorHtml}
            </div>
            
            <div class="flex items-center gap-4 sm:gap-6 shrink-0">
                
                <div id="header-action-icons" class="flex items-center gap-4 sm:gap-6 transition-all duration-300">
                    <button id="mobile-search-trigger-btn" class="md:hidden flex items-center justify-center text-zinc-400 hover:text-[#f3ffca] transition-colors" onclick="window.toggleMobileSearch()">
                        <span class="material-symbols-outlined text-[20px]">search</span>
                    </button>
                    
                    <div class="relative flex items-center justify-center cursor-pointer" id="header-notif-trigger">
                        <span class="material-symbols-outlined text-zinc-400 hover:text-[#f3ffca] transition-colors">notifications</span>
                    </div>
                </div>
                
                <div class="hidden sm:block h-6 w-px bg-white/10" id="header-divider"></div>
                
                <div class="flex items-center gap-3 relative cursor-pointer" id="header-profile-trigger">
                    <div class="text-right hidden sm:block">
                        <p class="text-[0.6875rem] font-bold text-white uppercase tracking-wider">Ethan Hunt</p>
                        <p class="text-[0.6rem] text-primary uppercase font-bold tracking-widest">Lead Architect</p>
                    </div>
                    <div class="h-8 w-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-surface-container-high">
                        <img alt="User profile" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeve8dY11GD3ZHg3UNnLMKR3jLOd7Z6AesFQARw7yF9j3X7LaXXB-Ha97EurbHheNEiCU11X3BRpqQRKxpyZR_yjSXoemFR1URz27GwKkJpJEZmews4dzmfMc1iaC3M-3L41qqJegmWwUY1ldVO-JeF7svL1q-5Vwxfjk5HFkr7yC0QBGzwZljGzBeoGbi7LD-xoYqaFaZ0FZrnZ5bnITB7B0AUl_6bujb5WJHEqzQCocPuTcwLVFkG9TkI72M3TUJR0gIvKiLtQ"/>
                    </div>
                </div>
            </div>
        </header>
    `;

    mountPoint.outerHTML = headerHTML; 

    window.handleMobileSearchInput = function(input) {
        const actionIcon = document.getElementById('mobile-search-action');
        if (input.value.length > 0) {
            actionIcon.innerText = 'search';
            actionIcon.classList.add('text-primary');
            actionIcon.classList.remove('text-zinc-500');
        } else {
            actionIcon.innerText = 'close';
            actionIcon.classList.remove('text-primary');
            actionIcon.classList.add('text-zinc-500');
        }
    };

    window.executeMobileSearchAction = function() {
        const input = document.getElementById('mobile-search-input');
        const actionIcon = document.getElementById('mobile-search-action');
        
        if (input.value.length > 0) {
            if(window.Toast) window.Toast.show('Search functionality pending database connection.', 'info');
            
            window.toggleMobileSearch();
            input.value = '';
            actionIcon.innerText = 'close';
            actionIcon.classList.remove('text-primary');
            actionIcon.classList.add('text-zinc-500');
        } else {
            window.toggleMobileSearch();
        }
    };

    window.toggleMobileSearch = function() {
        const searchWrapper = document.getElementById('mobile-search-wrapper');
        const actionIcons = document.getElementById('header-action-icons');
        const roleSim = document.getElementById('header-role-sim');

        if (searchWrapper.classList.contains('w-0')) {
            actionIcons.classList.add('hidden');
            actionIcons.classList.remove('flex');
            if(roleSim) roleSim.classList.add('hidden');
            
            searchWrapper.classList.remove('hidden');
            searchWrapper.classList.add('flex');

            setTimeout(() => {
                searchWrapper.classList.remove('w-0', 'opacity-0', 'px-0');
                searchWrapper.classList.add('w-full', 'opacity-100', 'px-3');
                setTimeout(() => searchWrapper.querySelector('input').focus(), 300);
            }, 10);
            
        } else {
            searchWrapper.classList.remove('w-full', 'opacity-100', 'px-3');
            searchWrapper.classList.add('w-0', 'opacity-0', 'px-0');
            
            setTimeout(() => {
                searchWrapper.classList.add('hidden');
                searchWrapper.classList.remove('flex');
                
                actionIcons.classList.remove('hidden');
                actionIcons.classList.add('flex');
                if(roleSim) roleSim.classList.remove('hidden');
            }, 500); 
        }
    };

    setTimeout(() => {
        const sidebar = document.querySelector('aside') || document.querySelector('[class*="-translate-x-"]');
        const hamburger = document.getElementById('hamburger-btn');
        
        if (sidebar && hamburger) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        if (sidebar.classList.contains('-translate-x-full')) {
                            hamburger.classList.remove('active');
                        } else {
                            hamburger.classList.add('active');
                        }
                    }
                });
            });
            observer.observe(sidebar, { attributes: true });
        }

        document.addEventListener('click', (e) => {
            const searchWrapper = document.getElementById('mobile-search-wrapper');
            const searchTrigger = document.getElementById('mobile-search-trigger-btn');
            
            if (searchWrapper && searchWrapper.classList.contains('w-full')) {
                if (!searchWrapper.contains(e.target) && (!searchTrigger || !searchTrigger.contains(e.target))) {
                    window.toggleMobileSearch();
                }
            }
        });

    }, 500); 
}