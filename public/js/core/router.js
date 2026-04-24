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
    
    // NEW: Map project URLs to existing templates to prevent 404
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

export async function handleLocation() {
    let path = window.location.hash;

    if (path === '' || path === '#/') {
        if (!window.currentUser) {
            window.location.hash = '#/login';
            return;
        }
        path = window.currentUserRole === 'client' ? '#/dashboard' : '#/admin/dashboard';
        window.location.hash = path;
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

    const route = routes[path] || routes[404];

    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`Template fetch failed for ${route}`);
        
        const html = await response.text();
        const appContainer = document.getElementById('main-content') || document.querySelector('main');
        
        if (appContainer) {
            appContainer.innerHTML = html;
        }

        // Re-trigger global listeners after DOM injection
        if (window.currentUser) {
            window.dispatchEvent(new Event('profileLoaded'));
        }

    } catch (error) {
        console.error("Router Error:", error);
        window.location.hash = '#/404';
    }
}