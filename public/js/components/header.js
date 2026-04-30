// public/js/components/header.js

export function renderHeader() {
    const mountPoint = document.getElementById("header-mount");
    if (!mountPoint) return;

    // DOM Auto-Realignment
    const mainNode = document.querySelector('main');
    if (mainNode && mainNode.contains(mountPoint)) {
        mainNode.parentNode.insertBefore(mountPoint, mainNode);
    }

    const placeholder = mountPoint.dataset.searchPlaceholder || "SEARCH SYSTEM...";
    const showRoleSim = mountPoint.dataset.roleSimulator === "true";
    const roleOptionsRaw = mountPoint.dataset.roleOptions || "Super Admin,Staff";
    
    let roleSimulatorHtml = '';
    if (showRoleSim) {
        const options = roleOptionsRaw.split(',').map(role => 
            `<option value="${role.trim()}">View as: ${role.trim()}</option>`
        ).join('');
        
        roleSimulatorHtml = `
            <div id="header-role-sim" class="hidden sm:block ml-4">
                <select onchange="window.setRole && window.setRole(this.value)" class="bg-surface-container-highest border border-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm">
                    ${options}
                </select>
            </div>
        `;
    }

    const headerHTML = `
        <header class="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-[var(--color-surface-highest-alpha)] backdrop-blur-xl backdrop-brightness-95 flex justify-between items-center h-16 px-4 sm:px-8 shadow-sm transition-all duration-300">
            
            <div class="flex items-center gap-4 shrink-0">
                <button id="hamburger-btn" onclick="window.toggleSidebar && window.toggleSidebar(this)" class="md:hidden relative w-8 h-8 flex items-center justify-center group z-[80] shrink-0">
                    <div class="flex flex-col justify-between w-5 h-4 transform transition-all duration-300 origin-center">
                        <div class="bg-on-surface h-[2px] w-full transform transition-all duration-300 origin-left group-[.active]:rotate-[42deg] group-[.active]:w-5 group-[.active]:bg-primary"></div>
                        <div class="bg-on-surface h-[2px] w-full transform transition-all duration-300 group-[.active]:opacity-0"></div>
                        <div class="bg-on-surface h-[2px] w-full transform transition-all duration-300 origin-left group-[.active]:-rotate-[42deg] group-[.active]:w-5 group-[.active]:bg-primary"></div>
                    </div>
                </button>
                
                <img src="/assets/icons/ethan01logo.svg" alt="ETHAN01 Logo" class="h-7 w-auto object-contain md:hidden">
            </div>

            <div class="flex-1 flex items-center justify-end md:justify-start px-4 md:px-8 overflow-visible relative">
                
                <div class="relative w-full max-w-md hidden md:block">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                    <input id="global-desktop-search" class="bg-surface-container-high border-[1.5px] border-[var(--input-border)] rounded-lg pl-10 pr-4 py-2 text-[0.6875rem] tracking-widest w-full focus:border-primary focus:ring-[3px] focus:ring-[var(--input-ring)] text-on-surface placeholder-on-surface-variant outline-none transition-all shadow-[var(--input-shadow)]" placeholder="${placeholder}" type="text" autocomplete="off" oninput="window.executeContextualSearch(this.value, 'desktop')" />
                    
                    <div id="desktop-search-dropdown" class="absolute top-[120%] left-0 w-full bg-surface-container-high border-[1.5px] border-[var(--input-border)] rounded-xl shadow-xl hidden flex-col max-h-[60vh] overflow-y-auto z-50 transition-all">
                    </div>
                </div>

                <div id="mobile-search-wrapper" class="hidden md:hidden w-0 opacity-0 px-0 overflow-visible items-center bg-surface-container-high border-[1.5px] border-[var(--input-border)] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-[var(--input-ring)] shadow-[var(--input-shadow)] rounded-full py-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative">
                    <span class="material-symbols-outlined text-on-surface-variant text-sm shrink-0">search</span>
                    <input id="mobile-search-input" type="text" class="flex-1 bg-transparent border-none text-xs text-on-surface focus:ring-0 outline-none px-2 w-full" placeholder="${placeholder}" 
                        oninput="window.executeContextualSearch(this.value, 'mobile')" />
                    <span id="mobile-search-action" class="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-on-surface transition-colors shrink-0" onclick="window.closeMobileSearch()">close</span>
                    
                    <div id="mobile-search-dropdown" class="absolute top-[120%] left-0 w-full bg-surface-container-high border border-[var(--input-border)] rounded-xl shadow-xl hidden flex-col max-h-[60vh] overflow-y-auto z-50"></div>
                </div>

                ${roleSimulatorHtml}
            </div>
            
            <div class="flex items-center gap-4 sm:gap-6 shrink-0">
                
                <div id="header-action-icons" class="flex items-center gap-4 sm:gap-6 transition-all duration-300">
                    <button id="mobile-search-trigger-btn" class="md:hidden flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" onclick="window.toggleMobileSearch()">
                        <span class="material-symbols-outlined text-[20px]">search</span>
                    </button>
                    
                    <div class="relative flex items-center justify-center cursor-pointer text-on-surface-variant hover:text-primary transition-colors" id="header-notif-trigger">
                        <span class="material-symbols-outlined">notifications</span>
                    </div>
                </div>
                
                <div class="hidden sm:block h-6 w-px bg-black/10 dark:bg-white/10" id="header-divider"></div>
                
                <div class="flex items-center gap-3 relative cursor-pointer" id="header-profile-trigger">
                    <div class="text-right hidden sm:block">
                        <p id="header-user-name" class="text-[0.6875rem] font-bold text-on-surface uppercase tracking-wider">--</p>
                        <p id="header-user-role" class="text-[0.6rem] text-primary uppercase font-bold tracking-widest">--</p>
                    </div>
                    <div class="h-8 w-8 rounded-full overflow-hidden border border-surface-container-highest shrink-0 bg-surface-container-high">
                        <img id="header-user-avatar" alt="User profile" class="w-full h-full object-cover" src="/assets/icons/ethan01logo.svg"/>
                    </div>
                </div>
            </div>
        </header>
    `;

    mountPoint.outerHTML = headerHTML; 

    window.hydrateHeader = function(userObj) {
        if (!userObj && !window.currentUser && !window.ethan01_currentUser) return;
        
        // CRITICAL FIX: Prioritize DB Profile -> Passed Payload -> Firebase Auth Object
        const targetUser = window.ethan01_currentUser || userObj || window.currentUser;
        if(!targetUser) return;

        const nameEl = document.getElementById('header-user-name');
        const roleEl = document.getElementById('header-user-role');
        const avatarEl = document.getElementById('header-user-avatar');
        
        let displayName = targetUser.fullName || targetUser.displayName || targetUser.email || 'Authorized User';
        if (displayName.includes('@')) displayName = displayName.split('@')[0];

        // Robust Role Deduction
        let displayRole = targetUser.role;
        if (!displayRole) {
            displayRole = window.currentUserRole === 'admin' ? 'Super Admin' : 'Client';
        }

        if (nameEl) nameEl.innerText = displayName;
        if (roleEl) roleEl.innerText = displayRole;
        if (avatarEl && (targetUser.avatarUrl || targetUser.photoURL)) avatarEl.src = targetUser.avatarUrl || targetUser.photoURL;
    };

    window.addEventListener('profileLoaded', () => window.hydrateHeader());

    if (!window._headerHydrationAttached) {
        // OVERHAUL: Listen to ALL Vanguard engine sync events to prevent stale headers on sub-routes
        const syncEvents = [
            'vanguard-dashboard-sync', 
            'vanguard-wizard-sync', 
            'vanguard-cmd-sync', 
            'vanguard-directory-sync', 
            'vanguard-team-sync', 
            'vanguard-settings-sync'
        ];
        
        syncEvents.forEach(evt => {
            window.addEventListener(evt, (e) => window.hydrateHeader(e.detail?.currentUser));
        });
        
        window._headerHydrationAttached = true;
    }

    setTimeout(() => {
        window.hydrateHeader();
    }, 50);

    window.executeContextualSearch = function(query, mode) {
        const dropdown = document.getElementById(`${mode}-search-dropdown`);
        const actionIcon = document.getElementById('mobile-search-action');
        
        if (mode === 'mobile') {
            if (query.length > 0) {
                actionIcon.innerText = 'close'; 
                actionIcon.classList.add('text-primary');
            } else {
                actionIcon.innerText = 'close';
                actionIcon.classList.remove('text-primary');
            }
        }

        if (!query || query.trim().length < 2) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
            return;
        }

        dropdown.classList.remove('hidden');
        dropdown.classList.add('flex');
        
        dropdown.innerHTML = `
            <div class="p-4 flex items-center justify-center gap-2 text-on-surface-variant text-xs">
                <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                <span>Searching indices...</span>
            </div>
        `;

        const path = window.location.hash;
        let primaryContext = 'Global DB';
        if (path.includes('client')) primaryContext = 'Client Directory';
        else if (path.includes('project') || path.includes('command')) primaryContext = 'Active Projects';
        else if (path.includes('team')) primaryContext = 'Team Roster';
        else if (path.includes('invoice') || path.includes('billing')) primaryContext = 'Financials';

        setTimeout(() => {
            dropdown.innerHTML = `
                <div class="px-4 py-2 text-[0.6rem] font-bold text-primary uppercase tracking-widest bg-surface-container-highest/50 border-b border-[var(--input-border)]">
                    Prioritizing: ${primaryContext}
                </div>
                <div class="p-3 hover:bg-surface-container-highest cursor-pointer flex flex-col gap-0.5 border-b border-[var(--input-border)] transition-colors" onclick="window.Toast.show('Navigating to result...', 'success');">
                    <span class="text-sm font-bold text-on-surface truncate">Result matching "${query}"</span>
                    <span class="text-[0.65rem] text-on-surface-variant uppercase tracking-wider">Found in ${primaryContext}</span>
                </div>
                <div class="px-4 py-2 text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-highest/50 border-b border-[var(--input-border)] mt-1">
                    Global Fallback
                </div>
                <div class="p-3 hover:bg-surface-container-highest cursor-pointer flex flex-col gap-0.5 transition-colors">
                    <span class="text-sm font-bold text-on-surface truncate">Secondary data for "${query}"</span>
                    <span class="text-[0.65rem] text-on-surface-variant uppercase tracking-wider">Found in General Archives</span>
                </div>
            `;
        }, 600);
    };

    window.closeMobileSearch = function() {
        const input = document.getElementById('mobile-search-input');
        if (input.value.length > 0) {
            input.value = '';
            document.getElementById('mobile-search-dropdown').classList.add('hidden');
            document.getElementById('mobile-search-action').classList.remove('text-primary');
        } else {
            window.toggleMobileSearch();
        }
    };

    window.toggleMobileSearch = function() {
        const searchWrapper = document.getElementById('mobile-search-wrapper');
        const actionIcons = document.getElementById('header-action-icons');
        const roleSim = document.getElementById('header-role-sim');
        const dropdown = document.getElementById('mobile-search-dropdown');

        if (searchWrapper.classList.contains('w-0')) {
            actionIcons.classList.add('hidden');
            actionIcons.classList.remove('flex');
            if(roleSim) roleSim.classList.add('hidden');
            
            searchWrapper.classList.remove('hidden');
            searchWrapper.classList.add('flex');

            setTimeout(() => {
                searchWrapper.classList.remove('w-0', 'opacity-0', 'px-0');
                searchWrapper.classList.add('w-full', 'opacity-100', 'px-3', 'overflow-visible');
                setTimeout(() => searchWrapper.querySelector('input').focus(), 300);
            }, 10);
            
        } else {
            searchWrapper.classList.remove('w-full', 'opacity-100', 'px-3', 'overflow-visible');
            searchWrapper.classList.add('w-0', 'opacity-0', 'px-0');
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
            
            setTimeout(() => {
                searchWrapper.classList.add('hidden');
                searchWrapper.classList.remove('flex');
                
                actionIcons.classList.remove('hidden');
                actionIcons.classList.add('flex');
                if(roleSim) roleSim.classList.remove('hidden');
            }, 500); 
        }
    };

    document.addEventListener('click', (e) => {
        const desktopDropdown = document.getElementById('desktop-search-dropdown');
        const desktopInput = document.getElementById('global-desktop-search');
        if (desktopDropdown && !desktopDropdown.contains(e.target) && e.target !== desktopInput) {
            desktopDropdown.classList.add('hidden');
        }
    });
}