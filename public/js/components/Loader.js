// public/js/components/Loader.js

let animationFrameId;

export function initLoader() {
    const canvas = document.getElementById('loaderCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Dynamic color fetching from CSS Root
    let elementColor = getComputedStyle(document.documentElement).getPropertyValue('--preloader-ball').trim() || '#ccff00';

    // Update color instantly if theme toggles while loading
    window.addEventListener('themeChanged', () => {
        elementColor = getComputedStyle(document.documentElement).getPropertyValue('--preloader-ball').trim();
    });

    const numBars = 5;
    const barWidth = 18; 
    const barGap = 10;
    const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
    const startX = (canvas.width - totalWidth) / 2;
    
    document.getElementById('loaderText').style.width = totalWidth + 'px';
    
    const baseY = 130; 
    const baseHeight = 30; 
    const maxTilt = 14; 
    const ballRadius = 9; 
    const maxBounce = 16;

    const restTime = 250; 
    const travelTime = 1600; 
    const cycleTime = (travelTime + restTime) * 2; 
    const halfCycle = cycleTime / 2;
    const jumpTime = travelTime / (numBars - 1);

    let currentTilt = maxTilt;
    let targetTilt = maxTilt;
    const linearSpeed = 1.8;

    function drawRoundedRect(ctx, x, y, width, height, topRadius, bottomRadius) {
        ctx.beginPath();
        ctx.moveTo(x + topRadius, y);
        ctx.lineTo(x + width - topRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + topRadius);
        ctx.lineTo(x + width, y + height - bottomRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRadius, y + height);
        ctx.lineTo(x + bottomRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - bottomRadius);
        ctx.lineTo(x, y + topRadius);
        ctx.quadraticCurveTo(x, y, x + topRadius, y);
        ctx.closePath();
        ctx.fill();
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const phase = (timestamp % cycleTime) / cycleTime;
        const timeInHalfCycle = timestamp % halfCycle;

        let sweepProgress;
        let bounceOffset = 0;

        if (timeInHalfCycle < travelTime) {
            const travelProgress = timeInHalfCycle / travelTime;
            if (phase < 0.5) {
                sweepProgress = travelProgress;
                targetTilt = maxTilt; 
            } else {
                sweepProgress = 1 - travelProgress;
                targetTilt = -maxTilt; 
            }
            const jumpPhase = (timeInHalfCycle % jumpTime) / jumpTime;
            bounceOffset = maxBounce * 4 * jumpPhase * (1 - jumpPhase);
        } else {
            sweepProgress = (phase < 0.5) ? 1 : 0;
            targetTilt = (phase < 0.5) ? -maxTilt : maxTilt;
            bounceOffset = 0; 
        }

        if (currentTilt < targetTilt) {
            currentTilt = Math.min(currentTilt + linearSpeed, targetTilt);
        } else if (currentTilt > targetTilt) {
            currentTilt = Math.max(currentTilt - linearSpeed, targetTilt);
        }

        const barHeights = [];
        ctx.fillStyle = elementColor;

        for (let i = 0; i < numBars; i++) {
            const indexOffset = i - 2;
            const height = Math.max(6, baseHeight + indexOffset * currentTilt);
            barHeights.push(height);

            const x = startX + i * (barWidth + barGap);
            const y = baseY - height;
            
            drawRoundedRect(ctx, x, y, barWidth, height, 4, 2);
        }

        const ballX = startX + barWidth / 2 + sweepProgress * (totalWidth - barWidth);
        const yTop0 = baseY - barHeights[0];
        const yTop4 = baseY - barHeights[4];
        const yBaseBall = yTop0 + sweepProgress * (yTop4 - yTop0);
        const ballY = yBaseBall - bounceOffset - ballRadius;

        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        animationFrameId = requestAnimationFrame(draw);
    }

    animationFrameId = requestAnimationFrame(draw);
}

// Attach hideLoader to the global window so the router can trigger it
window.hideLoader = function() {
    const preloader = document.getElementById('global-preloader');
    if (preloader) {
        preloader.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
            preloader.style.display = 'none';
        }, 500); // Wait for CSS fade out to finish
    }
};

document.addEventListener('DOMContentLoaded', initLoader);