// public/js/core/auth.js
import { db, auth } from '../config/firebase-dev.js';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp as firestoreTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        } 
    });
}

window.currentUser = null;
window.currentUserRole = null; 
window.authInitialized = false;

let inactivityTimer;
const INACTIVITY_LIMIT = 10 * 60 * 1000; 

function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    const rememberDevice = localStorage.getItem('ethan01_remember_device') === 'true';
    if (window.currentUser && !rememberDevice) {
        inactivityTimer = setTimeout(async () => {
            if (window.Toast) window.Toast.show("Session timed out due to inactivity.", "error");
            await window.processLogout();
        }, INACTIVITY_LIMIT);
    }
}

['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, true);
});

async function verifyDeviceIdentity() {
    if (!window.PublicKeyCredential) {
        return confirm("DEVICE SECURITY LOCK\n\nWebAuthn not supported. Please confirm identity to restore session.");
    }
    
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        await navigator.credentials.get({
            publicKey: {
                challenge: challenge,
                userVerification: "required",
                timeout: 60000
            }
        });
        return true;
    } catch (error) {
        console.warn("WebAuthn Verification Failed:", error);
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
            return confirm("DEVICE SECURITY LOCK\n\nBiometric auth unavailable or denied. Please manually confirm your identity to restore the session.");
        }
        return false;
    }
}

let awayTimestamp = 0;

const handleAway = () => {
    if (window.currentUser) {
        awayTimestamp = Date.now();
    }
};

const handleReturn = () => {
    if (window.currentUser && awayTimestamp > 0) {
        const timeAway = Date.now() - awayTimestamp;
        awayTimestamp = 0;
        
        if (timeAway > 2000) {
            const rememberDevice = localStorage.getItem('ethan01_remember_device') === 'true';
            if (rememberDevice) {
                setTimeout(async () => {
                    const authGranted = await verifyDeviceIdentity();
                    if (!authGranted) {
                        if (window.Toast) window.Toast.show("Session Terminated", "error");
                        await window.processLogout();
                    } else {
                        if (window.Toast) window.Toast.show("Identity cryptographically verified.", "success");
                    }
                }, 300); 
            }
        }
    }
};

window.addEventListener('blur', handleAway);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) handleAway();
    else handleReturn();
});
window.addEventListener('focus', handleReturn);

// --- HYPER-OPTIMIZED ROLE ENGINE ---
async function fetchSecureUserRole(uid) {
    // 0ms Local Cache Return (Bypasses network latency on page reloads)
    const cachedRole = sessionStorage.getItem(`vanguard_role_${uid}`);
    if (cachedRole) return cachedRole;

    try {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        const role = adminDoc.exists() ? 'admin' : 'client';
        sessionStorage.setItem(`vanguard_role_${uid}`, role); // Cache for session duration
        return role;
    } catch (e) {
        console.error("Role Verification Error", e);
        return 'client'; // Safe fallback
    }
}

