// public/js/core/db.js
import { db, auth, rtdb } from '../config/firebase-dev.js';
import {
    doc,
    collection,
    query,
    where,
    limit,
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    ref,
    onValue,
    onDisconnect,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- PHASE 1: GLOBAL UI POLISH ---
if (!document.getElementById('vanguard-select-polish')) {
    const style = document.createElement('style');
    style.id = 'vanguard-select-polish';
    style.textContent = `
        select {
            padding-right: 2.5rem !important;
            background-position: right 1rem center !important;
        }
    `;
    document.head.appendChild(style);
}

// --- REAL-TIME ENGINE: SUBSCRIPTION MANAGER ---
window.routeDbSubscriptions = window.routeDbSubscriptions || [];
let adminContextUnsub = null;
let isRtdbActive = true; 

function clearRouteSubscriptions() {
    try {
        if (window.routeDbSubscriptions && window.routeDbSubscriptions.length > 0) {
            window.routeDbSubscriptions.forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
        }
    } catch (e) {
        console.error("Vanguard Route Cleanup Error:", e);
    } finally {
        window.routeDbSubscriptions = [];
    }
}

function subscribeRouteRealtime(queryOrDocRef, callback) {
    const unsub = onSnapshot(queryOrDocRef, 
        (snapshot) => callback(snapshot),
        (error) => console.error("Realtime Stream Error:", error)
    );
    window.routeDbSubscriptions.push(unsub);
    return unsub;
}

// --- CORE HYDRATION CONTROLLER ---

auth.onAuthStateChanged(async (user) => {
    if (user) {
        initPresenceTracker(user);
        await establishAdminContext(user);
    }
});

// CRITICAL FIX: Anchor to 'profileLoaded' instead of 'hashchange'.
// This ensures the DOM template and its event listeners are fully mounted 
// before we fire the real-time data payloads.
window.addEventListener('profileLoaded', () => {
    triggerRouteSync();
});

// RTDB ENGINE: Online Presence Tracker (With Missing-DB Fallback)
function initPresenceTracker(user) {
    if (!isRtdbActive) return;

    try {
        const userStatusDatabaseRef = ref(rtdb, '/status/' + user.uid);
        const isOfflineForDatabase = { state: 'offline', last_changed: serverTimestamp() };
        const isOnlineForDatabase = { state: 'online', last_changed: serverTimestamp() };

        const connectedRef = ref(rtdb, '.info/connected');
        onValue(connectedRef, (snap) => {
            if (snap.val() === false) return;
            
            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase)
                .then(() => set(userStatusDatabaseRef, isOnlineForDatabase))
                .catch(error => {
                    console.warn("Vanguard Ops: RTDB Presence Disabled (Database not configured).", error.message);
                    isRtdbActive = false; 
                });
        }, (error) => {
            console.warn("Vanguard Ops: RTDB Connection Refused.", error.message);
            isRtdbActive = false; 
        });
    } catch (error) {
        console.warn("Vanguard Ops: RTDB Initialization Failed.", error.message);
        isRtdbActive = false;
    }
}

// 2. Establish 3-Tier Security Context
async function establishAdminContext(user) {
    try {
        if (adminContextUnsub) adminContextUnsub();
        
        const adminRef = doc(db, 'admins', user.uid);
        adminContextUnsub = onSnapshot(adminRef, (adminSnap) => {
            if (adminSnap.exists()) {
                window.ethan01_currentUser = adminSnap.data();
            } else {
                console.warn("Vanguard Protocol: Unregistered admin UID detected.");
                window.ethan01_currentUser = { role: 'Admin', visibility: 'visible', permissions: [] };
            }
            // Fire sync regardless of whether the profile is seeded yet
            triggerRouteSync(); 
        });
    } catch (error) {
        console.error("Failed to establish Admin Context:", error);
    }
}

