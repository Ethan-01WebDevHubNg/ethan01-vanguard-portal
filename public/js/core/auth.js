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
window.currentUserRole = null; // Explicitly initialize the role tracker

export function initAuthObserver() {
    onAuthStateChanged(auth, (user) => {
        const currentHash = window.location.hash;
        
        if (user) {
            window.currentUser = user;
            
            // Route to dashboard if authenticated
            if (currentHash === '#/admin/auth' || currentHash === '#/login' || currentHash === '') {
                // Rely on the JIT role assigned during login, default to admin if somehow missing 
                // but user is authenticated in an admin context
                if (window.currentUserRole === 'client') {
                    window.location.hash = '#/dashboard';
                } else {
                    window.location.hash = '#/admin/dashboard';
                }
            }
            
            // Signal UI to drop the preloader instantly
            window.dispatchEvent(new Event('profileLoaded'));
        } else {
            window.currentUser = null;
            window.currentUserRole = null;
            
            const publicRoutes = ['#/login', '#/admin/auth', '#/forgot-password', '#/admin/forgot-password', '', '#/', '#/404', '#/500', '#/403', '#/offline'];
            const isProtectedRoute = !publicRoutes.includes(currentHash);
            
            if (isProtectedRoute && currentHash !== '') {
                if (currentHash.startsWith('#/admin')) {
                    window.location.hash = '#/admin/auth';
                } else {
                    window.location.hash = '#/login';
                }
            } else {
                // Drop preloader for public routes (like the login page)
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

        // 1. Authenticate with LIVE Firebase SDK using your test credentials
        await signInWithEmailAndPassword(auth, email, password);
        
        // 2. CRITICAL JIT ROLE ASSIGNMENT:
        // Firebase Auth doesn't return app-specific roles natively. We inject it here
        // so router.js knows whether to allow access to /admin/* or client routes.
        window.currentUserRole = routeType; 
        
        if (window.Toast) window.Toast.show("Authentication successful.", "success");
        
        // 3. Trigger the route manually for immediate UX (observer will also catch this)
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
        
        // Reset button state on failure
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.processLogout = async function() {
    try {
        const wasAdmin = window.location.hash.startsWith('#/admin');
        await signOut(auth);
        
        // Clear local state
        window.currentUserRole = null; 
        
        if (window.Toast) window.Toast.show("Securely disconnected.", "info");
        window.location.hash = wasAdmin ? '#/admin/auth' : '#/login';
    } catch (error) {
        console.error("Logout error:", error);
    }
};