// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Apply initial hidden states for animations ---
    document.querySelectorAll('.service-card, .philosophy-point, .cta-button-wrapper').forEach(el => {
        el.classList.add('animate-hidden');
    });

    // --- Hero Section Animations (Snappier) ---
    anime.timeline({
        easing: 'easeOutExpo',
    })
    .add({
        targets: '#hero h1',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800, // Faster
        delay: 200,
    })
    .add({
        targets: '#hero p',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800, // Faster
        offset: '-=500', // Adjusted overlap
    })
    .add({
        targets: '#hero .btn',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800, // Faster
        offset: '-=600', // Adjusted overlap
    });


    // --- Scroll Animations (Intersection Observer) ---
    const sections = document.querySelectorAll('section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;

                // Handle achievements animation separately
                if (sectionId === 'achievements') {
                    if (window.innerWidth > 768) {
                        const badges = entry.target.querySelectorAll('.badge-item.animate-hidden');
                        badges.forEach((badge, index) => {
                            setTimeout(() => {
                                badge.classList.remove('animate-hidden');
                            }, 100 * index); // Faster stagger
                        });
                    }
                     observer.unobserve(entry.target);
                    return;
                }

                let targetsToAnimate;
                switch(sectionId) {
                    case 'services': targetsToAnimate = '.service-card'; break;
                    case 'about': targetsToAnimate = '.philosophy-point'; break;
                    case 'cta': targetsToAnimate = '.cta-button-wrapper'; break;
                }

                if (targetsToAnimate) {
                    anime({
                        targets: `#${sectionId} ${targetsToAnimate}`,
                        opacity: [0,1],
                        translateY: [50, 0],
                        duration: 700, // Faster
                        easing: 'easeOutExpo',
                        delay: anime.stagger(80, {start: 100}), // Faster stagger
                        begin: (anim) => {
                            anim.animatables.forEach(a => a.target.classList.remove('animate-hidden'));
                            // Make sure to remove it from the array that gets observed if it has been animated
                            // and not to be observed again for animation purposes.
                        }
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        if (section.id !== 'hero') {
            sectionObserver.observe(section);
        }
    });

    // --- Smooth Scroll for Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Prevent smooth scroll for links that trigger modals or are just '#'
            if (href === '#' || ['faqLink', 'termsLink', 'privacyLink', 'viewCredentialsBtn'].includes(this.id)) {
                e.preventDefault(); // Already handled by modal setup, just ensure default is stopped
                return;
            }

            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Modal Logic (General Function) ---
    function setupModal(triggerId, modalId) {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.modal-close-btn');

        if (trigger && modal && closeBtn) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });

            closeBtn.addEventListener('click', () => {
                modal.classList.remove('open');
                document.body.style.overflow = '';
                // Special handling for credentials modal to move badges back
                if (modalId === 'credentialsModal') {
                     const originalBadgesContainer = document.querySelector('#achievements .badges-grid');
                     const modalBadgesContainer = document.getElementById('modalBadgesGrid');
                     const badgesToMoveBack = Array.from(modalBadgesContainer.children);
                     setTimeout(() => {
                        badgesToMoveBack.forEach(badge => {
                            // Reset flip state when moving back
                            badge.classList.remove('is-flipped');
                            originalBadgesContainer.appendChild(badge);
                            badge.style.transform = 'rotateY(0deg)';
                        });
                        handleAchievementsDisplay(); // Re-evaluate display after moving
                    }, 300);
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    document.body.style.overflow = '';
                     // Special handling for credentials modal to move badges back
                    if (modalId === 'credentialsModal') {
                        const originalBadgesContainer = document.querySelector('#achievements .badges-grid');
                        const modalBadgesContainer = document.getElementById('modalBadgesGrid');
                        const badgesToMoveBack = Array.from(modalBadgesContainer.children);
                        setTimeout(() => {
                            badgesToMoveBack.forEach(badge => {
                                // Reset flip state when moving back
                                badge.classList.remove('is-flipped');
                                originalBadgesContainer.appendChild(badge);
                                badge.style.transform = 'rotateY(0deg)';
                            });
                            handleAchievementsDisplay(); // Re-evaluate display after moving
                        }, 300);
                    }
                }
            });
        }
    }

    // Setup all modals
    setupModal('viewCredentialsBtn', 'credentialsModal');
    setupModal('faqLink', 'faqModal');
    setupModal('termsLink', 'termsModal');
    setupModal('privacyLink', 'privacyModal');


    // Special logic for Credentials Modal - moving badges
    const originalBadgesContainer = document.querySelector('#achievements .badges-grid');
    const modalBadgesContainer = document.getElementById('modalBadgesGrid');

    // Override openModal for credentials to include badge transfer
    const viewCredentialsBtn = document.getElementById('viewCredentialsBtn'); // Get the button reference

    // Remove existing event listener if it was added inline or previously
    // This is a safety measure if there was an old event handler attached directly to onclick
    if (viewCredentialsBtn.onclick) {
        viewCredentialsBtn.onclick = null;
    }

    viewCredentialsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const badgesToMove = Array.from(originalBadgesContainer.children);
        badgesToMove.forEach(badge => {
            modalBadgesContainer.appendChild(badge);
            badge.classList.remove('animate-hidden');
            badge.style.opacity = 1;
            badge.style.transform = 'translateY(0)';
        });
        document.getElementById('credentialsModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    });


    // --- Responsive Achievements Display (remains the same) ---
    function handleAchievementsDisplay() {
        const isMobile = window.innerWidth <= 768;
        originalBadgesContainer.style.display = isMobile ? 'none' : 'grid';
        viewCredentialsBtn.style.display = isMobile ? 'inline-block' : 'none';
    }

    handleAchievementsDisplay();
    window.addEventListener('resize', handleAchievementsDisplay);

    // --- Badge Flip on Click Logic (remains the same) ---
    document.querySelectorAll('.badge-item').forEach(badge => {
        badge.addEventListener('click', () => {
            badge.classList.toggle('is-flipped');
        });
    });


    // --- Services Grid Logic (Auto-Scroll Desktop, Snap-Scroll Mobile with Dots) ---
    let servicesScrollAnimation;
    const servicesGrid = document.querySelector('.services-grid');
    const serviceDotsContainer = document.querySelector('.service-dots');
    let currentServiceIndex = 0;

    // Store original cards by selecting them directly, ensuring all are captured
    // This ensures that 'originalServices' always reflects the actual number of service-card elements in the DOM.
    const originalServices = Array.from(document.querySelectorAll('.services-grid > .service-card'));


    // Function to clean up duplicates and reset to original state
    function resetServiceGridToOriginal() {
        // Remove all current children from servicesGrid
        while (servicesGrid.firstChild) {
            servicesGrid.removeChild(servicesGrid.firstChild);
        }
        // Append only the original cards
        originalServices.forEach(card => {
            servicesGrid.appendChild(card);
        });
        servicesGrid.scrollLeft = 0; // Reset scroll position
        currentServiceIndex = 0; // Reset index
    }


    function startServicesAutoScroll() {
        const isDesktop = window.innerWidth > 768; // Define desktop/mobile breakpoint
        let originalContentTotalWidth = 0;

        // Stop any existing animation
        if (servicesScrollAnimation) {
            servicesScrollAnimation.pause();
            servicesScrollAnimation = null;
        }

        if (isDesktop) {
            // Desktop logic: potentially duplicate and enable auto-scroll
            console.log('Services Carousel: Running in DESKTOP mode (auto-scroll with duplication)');

            // Calculate width for original cards
            if (originalServices.length > 0) {
                originalServices.forEach(card => {
                    originalContentTotalWidth += card.offsetWidth + 20; // Add card width + gap
                });
                if (originalContentTotalWidth > 0) {
                     originalContentTotalWidth -= 20; // Subtract the last gap
                }
            }

            // Only duplicate and auto-scroll if content overflows
            if (originalServices.length > 0 && originalContentTotalWidth > servicesGrid.clientWidth) {
                resetServiceGridToOriginal(); // Ensure clean slate before duplicating
                originalServices.forEach(card => { // Duplicate for seamless loop
                    servicesGrid.appendChild(card.cloneNode(true));
                });
                servicesGrid.style.scrollSnapType = 'none'; // Disable snap for auto-scroll
                serviceDotsContainer.style.display = 'none'; // Hide dots on desktop

                const targetScrollLeft = originalContentTotalWidth;

                servicesScrollAnimation = anime({
                    targets: servicesGrid,
                    scrollLeft: targetScrollLeft,
                    duration: 90000, // <--- THIS IS THE CAROUSEL SPEED DURATION
                    easing: 'linear',
                    loop: true,
                    autoplay: true,
                    update: (anim) => {
                        // Reset scroll position when it reaches the end of the original content
                        if (servicesGrid.scrollLeft >= targetScrollLeft - 1) { // Minus 1 for robustness against floating point
                            servicesGrid.scrollLeft = 0;
                        }
                    }
                });
            } else {
                // Desktop, but content fits, so no auto-scroll needed, just show originals
                resetServiceGridToOriginal();
                servicesGrid.style.scrollSnapType = 'none'; // Still no snap, but no auto-scroll either
                serviceDotsContainer.style.display = 'none';
            }
        } else {
            // Mobile/Tablet logic: no duplication, snap-scroll
            console.log('Services Carousel: Running in MOBILE mode (snap-scroll, no duplication)');
            resetServiceGridToOriginal(); // Ensure only originals are present
            servicesGrid.style.scrollSnapType = 'x mandatory'; // Enable snap for manual scrolling
            serviceDotsContainer.style.display = 'flex'; // Show dots
            createServiceDots(); // Re-create dots for the non-duplicated set
        }
    }


    function pauseServicesAutoScroll() {
        if (servicesScrollAnimation && servicesScrollAnimation.paused !== true) {
            servicesScrollAnimation.pause();
        }
    }

    function resumeServicesAutoScroll() {
        if (servicesScrollAnimation && servicesScrollAnimation.paused === true) {
            servicesScrollAnimation.play();
        }
    }

    // Mobile dot navigation functions
    function createServiceDots() {
        serviceDotsContainer.innerHTML = ''; // Clear existing dots
        originalServices.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('service-dot');
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                scrollToServiceCard(index);
            });
            serviceDotsContainer.appendChild(dot);
        });
        updateServiceDots();
    }

    function updateServiceDots() {
        const dots = Array.from(serviceDotsContainer.children);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentServiceIndex);
        });
    }

    function scrollToServiceCard(index) {
        const servicesCards = Array.from(servicesGrid.children); // Get current children
        if (servicesCards.length === 0 || index >= servicesCards.length) {
            console.warn("Invalid index or no service cards to scroll to.");
            return;
        }

        // Use the target card's actual offsetLeft for more accurate scrolling and attempt to center it
        const targetCard = servicesCards[index];
        let scrollPosition = targetCard.offsetLeft - (servicesGrid.clientWidth / 2) + (targetCard.offsetWidth / 2);

        // Ensure scroll position is within valid bounds (0 to max scrollLeft)
        scrollPosition = Math.max(0, Math.min(scrollPosition, servicesGrid.scrollWidth - servicesGrid.clientWidth));

        servicesGrid.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        currentServiceIndex = index;
        updateServiceDots();
    }


    // Handle scroll events for service grid (mobile only)
    servicesGrid.addEventListener('scroll', () => {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        let closestIndex = 0;
        let minDiff = Infinity;
        const scrollLeft = servicesGrid.scrollLeft;
        const servicesCardsInView = Array.from(servicesGrid.children); // Get current children (should be original on mobile)

        // Only calculate if there are cards to avoid errors on empty grid
        if (servicesCardsInView.length === 0) return;

        servicesCardsInView.forEach((card, index) => {
            // Calculate the center of the card relative to the start of the scrollable area
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            // Calculate the center of the visible viewport within the scrollable area
            const viewportCenter = scrollLeft + (servicesGrid.clientWidth / 2);

            const diff = Math.abs(cardCenter - viewportCenter);

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = index;
            }
        });

        if (closestIndex !== currentServiceIndex) {
            currentServiceIndex = closestIndex;
            updateServiceDots();
        }
    });


    // Initial setup for services carousel
    startServicesAutoScroll(); // This function now handles all initial setup logic

    // Add event listeners for hover/touch on the services grid itself
    if (servicesGrid) {
        servicesGrid.addEventListener('mouseenter', pauseServicesAutoScroll);
        servicesGrid.addEventListener('mouseleave', resumeServicesAutoScroll);
        servicesGrid.addEventListener('touchstart', pauseServicesAutoScroll); // For touch devices
        servicesGrid.addEventListener('touchend', resumeServicesAutoScroll);   // For touch devices
    }

    // Re-evaluate services carousel behavior on resize
    window.addEventListener('resize', () => {
        startServicesAutoScroll(); // This will handle desktop auto-scroll vs mobile snap-scroll
    });


    // --- Philosophy Section Logic (Dot Slider Mobile/Tablet) ---
    const philosophyGrid = document.querySelector('.philosophy-points');
    const philosophyDotsContainer = document.querySelector('.philosophy-dots');
    const philosophyPoints = Array.from(philosophyGrid.children);
    let currentPhilosophyIndex = 0;

    function createPhilosophyDots() {
        philosophyDotsContainer.innerHTML = '';
        philosophyPoints.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('philosophy-dot-item');
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                scrollToPhilosophyPoint(index);
            });
            philosophyDotsContainer.appendChild(dot);
        });
        updatePhilosophyDots();
    }

    function updatePhilosophyDots() {
        const dots = Array.from(philosophyDotsContainer.children);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPhilosophyIndex);
        });
    }

    function scrollToPhilosophyPoint(index) {
        const pointWidth = philosophyGrid.querySelector('.philosophy-point').offsetWidth;
        const gap = parseInt(window.getComputedStyle(philosophyGrid).gap);
        let scrollPosition = (pointWidth + gap) * index;

        philosophyGrid.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        currentPhilosophyIndex = index;
        updatePhilosophyDots();
    }

    // Handle scroll events for philosophy grid (mobile/tablet only)
    philosophyGrid.addEventListener('scroll', () => {
        const isMobileOrTablet = window.innerWidth <= 1024; // <= 1024px for both mobile and tablet
        if (!isMobileOrTablet) return;

        const scrollLeft = philosophyGrid.scrollLeft;
        const pointWidth = philosophyGrid.querySelector('.philosophy-point').offsetWidth;
        const gap = parseInt(window.getComputedStyle(philosophyGrid).gap);

        const newIndex = Math.round(scrollLeft / (pointWidth + gap));

        if (newIndex !== currentPhilosophyIndex) {
            currentPhilosophyIndex = newIndex;
            updatePhilosophyDots();
        }
    });

    // Initial setup for philosophy carousel
    function setupPhilosophySection() {
        const isMobileOrTablet = window.innerWidth <= 1024;

        if (isMobileOrTablet) {
            createPhilosophyDots();
            philosophyGrid.style.scrollSnapType = 'x mandatory'; // Ensure snap
            philosophyDotsContainer.style.display = 'flex'; // Show dots
        } else {
            philosophyGrid.style.scrollSnapType = 'none'; // No snap on desktop
            philosophyDotsContainer.style.display = 'none'; // Hide dots
        }
    }

    setupPhilosophySection();
    window.addEventListener('resize', setupPhilosophySection);


    // --- Code Protection Measures ---
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey; // Checks for Ctrl on Windows/Linux, Cmd on Mac
        const isShift = e.shiftKey;

        // Prevent common actions for saving, inspecting, copying, printing, etc.
        if (
            // Developer Tools / Inspect Element
            e.key === 'F12' ||
            (isCtrlOrCmd && isShift && (e.key === 'I' || e.key === 'i')) || // Ctrl/Cmd + Shift + I
            (isCtrlOrCmd && isShift && (e.key === 'J' || e.key === 'j')) || // Ctrl/Cmd + Shift + J (Chrome/Edge Dev Tools)
            (isCtrlOrCmd && isShift && (e.key === 'C' || e.key === 'c') && isShift) || // Ctrl/Cmd + Shift + C (Inspect Element)

            // View Page Source
            (isCtrlOrCmd && (e.key === 'U' || e.key === 'u')) ||

            // Save Page As
            (isCtrlOrCmd && (e.key === 'S' || e.key === 's')) ||

            // Print
            (isCtrlOrCmd && (e.key === 'P' || e.key === 'p')) ||

            // Open file
            (isCtrlOrCmd && (e.key === 'O' || e.key === 'o')) ||

            // New window
            (isCtrlOrCmd && (e.key === 'N' || e.key === 'n')) ||

            // Copy (redundant but harmless layer)
            (isCtrlOrCmd && (e.key === 'C' || e.key === 'c')) ||

            // Select All
            (isCtrlOrCmd && (e.key === 'A' || e.key === 'a'))
        ) {
            e.preventDefault();
            // Optionally, for extremely stubborn cases, stop propagation immediately:
            // e.stopImmediatePropagation();
        }
    });
});