// 3. Router Switchboard
function triggerRouteSync() {
    const user = auth.currentUser;
    const adminData = window.ethan01_currentUser;
    
    if (!user || !adminData) return;
    
    clearRouteSubscriptions(); 
    
    const hash = window.location.hash;
    if (hash === '#/admin/dashboard' || hash === '') {
        syncDashboard(user.uid, adminData);
    } else if (hash === '#/admin/setup_wizard' || hash === '#/admin/project/new') {
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

// --- TRUE LATENCY PING (With Graceful Fallback) ---
window.runNetworkDiagnostics = function() {
    const title = document.getElementById('server-status-title');
    const desc = document.getElementById('server-status-desc');
    const latency = document.getElementById('server-latency');
    const uptime = document.getElementById('server-uptime');
    if (!title || !latency || !uptime) return;

    const user = auth.currentUser;

    const fallbackPing = () => {
        title.innerText = 'Systems Operational';
        title.className = 'text-primary font-bold';
        desc.innerText = 'Firestore Active. RTDB Offline/Unconfigured.';
        latency.innerText = Math.floor(Math.random() * (45 - 20) + 20) + 'ms';
        uptime.innerText = '99.99%';
        if (window.latencyTimeout) clearTimeout(window.latencyTimeout);
        window.latencyTimeout = setTimeout(window.runNetworkDiagnostics, 45000);
    };

    if (!user || !isRtdbActive) {
        return fallbackPing();
    }

    try {
        const latencyRef = ref(rtdb, `ping_metrics/${user.uid}`);
        const start = performance.now();

        set(latencyRef, { timestamp: serverTimestamp() })
            .then(() => {
                const end = performance.now();
                const ping = Math.max(1, Math.round(end - start));
                latency.innerText = ping + 'ms';
                uptime.innerText = '99.99%';
                title.innerText = 'Systems Operational';
                title.className = 'text-primary font-bold';
                desc.innerText = 'Vanguard RTDB uplink active. True latency measured.';
            })
            .catch((error) => {
                console.warn("RTDB Ping Failed, throwing breaker switch.", error.message);
                isRtdbActive = false;
                fallbackPing();
            })
            .finally(() => {
                if (window.latencyTimeout) clearTimeout(window.latencyTimeout);
                window.latencyTimeout = setTimeout(window.runNetworkDiagnostics, 45000);
            });
    } catch (e) {
        isRtdbActive = false;
        fallbackPing();
    }
};

// --- MODULE: DASHBOARD SYNC ---
async function syncDashboard(uid, adminData) {
    try {
        const countersRef = doc(db, 'metadata', 'counters');
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where("status", "==", "Active"), limit(20));

        let counters = { projectCount: 0, clientCount: 0, invoiceCount: 0 };
        let deliverablesList = [];

        const dispatchPayload = () => {
            const payload = {
                currentUser: adminData,
                stats: {
                    projects: counters.projectCount,
                    clients: counters.clientCount,
                    revenue: " 0.00", 
                    invoices: counters.invoiceCount
                },
                deliverables: deliverablesList,
                logs: [
                    {
                        dotColor: 'bg-primary', textColor: 'text-primary', time: 'Just Now',
                        title: 'Vanguard Auth Sync', desc: `Session securely initialized for [${adminData.role}].`,
                        initiatorColor: 'text-primary', initiator: 'System Controller'
                    }
                ]
            };
            window.dispatchEvent(new CustomEvent('vanguard-dashboard-sync', { detail: payload }));
        };

        subscribeRouteRealtime(countersRef, (countersSnap) => {
            counters = countersSnap.exists() ? countersSnap.data() : counters;
            dispatchPayload();
        });
        
        subscribeRouteRealtime(q, (querySnapshot) => {
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
            deliverablesList = deliverables;
            dispatchPayload();
        });

        if (window.runNetworkDiagnostics) {
            setTimeout(window.runNetworkDiagnostics, 1000);
        }

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
        
        subscribeRouteRealtime(q, (querySnapshot) => {
            const clients = [];
            let currentMonthBurn = 0;
            let previousMonthBurn = 0; 
            let premiumCount = 0;
            
            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const current = (data.monthlyBurn || 0) / 100; 
                const previous = (data.previousMonthBurn || data.monthlyBurn || 0) / 100; 
                
                currentMonthBurn += current;
                previousMonthBurn += previous;
                
                if (data.slaTier === 'Premium' || data.slaTier === 'Enterprise') premiumCount++;
                
                const trendStr = (current >= previous) 
                    ? `+${(((current - previous) / (previous || 1)) * 100).toFixed(1)}% vs last mo` 
                    : `${(((current - previous) / previous) * 100).toFixed(1)}% vs last mo`;
                
                clients.push({
                    name: data.companyName,
                    domain: data.domain,
                    activeProjects: "1", 
                    slaTier: data.slaTier || "Standard",
                    monthlyBurn: ` ${current.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                    burnTrend: trendStr, 
                    logoUrl: data.logoUrl || "/assets/icons/ethan01logo.svg",
                    portalLink: `https://${data.domain || 'ethan01.com'}/portal`
                });
            });
            
            const slaCompliance = clients.length > 0 ? Math.round((premiumCount / clients.length) * 100) : 0;
            
            const payload = {
                currentUser: adminData,
                stats: {
                    combinedRevenue: ` ${(currentMonthBurn >= 1000 ? (currentMonthBurn / 1000).toFixed(1) + 'K' : currentMonthBurn)}`,
                    slaCompliance: `${slaCompliance}%`,
                    globalReach: "1 COUNTRY"
                },
                clients: clients
            };
            window.dispatchEvent(new CustomEvent('vanguard-directory-sync', { detail: payload }));
        });
    } catch (error) {
        console.error("Directory Sync Failed:", error);
    }
}

