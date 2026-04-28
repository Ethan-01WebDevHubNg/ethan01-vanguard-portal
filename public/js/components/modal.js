// public/js/components/modal.js

export const Modal = {
    show: (title, bodyHtml, footerHtml = '') => {
        // Auto-create the container if it doesn't exist in index.html
        let container = document.getElementById('modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modal-container';
            document.body.appendChild(container);
        }

        // SEMANTIC TRANSLATION:
        // bg-black/80 -> bg-surface opacity-80
        // border-white/10 -> border-outline-variant
        // shadow-[...] -> shadow-[var(--card-shadow)]
        // text-white -> text-on-surface
        // text-zinc-500 -> text-on-surface-variant
        // bg-surface-container-highest/20 -> bg-[var(--color-surface-highest-alpha)]
        container.innerHTML = `
            <div id="modal-backdrop" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300 pointer-events-auto">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="window.Modal.hide()"></div>
                <div id="modal-panel" class="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-lg shadow-[var(--card-shadow)] transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-outline-variant bg-[var(--color-surface-highest-alpha)]">
                        <h3 class="text-xl font-bold text-on-surface tracking-tight">${title}</h3>
                        <button onclick="window.Modal.hide()" class="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-md hover:bg-surface-container">
                            <span class="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto no-scrollbar flex-1 text-on-surface-variant">
                        ${bodyHtml}
                    </div>
                    ${footerHtml ? `
                    <div class="p-6 border-t border-outline-variant bg-[var(--color-surface-highest-alpha)] flex justify-end gap-3">
                        ${footerHtml}
                    </div>` : ''}
                </div>
            </div>
        `;
        
        container.classList.remove('hidden');
        
        // Force reflow to trigger CSS transitions
        void container.offsetWidth;
        
        const backdrop = document.getElementById('modal-backdrop');
        const panel = document.getElementById('modal-panel');
        
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('scale-95');
    },
    
    hide: () => {
        const backdrop = document.getElementById('modal-backdrop');
        const panel = document.getElementById('modal-panel');
        
        if (backdrop && panel) {
            backdrop.classList.add('opacity-0');
            panel.classList.add('scale-95');
            
            setTimeout(() => {
                const container = document.getElementById('modal-container');
                if(container) {
                    container.classList.add('hidden');
                    container.innerHTML = '';
                }
            }, 300); // Matches the duration-300 transition
        }
    }
};

// Expose globally for inline HTML onclick handlers
window.Modal = Modal;