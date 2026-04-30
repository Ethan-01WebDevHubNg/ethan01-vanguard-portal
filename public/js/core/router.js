// public/js/core/router.js

const routes = {
    404: '/templates/shared/404.html',
    403: '/templates/shared/403.html',
    '#/offline': '/templates/shared/offline.html',
    '#/login': '/templates/client/login.html',
    '#/admin/auth': '/templates/admin/login.html',
    '#/forgot-password': '/templates/client/forgot_password.html',
    '#/admin/forgot-password': '/templates/admin/forgot_password.html',
    '#/admin/dashboard': '/templates/admin/dashboard.html',
    '#/admin/clients': '/templates/admin/client_directory.html',
    '#/admin/project/view': '/templates/admin/command_center.html',
    '#/admin/project/new': '/templates/admin/setup_wizard.html',
    '#/admin/setup': '/templates/admin/setup_wizard.html',
    '#/admin/command': '/templates/admin/command_center.html',
    '#/admin/settings': '/templates/admin/system_settings.html',
    '#/admin/team': '/templates/admin/team.html',
    '#/dashboard': '/templates/client/dashboard.html',
    '#/files': '/templates/client/files_billing.html',
    '#/settings': '/templates/client/settings.html'
};

// Tracking for smart routing returns
window.ethan01_previousRoute = window.ethan01_previousRoute || '#/';
window.ethan01_currentRoute = window.ethan01_currentRoute || '#/';

window.returnToPreviousRoute = function() {
    if (window.ethan01_previousRoute && window.ethan01_previousRoute !== '#/404') {
        window.location.hash = window.ethan01_previousRoute;
    } else {
        window.location.hash = window.currentUserRole === 'admin' ? '#/admin/dashboard' : '#/dashboard';
    }
};

window.addEventListener('online', () => {
    if (window.location.hash === '#/offline') {
        if (window.Toast) window.Toast.show("Connection restored. Returning to workspace...", "success");
        window.returnToPreviousRoute();
    }
});

export async function handleLocation() {
    let path = window.location.hash;

    // SECURITY: Anti-directory listing & path injection block
    if (path.includes('.html') || path.includes('/templates/') || (path.endsWith('/') && path !== '#/')) {
        console.warn("Security Alert: Direct template directory access blocked.");
        window.location.hash = '#/403';
        return;
    }

    // ISSUE 1 FIX: Immediately route raw root domain to #/login
    // If a session exists, the Auth Observer will instantly bounce them to the Dashboard.
    if (path === '' || path === '#/') {
        window.location.hash = '#/login';
        return; 
    }

    const publicRoutes = ['#/login', '#/admin/auth', '#/forgot-password', '#/admin/forgot-password', '#/404', '#/500', '#/403', '#/offline'];
    const isProtectedRoute = !publicRoutes.includes(path);

    // STRICT PERSISTENCE GUARD: If Firebase has initialized but the user is null, 
    // immediately kick out direct URL injection attempts to protected paths.
    if (isProtectedRoute && window.authInitialized && !window.currentUser) {
        window.location.hash = path.startsWith('#/admin') ? '#/admin/auth' : '#/login';
        return;
    }

    // Strict FSD RBAC Protection
    if (window.currentUser) {
        const isAdminRoute = path.startsWith('#/admin') && !path.includes('auth') && !path.includes('forgot');
        const isClientRoute = path.startsWith('#/') && !path.startsWith('#/admin') && !path.includes('login') && !path.includes('forgot');

        if (isAdminRoute && window.currentUserRole === 'client') {
            window.location.hash = '#/403';
            return;
        }
        if (isClientRoute && window.currentUserRole !== 'client' && window.currentUserRole !== null) {
            window.location.hash = '#/admin/dashboard';
            return;
        }
    }

    if (path !== '#/404' && path !== '#/offline' && path !== '#/403' && path !== '#/500') {
        window.ethan01_previousRoute = window.ethan01_currentRoute;
        window.ethan01_currentRoute = path;
    }

    const route = routes[path] || routes[404];

    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`Template fetch failed for ${route}`);
        
        const html = await response.text();
        const appContainer = document.getElementById('main-content') || document.querySelector('main');
        
        if (appContainer) {
            appContainer.innerHTML = html;
        }

        if (window.currentUser) {
            window.dispatchEvent(new Event('profileLoaded'));
        }

    } catch (error) {
        console.error("Router Error:", error);
        window.location.hash = '#/404';
    }
}