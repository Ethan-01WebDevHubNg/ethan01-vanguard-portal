// public/js/core/theme.js

export function initTheme() {
    // Expose global toggle function
    window.toggleTheme = function() {
        const htmlElement = document.documentElement;
        const isDark = htmlElement.classList.toggle('dark');
        
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('ethan01_theme', newTheme);
        
        // Dispatch an event so the preloader canvas can instantly update its colors
        window.dispatchEvent(new Event('themeChanged'));
        
        if (window.Toast) {
            window.Toast.show(`Switched to ${newTheme.toUpperCase()} mode.`, 'info');
        }
    };
}