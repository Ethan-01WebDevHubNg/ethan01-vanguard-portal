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
        
        let icon = 'info';
        let colorClass = 'border-primary/30 text-primary';
        let bgClass = 'bg-surface-container-highest';
        
        if (type === 'success') {
            icon = 'check_circle';
            colorClass = 'border-[#ccff00]/50 text-[#ccff00]';
        } else if (type === 'error') {
            icon = 'error';
            colorClass = 'border-error/50 text-error';
        } else if (type === 'warning') {
            icon = 'warning';
            colorClass = 'border-secondary/50 text-secondary';
        }

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border ${colorClass} ${bgClass} shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto`;
        
        toast.innerHTML = `
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${icon}</span>
            <p class="text-sm font-bold text-white flex-1">${message}</p>
            <button class="ml-2 text-zinc-500 hover:text-white transition-colors" onclick="this.parentElement.remove()">
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