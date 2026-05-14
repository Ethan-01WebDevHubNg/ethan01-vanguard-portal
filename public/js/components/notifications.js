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
                const user = window.ethan01_currentUser || { 
                    fullName: 'Authorized User', 
                    email: '--', 
                    role: 'Staff' 
                };
                
                let displayName = user.fullName;
                if (!displayName && window.currentUser) {
                    displayName = window.currentUser.displayName || window.currentUser.email.split('@')[0];
                }

                dropCard = document.createElement('div');
                dropCard.id = 'profile-drop-card';
                dropCard.className = 'absolute top-12 right-[-10px] w-[260px] sm:w-60 transform scale-95 opacity-0 origin-top-right transition-all duration-200 z-[100] cursor-default';
                
                dropCard.innerHTML = `
                    <div class="absolute -top-1.5 right-[18px] w-3 h-3 bg-surface-container-high border-[1.5px] border-[var(--input-border)] border-b-transparent border-r-transparent transform rotate-45 z-20 rounded-tl-[2px]"></div>
                    
                    <div class="bg-surface-container-high border-[1.5px] border-[var(--input-border)] rounded-xl shadow-2xl overflow-hidden relative z-10 w-full shadow-[var(--input-shadow)]">
                        <div class="px-4 py-4 border-b border-[var(--input-border)]">
                            <p class="text-sm font-bold text-on-surface truncate">${displayName || 'Authorized User'}</p>
                            <p class="text-[10px] text-on-surface-variant truncate mt-0.5">${user.email || window.currentUser?.email || '--'}</p>
                            <p class="text-[9px] text-primary font-bold uppercase tracking-widest mt-2">${window.currentUserRole === 'admin' || window.currentUserRole === 'Super Admin' ? 'Super Admin' : 'Client'}</p>
                        </div>
                        <div class="p-1.5">
                            <a href="#" onclick="if(window.processLogout) window.processLogout(event);" class="block px-3 py-2.5 text-xs font-bold text-error hover:bg-error/10 transition-colors rounded-lg flex items-center gap-2">
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

    // 2. Real-time Notification Engine
    window.vanguardNotifications = [];
    window.unreadNotifCount = 0;

    const initNotifListener = async () => {
        if (window.notifListenerAttached) return;
        try {
            const { collection, query, orderBy, limit, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const { db } = await import('/js/config/firebase-dev.js');

            const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(25));

            onSnapshot(q, (snap) => {
                window.vanguardNotifications = [];
                window.unreadNotifCount = 0;
                
                const isAdmin = ['admin', 'Super Admin', 'SuperAdmin'].includes(window.currentUserRole);

                snap.forEach(doc => {
                    const notif = { id: doc.id, ...doc.data() };
                    
                    let isVisible = false;
                    if (isAdmin) {
                        isVisible = true;
                    } else if (window.activeClientData) {
                        if (notif.targetId === window.activeClientData.id) isVisible = true;
                        if (window.clientProjects && window.clientProjects.some(p => p.id === notif.targetId)) isVisible = true;
                    }

                    if (isVisible) {
                        window.vanguardNotifications.push(notif);
                        if (!notif.read) window.unreadNotifCount++;
                    }
                });

                const trigger = document.getElementById('header-notif-trigger');
                if (trigger) {
                    let badge = document.getElementById('notif-badge');
                    if (window.unreadNotifCount > 0) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.id = 'notif-badge';
                            badge.className = 'absolute top-0 right-0 w-2.5 h-2.5 bg-error border-2 border-[var(--color-surface-highest-alpha)] rounded-full animate-pulse';
                            trigger.appendChild(badge);
                        }
                    } else if (badge) {
                        badge.remove();
                    }
                }

                if (document.getElementById('notif-drop-card')) {
                    renderNotificationList();
                }
            });
            window.notifListenerAttached = true;
        } catch (e) {
            console.error('Notification Engine Sync Failed:', e);
        }
    };

    const renderNotificationList = () => {
        const container = document.getElementById('notification-list-container');
        const countEl = document.getElementById('notification-count');
        if (!container) return;

        if (countEl) countEl.innerText = `${window.unreadNotifCount} New`;

        if (window.vanguardNotifications.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center opacity-50">
                    <span class="material-symbols-outlined text-on-surface-variant text-3xl mb-2">notifications_paused</span>
                    <p class="text-xs font-bold text-on-surface-variant">No system updates yet.</p>
                </div>`;
            return;
        }

        let html = '';
        window.vanguardNotifications.forEach(n => {
            const timeStr = n.timestamp ? new Date(n.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
            const unreadIndicator = !n.read ? `<span class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary-glow)] shrink-0 mt-1.5"></span>` : '<span class="w-1.5 h-1.5 rounded-full bg-transparent shrink-0 mt-1.5"></span>';
            const bgClass = !n.read ? 'bg-surface-container-highest/50' : 'bg-transparent';
            
            const rawUid = n.effectorUid || 'System';
            const shortUid = rawUid.length > 8 ? rawUid.substring(0, 8) + '...' : rawUid;
            const displayName = n.effectorName || 'System';
            const formattedInitiator = `${displayName} (${shortUid})`;
            
            html += `
                <div class="p-4 border-b border-[var(--input-border)] last:border-0 hover:bg-surface-container transition-colors cursor-pointer flex gap-3 ${bgClass}" onclick="window.markNotifRead('${n.id}')">
                    ${unreadIndicator}
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold text-on-surface mb-0.5 truncate">${n.title}</p>
                        <p class="text-[10px] text-on-surface-variant leading-relaxed pr-2">${n.message}</p>
                        <p class="text-[8px] font-mono text-on-surface-variant uppercase tracking-widest mt-2 border-t border-outline-variant pt-1.5 block">Initiator: <span class="text-primary">${formattedInitiator}</span></p>
                        <p class="text-[8px] font-mono text-on-surface-variant opacity-70 uppercase tracking-widest mt-1">${timeStr}</p>
                    </div>
                </div>`;
        });
        container.innerHTML = html;
    };

    window.markNotifRead = async function(id) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const { db } = await import('/js/config/firebase-dev.js');
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) {
            console.error('Failed to mark notification read', e);
        }
    };

    setTimeout(initNotifListener, 1000);

    // 3. Setup Notification Drop Card UI Shell
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
                    <div class="absolute -top-1.5 right-[68px] sm:right-[18px] w-3 h-3 bg-surface-container-high border-[1.5px] border-[var(--input-border)] border-b-transparent border-r-transparent transform rotate-45 z-20 rounded-tl-[2px]"></div>
                    
                    <div class="bg-surface-container-high border-[1.5px] border-[var(--input-border)] rounded-xl shadow-2xl overflow-hidden relative z-10 w-full shadow-[var(--input-shadow)]">
                        <div class="px-4 py-3 border-b border-[var(--input-border)] flex justify-between items-center bg-surface-container-highest/30">
                            <p class="text-[10px] font-bold text-on-surface uppercase tracking-widest">System Alerts</p>
                            <span id="notification-count" class="text-[10px] text-on-surface-variant font-bold text-primary">${window.unreadNotifCount} New</span>
                        </div>
                        <div id="notification-list-container" class="max-h-[350px] overflow-y-auto no-scrollbar">
                            <div class="p-6 text-center opacity-50">
                                <span class="material-symbols-outlined animate-spin text-primary text-3xl mb-2">sync</span>
                                <p class="text-xs font-bold text-on-surface-variant">Syncing with eth-db...</p>
                            </div>
                        </div>
                    </div>
                `;
                notifTrigger.appendChild(dropCard);
                renderNotificationList(); 
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

    // 4. Global Click Listener
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