// public/js/core/app.js
import { handleLocation } from './router.js';
import { initAuthObserver } from './auth.js';
import { initTheme } from './theme.js';
import { initHeaderDrops } from '../components/notifications.js';
import { renderHeader } from '../components/header.js'; 
import { renderSidebar } from '../components/sidebar.js'; // NEW: Import sidebar

// RESTORED: Side-effect imports to prevent SyntaxError crashes
import '../components/Toast.js'; 
import '../components/modal.js'; 

// --- GLOBAL UI UTILITIES ---

// 1. Admin Command Center Tabs
window.switchCmdTab = function(tabId, btnElement) {
    document.querySelectorAll('.cmd-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.cmd-tab-btn').forEach(btn => {
        btn.classList.remove('text-primary', 'border-b-2', 'border-primary');
        btn.classList.add('text-on-surface-variant');
    });
    
    btnElement.classList.remove('text-on-surface-variant');
    btnElement.classList.add('text-primary', 'border-b-2', 'border-primary');
};

// 2. Client Files & Billing Tabs
window.switchClientTab = function(tabId, btnElement) {
    document.querySelectorAll('.client-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.client-tab-btn').forEach(btn => {
        btn.classList.remove('text-primary', 'border-b-2', 'border-primary');
        btn.classList.add('text-on-surface-variant');
    });
    
    btnElement.classList.remove('text-on-surface-variant');
    btnElement.classList.add('text-primary', 'border-b-2', 'border-primary');
};

// 3. Client Settings Tabs
window.switchSettingsTab = function(tabId, btnElement) {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('bg-primary/10', 'text-primary', 'border-primary/20');
        btn.classList.add('text-zinc-400', 'border-transparent', 'hover:bg-surface-container-low', 'hover:text-white');
    });
    
    btnElement.classList.remove('text-zinc-400', 'border-transparent', 'hover:bg-surface-container-low', 'hover:text-white');
    btnElement.classList.add('bg-primary/10', 'text-primary', 'border-primary/20');
};

// --- SERVICE WORKER REGISTRATION ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        });
    } else {
        console.warn('Service workers are not supported in this browser.');
    }
}

// --- NETWORK OBSERVER ---
function initNetworkObserver() {
    window.addEventListener('offline', () => {
        console.warn("Network connection lost.");
        if (window.location.hash !== '#/offline') {
            sessionStorage.setItem('ethan01_prev_route', window.location.hash);
        }
        window.location.hash = '#/offline';
        if (window.Toast) window.Toast.show("Network disconnected. Switching to offline mode.", "error");
    });

    window.addEventListener('online', () => {
        console.log("Network connection restored.");
        if (window.location.hash === '#/offline') {
            const prev = sessionStorage.getItem('ethan01_prev_route') || '#/admin/login';
            window.location.hash = prev;
        }
        if (window.Toast) window.Toast.show("Connection restored. Syncing data...", "success");
    });

    if (!navigator.onLine && window.location.hash !== '#/offline') {
        sessionStorage.setItem('ethan01_prev_route', window.location.hash);
        window.location.hash = '#/offline';
    }
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("Ethan01 Vanguard Engine Initialized.");
    
    initTheme();
    registerServiceWorker();
    initAuthObserver();
    initNetworkObserver();
    
    handleLocation().then(() => {
        renderSidebar(); // NEW: Render sidebar on initial load
        renderHeader(); 
        initHeaderDrops(); 
        
        setTimeout(() => {
            if(window.hideLoader) window.hideLoader();
        }, 1500); 
    });
});

window.addEventListener("hashchange", () => {
    handleLocation().then(() => {
        renderSidebar(); // NEW: Re-render sidebar when URL changes
        renderHeader();
        initHeaderDrops();
    });
});

