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

        container.innerHTML = `
            <div id="modal-backdrop" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-0 transition-opacity duration-300 pointer-events-auto">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.Modal.hide()"></div>
                <div id="modal-panel" class="relative bg-surface-container-low border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_8px_40px_rgba(0,0,0,0.8)] transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-white/5 bg-surface-container-highest/20">
                        <h3 class="text-xl font-bold text-white tracking-tight">${title}</h3>
                        <button onclick="window.Modal.hide()" class="text-zinc-500 hover:text-white transition-colors flex items-center justify-center p-1 rounded-md hover:bg-white/5">
                            <span class="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto no-scrollbar flex-1 text-on-surface-variant">
                        ${bodyHtml}
                    </div>
                    ${footerHtml ? `
                    <div class="p-6 border-t border-white/5 bg-surface-container-highest/20 flex justify-end gap-3">
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