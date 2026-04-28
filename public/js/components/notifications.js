// public/js/components/notifications.js

export function initHeaderDrops() {
    let profileTimeout;
    let notifTimeout;

    // 1. Setup Profile Drop Card
    const profileTrigger = document.getElementById('header-profile-trigger');
    
    if (profileTrigger && !profileTrigger.dataset.bound) {
        profileTrigger.dataset.bound = "true";
        
        const showProfileCard = () => {
            clearTimeout(profileTimeout); 
            let dropCard = document.getElementById('profile-drop-card');
            if(!dropCard) {
                // Fetch the live contextual data from the Vanguard Engine Cache
                const user = window.ethan01_currentUser || { 
                    fullName: 'Authorized User', 
                    email: '--', 
                    role: 'Staff' 
                };

                dropCard = document.createElement('div');
                dropCard.id = 'profile-drop-card';
                dropCard.className = 'absolute top-12 right-[-10px] w-[260px] sm:w-60 transform scale-95 opacity-0 origin-top-right transition-all duration-200 z-[100] cursor-default';
                dropCard.innerHTML = `
                    <div class="absolute -top-1.5 right-[18px] w-3 h-3 bg-surface-container-high border border-white/5 border-b-surface-container-high border-r-surface-container-high transform rotate-45 z-20 rounded-tl-[2px]"></div>
                    
                    <div class="bg-surface-container-high border border-white/5 rounded-xl shadow-2xl overflow-hidden relative z-10 w-full">
                        <div class="px-4 py-4 border-b border-zinc-700">
                            <p class="text-sm font-bold text-white truncate">${user.fullName}</p>
                            <p class="text-[10px] text-zinc-400 truncate mt-0.5">${user.email}</p>
                            <p class="text-[9px] text-primary font-bold uppercase tracking-widest mt-2">${user.role}</p>
                        </div>
                        <div class="p-1.5">
                            <a href="#/admin/auth" onclick="if(window.Toast) window.Toast.show('Disconnecting session...', 'info'); if(window.processLogout) window.processLogout();" class="block px-3 py-2.5 text-xs font-bold text-error hover:bg-error/10 transition-colors rounded-lg flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px]">logout</span> Disconnect
                            </a>
                        </div>
                    </div>
                `;
                profileTrigger.appendChild(dropCard);
            }
            setTimeout(() => {
                dropCard.classList.remove('scale-95', 'opacity-0');
                dropCard.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        const hideProfileCard = () => {
            profileTimeout = setTimeout(() => {
                const dropCard = document.getElementById('profile-drop-card');
                if(dropCard) {
                    dropCard.classList.remove('scale-100', 'opacity-100');
                    dropCard.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => { if(dropCard.parentNode) dropCard.remove() }, 200);
                }
            }, 300); 
        };

        profileTrigger.addEventListener('mouseenter', showProfileCard);
        profileTrigger.addEventListener('mouseleave', hideProfileCard);
        
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const dropCard = document.getElementById('profile-drop-card');
            if (dropCard && dropCard.classList.contains('opacity-100')) {
                hideProfileCard();
            } else {
                showProfileCard();
            }
        });
    }

    // 2. Setup Notification Drop Card
    const notifTrigger = document.getElementById('header-notif-trigger');
    if (notifTrigger && !notifTrigger.dataset.bound) {
        notifTrigger.dataset.bound = "true";
        
        const showNotifCard = () => {
            clearTimeout(notifTimeout);
            let dropCard = document.getElementById('notif-drop-card');
            if(!dropCard) {
                dropCard = document.createElement('div');
                dropCard.id = 'notif-drop-card';
                dropCard.className = 'absolute top-12 right-[-60px] sm:right-[-10px] w-[330px] sm:w-80 transform scale-95 opacity-0 origin-top-right transition-all duration-200 z-[100] cursor-default';
                dropCard.innerHTML = `
                    <div class="absolute -top-1.5 right-[68px] sm:right-[18px] w-3 h-3 bg-surface-container-high border border-white/5 border-b-surface-container-high border-r-surface-container-high transform rotate-45 z-20 rounded-tl-[2px]"></div>
                    
                    <div class="bg-surface-container-high border border-white/5 rounded-xl shadow-2xl overflow-hidden relative z-10 w-full">
                        <div class="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                            <p class="text-xs font-bold text-white uppercase tracking-widest">System Alerts</p>
                            <span class="text-[10px] text-primary">0 New</span>
                        </div>
                        <div class="p-6 text-center">
                            <span class="material-symbols-outlined text-zinc-600 text-3xl mb-2">notifications_paused</span>
                            <p class="text-xs font-bold text-zinc-500">No updates yet.</p>
                        </div>
                    </div>
                `;
                notifTrigger.appendChild(dropCard);
            }
            setTimeout(() => {
                dropCard.classList.remove('scale-95', 'opacity-0');
                dropCard.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        const hideNotifCard = () => {
            notifTimeout = setTimeout(() => {
                const dropCard = document.getElementById('notif-drop-card');
                if(dropCard) {
                    dropCard.classList.remove('scale-100', 'opacity-100');
                    dropCard.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => { if(dropCard.parentNode) dropCard.remove() }, 200);
                }
            }, 300);
        };

        notifTrigger.addEventListener('mouseenter', showNotifCard);
        notifTrigger.addEventListener('mouseleave', hideNotifCard);
        
        notifTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropCard = document.getElementById('notif-drop-card');
            if (dropCard && dropCard.classList.contains('opacity-100')) {
                hideNotifCard();
            } else {
                showNotifCard();
            }
        });
    }

    // 3. Global Click Listener to Close Cards on Outside Click
    document.addEventListener('click', (e) => {
        const pCard = document.getElementById('profile-drop-card');
        const pTrigger = document.getElementById('header-profile-trigger');
        if (pCard && pTrigger && !pTrigger.contains(e.target)) {
            pCard.classList.remove('scale-100', 'opacity-100');
            pCard.classList.add('scale-95', 'opacity-0');
            setTimeout(() => { if(pCard.parentNode) pCard.remove() }, 200);
        }

        const nCard = document.getElementById('notif-drop-card');
        const nTrigger = document.getElementById('header-notif-trigger');
        if (nCard && nTrigger && !nTrigger.contains(e.target)) {
            nCard.classList.remove('scale-100', 'opacity-100');
            nCard.classList.add('scale-95', 'opacity-0');
            setTimeout(() => { if(nCard.parentNode) nCard.remove() }, 200);
        }
    });
}
