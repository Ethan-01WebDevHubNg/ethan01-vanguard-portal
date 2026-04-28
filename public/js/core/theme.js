// public/js/core/theme.js

export function initTheme() {
    // 1. Immediately enforce stored state on script load
    const storedTheme = localStorage.getItem('ethan01_theme') || 'dark';
    if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 2. The live toggle engine
    window.toggleTheme = function() {
        const htmlElement = document.documentElement;
        
        // Instantly toggle the class tied to main.css to trigger a live repaint
        const isDark = htmlElement.classList.toggle('dark');
        
        // Persist the state so index.html catches it on the next hard reload
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('ethan01_theme', newTheme);
        
        // Dispatch event for JS-dependent components (like your loader canvas)
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        
        if (window.Toast) {
            window.Toast.show(`Switched to ${newTheme.toUpperCase()} mode.`, 'info');
        }
    };

    // 3. Global utility for client dynamic coloring
    window.getSmartColor = function(baseHexCode) {
        // Read directly from the DOM class to determine active state
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        return adjustColorLuminance(baseHexCode, currentTheme);
    };
}

function adjustColorLuminance(hex, theme) {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    let lumAdjustment = 0;

    if (theme === 'light') {
        if (luminance > 0.55) lumAdjustment = -0.30; 
        else lumAdjustment = -0.15; 
    } else {
        if (luminance < 0.35) lumAdjustment = 0.30; 
        else lumAdjustment = 0.10; 
    }

    r = Math.round(Math.min(Math.max(0, r + (r * lumAdjustment)), 255)).toString(16);
    g = Math.round(Math.min(Math.max(0, g + (g * lumAdjustment)), 255)).toString(16);
    b = Math.round(Math.min(Math.max(0, b + (b * lumAdjustment)), 255)).toString(16);

    return `#${("00" + r).slice(-2)}${("00" + g).slice(-2)}${("00" + b).slice(-2)}`;
}