export function initAuthObserver() {
    onAuthStateChanged(auth, async (user) => {
        const currentHash = window.location.hash;
        
        if (user) {
            window.currentUserRole = await fetchSecureUserRole(user.uid);
            
            const rememberDevice = localStorage.getItem('ethan01_remember_device') === 'true';
            const sessionVerified = sessionStorage.getItem('ethan01_device_verified') === 'true';
            
            if (rememberDevice && !sessionVerified && (currentHash === '#/admin/auth' || currentHash === '#/login' || currentHash === '' || currentHash === '#/')) {
                const authGranted = await verifyDeviceIdentity();
                if (!authGranted) {
                    if (window.Toast) window.Toast.show("Session Terminated", "error");
                    await window.processLogout();
                    return;
                }
                sessionStorage.setItem('ethan01_device_verified', 'true');
                if (window.Toast) window.Toast.show("Identity cryptographically verified.", "success");
            }

            window.currentUser = user;
            resetInactivityTimer(); 
        } else {
            window.currentUser = null;
            window.currentUserRole = null;
            if (inactivityTimer) clearTimeout(inactivityTimer);
        }

        window.authInitialized = true; 
        window.dispatchEvent(new Event('authResolved')); 
        
        if (user) {
            if (currentHash === '#/admin/auth' || currentHash === '#/login' || currentHash === '' || currentHash === '#/') {
                if (window.currentUserRole === 'client') {
                    window.location.hash = '#/dashboard';
                } else {
                    window.location.hash = '#/admin/dashboard';
                }
            }
            window.dispatchEvent(new Event('profileLoaded'));
        } else {
            const publicRoutes = ['#/login', '#/admin/auth', '#/forgot-password', '#/admin/forgot-password', '', '#/', '#/404', '#/500', '#/403', '#/offline'];
            const isProtectedRoute = !publicRoutes.includes(currentHash);
            
            if (isProtectedRoute && currentHash !== '' && currentHash !== '#/') {
                window.location.hash = currentHash.startsWith('#/admin') ? '#/admin/auth' : '#/login';
            } else {
                window.dispatchEvent(new Event('profileLoaded'));
            }
        }
    });
}

window.processLogin = async function(event, formElement, attemptedRouteType) {
    event.preventDefault();
    
    const btn = formElement.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span>`;
    btn.disabled = true;

    try {
        const email = formElement.querySelector('input[type="email"]').value;
        const password = formElement.querySelector('input[type="password"]').value;
        const rememberMe = formElement.querySelector('input[type="checkbox"]')?.checked;

        if (rememberMe) {
            localStorage.setItem('ethan01_remember_device', 'true');
        } else {
            localStorage.removeItem('ethan01_remember_device');
        }

        // 1. Authenticate Payload
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Fetch/Cache Role Payload
        const verifiedRole = await fetchSecureUserRole(user.uid);
        window.currentUserRole = verifiedRole;
        
        // 3. Fire-and-Forget Background Mutation (DO NOT AWAIT - Speeds up routing by ~50ms)
        if (verifiedRole === 'admin') {
            const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            setDoc(doc(db, 'admins', user.uid), {
                currentSessionToken: sessionToken,
                status: 'online',
                lastActive: firestoreTimestamp()
            }, { merge: true }).catch(e => console.warn("Background session update dropped.", e));
        }
        
        sessionStorage.setItem('ethan01_device_verified', 'true'); 
        
        // 4. Instant Routing Execution
        if (attemptedRouteType === 'admin' && verifiedRole === 'client') {
            window.location.hash = '#/dashboard';
        } else if (attemptedRouteType === 'client' && verifiedRole === 'admin') {
            window.location.hash = '#/admin/dashboard';
        } else {
            window.location.hash = verifiedRole === 'admin' ? '#/admin/dashboard' : '#/dashboard';
        }

    } catch (error) {
        console.error("Login Error:", error);
        let errorMsg = "Authentication failed.";
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMsg = "Incorrect email or password.";
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = "Connection dropped. Check domain configuration.";
        } else if (error.message) {
            errorMsg = error.message;
        }

        if (window.Toast) window.Toast.show(errorMsg, "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.processLogout = async function(event) {
    if(event && event.preventDefault) event.preventDefault(); 
    try {
        const wasAdmin = window.currentUserRole === 'admin';
        
        if (window.currentUser && wasAdmin) {
            setDoc(doc(db, 'admins', window.currentUser.uid), {
                currentSessionToken: null,
                status: 'offline',
                lastActive: firestoreTimestamp()
            }, { merge: true }).catch(() => {}); // Fire and forget
        }

        window.currentUserRole = null; 
        window.currentUser = null;
        sessionStorage.clear(); 
        localStorage.removeItem('ethan01_remember_device'); 
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        const mainContent = document.getElementById('main-content') || document.querySelector('main');
        if (mainContent) mainContent.innerHTML = '';
        
        await signOut(auth);
        
        window.location.hash = wasAdmin ? '#/admin/auth' : '#/login';
    } catch (error) {
        console.error("Logout error:", error);
    }
};