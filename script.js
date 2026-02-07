document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initStickyGraph();
});

// --- Tab Switching Logic ---
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });


    // Horizontal Scroll Arrows Logic
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            // Find currently active scroll view
            const activeScroll = document.querySelector('.horizontal-scroll-view.active');
            if (activeScroll) {
                // Scroll exactly one screen width (since card + gap = 100vw)
                activeScroll.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
            }
        });
        nextBtn.addEventListener('click', () => {
            const activeScroll = document.querySelector('.horizontal-scroll-view.active');
            if (activeScroll) {
                activeScroll.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
            }
        });
    }
}

// --- Sticky Stock-Ticker Graph Logic ---
function initStickyGraph() {
    const track = document.querySelector('.sticky-track');
    const svgLine = document.getElementById('mainLine');
    const tickerProgress = document.getElementById('tickerProgress');

    if (!track || !svgLine) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isReducedMotion || isMobile) {
        return;
    }

    // SVG Path Length for drawing animation
    const pathLength = svgLine.getTotalLength();
    svgLine.style.strokeDasharray = pathLength;
    svgLine.style.strokeDashoffset = pathLength; // Start hidden

    // Elements to animate
    const dots = document.querySelectorAll('.graph-dot');
    const labels = document.querySelectorAll('.graph-label');
    const tickerItems = document.querySelectorAll('.ticker-item');

    let ticking = false;

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const rect = track.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // "Scrollable Distance" is how much we stick for (Container Height - Viewport)
                const trackHeight = rect.height;
                const scrollableDistance = trackHeight - windowHeight;

                // Calculate raw percentage based on how far 'track' has moved up
                let percentage = (-rect.top) / scrollableDistance;

                // Clamp 0 to 1
                percentage = Math.max(0, Math.min(1, percentage));

                // 1. Draw Line (Accelerated)
                // We divide percentage by 0.85 so that the line finishes drawing
                // when the user is 85% of the way through the scroll.
                // This guarantees the 'spike' reaches the end before they scroll past.
                let drawPhase = percentage / 0.85;
                if (drawPhase > 1) drawPhase = 1; // Cap at 100% drawn

                const drawLength = pathLength * drawPhase;
                svgLine.style.strokeDashoffset = pathLength - drawLength;

                // 2. Update Ticker Bar (matches scroll exactly)
                if (tickerProgress) {
                    tickerProgress.style.width = `${percentage * 100}%`;
                }

                // 3. Activate Steps
                // Thresholds match the even spacing (20%, 45%, 70%, 95%)
                // We trigger slightly earlier to make UI feel responsive
                let activeIndex = -1;
                if (percentage > 0.15) activeIndex = 0;
                if (percentage > 0.40) activeIndex = 1;
                if (percentage > 0.65) activeIndex = 2;
                if (percentage > 0.80) activeIndex = 3;

                // Update UI
                updateStep(activeIndex);
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    function updateStep(index) {
        // Reset all dots first (or keep them lit? Let's keep cumulative lit)
        // Reset labels/ticker first
        labels.forEach(l => l.classList.remove('active'));
        tickerItems.forEach(t => t.classList.remove('active'));

        // Lit dots cumulatively
        dots.forEach((dot, i) => {
            if (i <= index) {
                dot.style.opacity = 1;
            } else {
                dot.style.opacity = 0;
            }
        });

        // Activate specific label
        if (index >= 0) {
            if (labels[index]) labels[index].classList.add('active');
            if (tickerItems[index]) tickerItems[index].classList.add('active');
        }
    }
}
