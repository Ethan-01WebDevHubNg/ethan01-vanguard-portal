// public/js/core/auth.js
import { auth } from '../config/firebase-dev.js';
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

/* ==========================================================================
   10-MINUTE INACTIVITY TIMEOUT (If Not Remembered)
   ========================================================================== */

let inactivityTimer;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

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

// Bind activity listeners to reset the countdown
['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, true);
});


/* ==========================================================================
   DEVICE SECURITY: TAB VISIBILITY LOCK (Simulated)
   ========================================================================== */

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
                    const authGranted = confirm("DEVICE SECURITY LOCK\n\nPlease confirm your identity (Biometrics/FaceID/PIN) to restore your active session.");
                    if (!authGranted) {
                        if (window.Toast) window.Toast.show("Session Terminated", "error");
                        await window.processLogout();
                    } else {
                        if (window.Toast) window.Toast.show("Identity verified. Welcome back.", "success");
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


/* ==========================================================================
   FIREBASE AUTHENTICATION CORE
   ========================================================================== */

export function initAuthObserver() {
    onAuthStateChanged(auth, async (user) => {
        window.authInitialized = true; 
        const currentHash = window.location.hash;
        
        // CRITICAL FIX: Persist role across hard browser reloads
        if (!window.currentUserRole) {
            window.currentUserRole = sessionStorage.getItem('ethan01_user_role') || (currentHash.startsWith('#/admin') ? 'admin' : 'client');
        }
        
        if (user) {
            const rememberDevice = localStorage.getItem('ethan01_remember_device') === 'true';
            const sessionVerified = sessionStorage.getItem('ethan01_device_verified') === 'true';
            
            if (rememberDevice && !sessionVerified && (currentHash === '#/admin/auth' || currentHash === '#/login' || currentHash === '' || currentHash === '#/')) {
                const authGranted = confirm("DEVICE SECURITY LOCK\n\nPlease confirm your identity (Biometrics/FaceID/PIN) to restore your active session.");
                if (!authGranted) {
                    if (window.Toast) window.Toast.show("Session Terminated", "error");
                    await window.processLogout();
                    return;
                }
                sessionStorage.setItem('ethan01_device_verified', 'true');
                if (window.Toast) window.Toast.show("Identity verified. Welcome back.", "success");
            }

            window.currentUser = user;
            resetInactivityTimer(); // Start tracking immediately
            
            if (currentHash === '#/admin/auth' || currentHash === '#/login' || currentHash === '' || currentHash === '#/') {
                if (window.currentUserRole === 'client') {
                    window.location.hash = '#/dashboard';
                } else {
                    window.location.hash = '#/admin/dashboard';
                }
            } else {
                window.dispatchEvent(new Event('hashchange'));
            }
            
            window.dispatchEvent(new Event('profileLoaded'));
        } else {
            window.currentUser = null;
            window.currentUserRole = null;
            if (inactivityTimer) clearTimeout(inactivityTimer);
            
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

window.processLogin = async function(event, formElement, routeType) {
    event.preventDefault();
    
    const btn = formElement.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Authenticating...`;
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

        // Database Authentication
        await signInWithEmailAndPassword(auth, email, password);
        
        window.currentUserRole = routeType; 
        sessionStorage.setItem('ethan01_user_role', routeType); // CRITICAL: Persist role to storage
        sessionStorage.setItem('ethan01_device_verified', 'true'); 
        
        if (window.Toast) window.Toast.show("Authentication successful.", "success");
        
        if (routeType === 'admin') {
            window.location.hash = '#/admin/dashboard';
        } else {
            window.location.hash = '#/dashboard';
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
    if(event) event.preventDefault(); 
    try {
        const wasAdmin = window.location.hash.startsWith('#/admin');
        
        // 1. Synchronous Wipe
        window.currentUserRole = null; 
        window.currentUser = null;
        sessionStorage.clear(); // This clears ethan01_user_role as well
        localStorage.removeItem('ethan01_remember_device'); 
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        // 2. DOM Wipe
        const mainContent = document.getElementById('main-content') || document.querySelector('main');
        if (mainContent) mainContent.innerHTML = '';
        
        // 3. DB Sever
        await signOut(auth);
        
        if (window.Toast) window.Toast.show("Session Terminated", "info");
        window.location.hash = wasAdmin ? '#/admin/auth' : '#/login';
    } catch (error) {
        console.error("Logout error:", error);
    }
};