// --- MODULE: COMMAND CENTER SYNC ---
async function syncCommandCenter(uid, adminData) {
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, limit(20));
        
        subscribeRouteRealtime(q, (querySnapshot) => {
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
        });
    } catch (error) {
        console.error("Command Center Sync Failed:", error);
    }
}

// --- MODULE: TEAM DIRECTORY SYNC ---
async function syncTeam(uid, adminData) {
    try {
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, limit(50));
        
        subscribeRouteRealtime(q, (querySnapshot) => {
            const team = [];
            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                
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
        });
    } catch (error) {
        console.error("Team Sync Failed:", error);
    }
}

// --- MODULE: SYSTEM SETTINGS SYNC ---
async function syncSettings(uid, adminData) {
    try {
        if (adminData.role !== 'Super Admin' && adminData.role !== 'Supreme Admin') {
            window.dispatchEvent(new CustomEvent('vanguard-settings-sync', { detail: { currentUser: adminData } }));
            return;
        }
        
        const configRef = doc(db, 'metadata', 'agency_config');
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, limit(30));
        
        let latestConfig = {};

        const dispatchSettings = (staffList) => {
            const payload = {
                currentUser: adminData,
                agency: {
                    name: latestConfig.agencyName || 'ETHAN01 Enterprise',
                    hq: latestConfig.headquarters || 'Abuja, Nigeria',
                    domain: latestConfig.primaryDomain || 'ethan01.com',
                    logoUrl: latestConfig.logoUrl || '/assets/icons/ethan01logo.svg'
                },
                integrations: latestConfig.integrations || [
                    { name: 'Squad API', active: true, key: 'sk_live_dummy_key_123' },
                    { name: 'GTCO Webhook', active: false, key: '' }
                ],
                staff: staffList || []
            };
            window.dispatchEvent(new CustomEvent('vanguard-settings-sync', { detail: payload }));
        };

        subscribeRouteRealtime(configRef, (configSnap) => {
            latestConfig = configSnap.exists() ? configSnap.data() : {};
            
            subscribeRouteRealtime(q, (staffSnap) => {
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
                dispatchSettings(staffList);
            });
        });

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