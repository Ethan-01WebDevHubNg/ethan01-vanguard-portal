// public/js/components/Toast.js

export const Toast = {
    activeToasts: [],

    show: (message, type = 'info', duration = 4000) => {
        // 1. Smart Deduplication: Ignore if this exact message is already on screen
        const isDuplicate = Toast.activeToasts.some(t => t.message === message);
        if (isDuplicate) return; 

        // 2. Clutter Control: Force remove the oldest toast if we hit 2
        if (Toast.activeToasts.length >= 2) {
            const oldest = Toast.activeToasts.shift(); // Remove from tracking array
            oldest.element.classList.add('opacity-0', 'translate-y-[-10px]');
            clearTimeout(oldest.timer);
            setTimeout(() => oldest.element.remove(), 300);
        }

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        
        // UPGRADE: Primary accent green mapped to base 'info' toasts
        let icon = 'info';
        let colorClass = 'border-[var(--color-primary-alpha-30)] text-primary';
        
        if (type === 'success') {
            icon = 'check_circle';
            colorClass = 'border-[var(--color-primary-alpha)] text-primary';
        } else if (type === 'error') {
            icon = 'error';
            colorClass = 'border-[var(--color-error-dim)] text-error';
        } else if (type === 'warning') {
            icon = 'warning';
            colorClass = 'border-[var(--color-outline-variant)] text-on-surface';
        }

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border ${colorClass} bg-surface-container-highest shadow-[var(--card-shadow)] backdrop-blur-md transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto`;
        
        toast.innerHTML = `
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${icon}</span>
            <p class="text-sm font-bold text-on-surface flex-1">${message}</p>
            <button class="ml-2 text-on-surface-variant hover:text-primary transition-colors" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        // Auto remove & cleanup array
        const timer = setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-[-10px]');
            setTimeout(() => {
                toast.remove();
                Toast.activeToasts = Toast.activeToasts.filter(t => t.element !== toast);
            }, 300);
        }, duration);

        // Add to tracking array
        Toast.activeToasts.push({ message, element: toast, timer });
    }
};

window.Toast = Toast;