// --- REAL-TIME PASSWORD ENGINE ---
window.checkPasswordStrength = function(password) {
    const strengthText = document.getElementById('strength-text');
    const bars = document.querySelectorAll('.strength-bar');
    if (!strengthText || bars.length === 0) return;

    let strength = 0;
    if (password.length > 7) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    bars.forEach(bar => {
        bar.className = 'strength-bar flex-1 bg-outline-variant rounded-full transition-colors duration-300';
        bar.style.backgroundColor = ''; 
    });

    if (password.length === 0) {
        strengthText.innerText = 'Strength: Pending';
        strengthText.className = 'text-[9px] text-zinc-500 font-bold uppercase tracking-widest';
        strengthText.style.color = '';
    } else if (strength <= 1) {
        strengthText.innerText = 'Strength: Weak';
        strengthText.className = 'text-[9px] font-bold uppercase tracking-widest';
        strengthText.style.color = 'var(--color-error)';
        bars[0].classList.remove('bg-outline-variant');
        bars[0].style.backgroundColor = 'var(--color-error)';
    } else if (strength === 2) {
        strengthText.innerText = 'Strength: Fair';
        strengthText.className = 'text-[9px] font-bold uppercase tracking-widest';
        strengthText.style.color = '#ff9800'; 
        bars[0].classList.remove('bg-outline-variant');
        bars[1].classList.remove('bg-outline-variant');
        bars[0].style.backgroundColor = '#ff9800';
        bars[1].style.backgroundColor = '#ff9800';
    } else if (strength === 3) {
        strengthText.innerText = 'Strength: Good';
        strengthText.className = 'text-[9px] font-bold uppercase tracking-widest';
        strengthText.style.color = 'var(--color-primary-container)';
        bars[0].classList.remove('bg-outline-variant');
        bars[1].classList.remove('bg-outline-variant');
        bars[2].classList.remove('bg-outline-variant');
        bars[0].style.backgroundColor = 'var(--color-primary-container)';
        bars[1].style.backgroundColor = 'var(--color-primary-container)';
        bars[2].style.backgroundColor = 'var(--color-primary-container)';
    } else {
        strengthText.innerText = 'Strength: Strong';
        strengthText.className = 'text-[9px] font-bold uppercase tracking-widest';
        strengthText.style.color = 'var(--color-primary)';
        bars.forEach(bar => {
            bar.classList.remove('bg-outline-variant');
            bar.style.backgroundColor = 'var(--color-primary)';
        });
    }
    
    const confirmInput = document.getElementById('confirm-password');
    if(confirmInput && confirmInput.value.length > 0) {
        window.checkPasswordMatch(confirmInput.value);
    }
};

window.checkPasswordMatch = function(confirmPassword) {
    const password = document.getElementById('new-password').value;
    const confirmInput = document.getElementById('confirm-password');
    
    if (confirmPassword.length === 0) {
        confirmInput.classList.remove('border-error', 'border-primary', 'focus:ring-error');
        confirmInput.classList.add('border-outline-variant', 'focus:ring-primary');
    } else if (password !== confirmPassword) {
        confirmInput.classList.remove('border-outline-variant', 'border-primary', 'focus:ring-primary');
        confirmInput.classList.add('border-error', 'focus:ring-error');
    } else {
        confirmInput.classList.remove('border-outline-variant', 'border-error', 'focus:ring-error');
        confirmInput.classList.add('border-primary', 'focus:ring-primary');
    }
};

// --- 404 SCREENSHOT FALLBACK ENGINE ---
window.handleSupportScreenshot = function() {
    let count = 3;
    const modalHtml = `
        <div class='flex flex-col items-center justify-center p-4 text-center'>
            <span class='material-symbols-outlined text-error text-4xl mb-4'>gpp_maybe</span>
            <p class='text-on-surface-variant text-sm mb-4'>System currently prohibits automated screenshot attachments.</p>
            <p class='text-lg font-bold text-on-surface'>
                Automatically redirecting to mail in <span id='mail-countdown' class='text-primary'>${count}s</span>...
            </p>
        </div>
    `;
    const actionHtml = `
        <button onclick='window.cancelSupportRedirect()' class='text-zinc-500 hover:text-white text-sm font-bold px-4 transition-colors'>Cancel</button>
        <a href='mailto:tech@ethan01.com' onclick='if(window.Modal) window.Modal.hide(); else Modal.hide();' class='bg-primary text-[#0a0a0a] px-6 py-2.5 rounded-lg font-bold text-sm shadow-[0_4px_15px_rgba(204,255,0,0.15)]'>Email Now</a>
    `;
    
    try {
        if (window.Modal) window.Modal.show('Diagnostic Support', modalHtml, actionHtml);
        else Modal.show('Diagnostic Support', modalHtml, actionHtml);
    } catch (e) {
        console.error("Modal Engine Error:", e);
    }

    window.supportRedirectInterval = setInterval(() => {
        count--;
        const counterEl = document.getElementById('mail-countdown');
        if(counterEl) counterEl.innerText = count + 's';
        if(count <= 0) {
            clearInterval(window.supportRedirectInterval);
            try {
                if (window.Modal) window.Modal.hide();
                else Modal.hide();
            } catch(e) {}
            window.location.href = "mailto:tech@ethan01.com";
        }
    }, 1000);
};

window.cancelSupportRedirect = function() {
    if(window.supportRedirectInterval) clearInterval(window.supportRedirectInterval);
    try {
        if (window.Modal) window.Modal.hide();
        else Modal.hide();
    } catch(e) {}
    if(window.Toast) window.Toast.show('Support request aborted.', 'info');
};