// Get DOM elements
const progressBar = document.getElementById('progressBar');
const runner = document.getElementById('runner');
const completionText = document.getElementById('completionText');
const expandOverlay = document.getElementById('expandOverlay');
const animationContainer = document.querySelector('.animation-container');

// Bail out if the loader markup is not present
if (progressBar && runner && completionText && animationContainer) {
    const TRACK_WIDTH = 600;
    const RUNNER_HALF = 64; // Runner is 128px wide
    const UPDATE_INTERVAL = 50;
    const EXPAND_MS = 700;  // match CSS transform duration
    const HOLD_MS = 100;    // slight pause at full-screen before redirect

    let progress = 0;
    let animationTimer = null;
    let isTransitioning = false;
    let gifKey = 0;
    const runnerBaseSrc = runner.src.split('?')[0];

    function updateProgress() {
        if (isTransitioning) {
            return;
        }

        progress = Math.min(progress + 2.5, 100); // Complete in ~2 seconds
        updateUI();

        if (progress >= 100) {
            completeLoading();
        }
    }

    function updateUI() {
        const barWidth = (progress / 100) * TRACK_WIDTH;
        progressBar.style.width = `${barWidth}px`;

        const runnerLeft = Math.min(barWidth, TRACK_WIDTH) - RUNNER_HALF;
        runner.style.left = `${runnerLeft}px`;

        // Update the numeric progress from 1% to 100%
        if (completionText) {
            const displayProgress = Math.max(1, Math.min(100, Math.floor(progress)));
            completionText.textContent = `${displayProgress}%`;
        }
    }

    function completeLoading() {
        if (animationTimer) {
            window.clearInterval(animationTimer);
            animationTimer = null;
        }

        isTransitioning = true;
        completionText.classList.add('visible');
        triggerExpandTransition();
    }

    function triggerExpandTransition() {
        if (!expandOverlay) {
            window.location.href = 'index.html';
            return;
        }

        const barRect = progressBar.getBoundingClientRect();
        const scaleX = window.innerWidth / Math.max(barRect.width, 1);
        const scaleY = window.innerHeight / Math.max(barRect.height, 1);
    const targetScale = Math.max(scaleX, scaleY) * 1.2;

        expandOverlay.style.left = `${barRect.left}px`;
        expandOverlay.style.top = `${barRect.top}px`;
        expandOverlay.style.width = `${barRect.width}px`;
        expandOverlay.style.height = `${barRect.height}px`;
        expandOverlay.style.setProperty('--target-scale', targetScale.toString());

        expandOverlay.classList.remove('fill-screen', 'shrink-away');
        expandOverlay.classList.add('visible');

        window.requestAnimationFrame(() => {
            expandOverlay.classList.add('fill-screen');
        });

        // Redirect right after the expand animation completes
        window.setTimeout(() => {
            window.location.href = 'index.html';
        }, EXPAND_MS + HOLD_MS);
    }

    function resetLoader() {
        if (isTransitioning) {
            return;
        }

        if (animationTimer) {
            window.clearInterval(animationTimer);
        }

        progress = 0;
        gifKey += 1;
        runner.src = `${runnerBaseSrc}?t=${gifKey}`;

    // Show progress number during loading
    completionText.classList.add('visible');
    completionText.textContent = '1%';

        if (expandOverlay) {
            expandOverlay.classList.remove('visible', 'fill-screen', 'shrink-away');
            expandOverlay.style.removeProperty('--target-scale');
            expandOverlay.style.width = '0';
            expandOverlay.style.height = '0';
        }

        runner.style.left = `${-RUNNER_HALF}px`;
        updateUI();

        animationTimer = window.setInterval(updateProgress, UPDATE_INTERVAL);
    }

    animationContainer.addEventListener('click', resetLoader);

    resetLoader();
}

// Interactive eyeballs (index.html)
(() => {
    const leftEye = document.getElementById('left-eye');
    const rightEye = document.getElementById('right-eye');
    const leftPupil = document.getElementById('left-pupil');
    const rightPupil = document.getElementById('right-pupil');

    if (!leftEye || !rightEye || !leftPupil || !rightPupil) {
        return;
    }

    const movePupil = (eye, pupil, mouseX, mouseY) => {
        const rect = eye.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(mouseY - cy, mouseX - cx);

        const pupilRadius = pupil.offsetWidth / 2;
        const availableX = rect.width / 2 - pupilRadius;
        const availableY = rect.height / 2 - pupilRadius;

        const x = availableX * Math.cos(angle);
        const y = availableY * Math.sin(angle);
        pupil.style.transform = `translate(${x}px, ${y}px)`;
    };

    const handleMove = (event) => {
        const { clientX, clientY } = event;
        movePupil(leftEye, leftPupil, clientX, clientY);
        movePupil(rightEye, rightPupil, clientX, clientY);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
})();

// Gradient infinity glow follows pointer for subtle parallax
(() => {
    const infinityBg = document.querySelector('.infinity-bg');
    const page = document.querySelector('.page');

    if (!infinityBg || !page) {
        return;
    }

    const MAX_OFFSET_X = 90;
    const MAX_OFFSET_Y = 65;
    const EASING = 0.08;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let pageRect = page.getBoundingClientRect();

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateRect = () => {
        pageRect = page.getBoundingClientRect();
    };

    const handlePointerMove = (event) => {
        const { clientX, clientY } = event;

        if (!pageRect.width || !pageRect.height) {
            return;
        }

        const relativeX = (clientX - pageRect.left) / pageRect.width;
        const relativeY = (clientY - pageRect.top) / pageRect.height;

        const normalizedX = clamp(relativeX - 0.5, -0.5, 0.5) * 2;
        const normalizedY = clamp(relativeY - 0.5, -0.5, 0.5) * 2;

        targetX = normalizedX * MAX_OFFSET_X;
        targetY = normalizedY * MAX_OFFSET_Y;
    };

    const animate = () => {
        currentX += (targetX - currentX) * EASING;
        currentY += (targetY - currentY) * EASING;

        infinityBg.style.setProperty('--follow-x', `${currentX}px`);
        infinityBg.style.setProperty('--follow-y', `${currentY}px`);

        window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', updateRect);
    updateRect();
    animate();
})();
