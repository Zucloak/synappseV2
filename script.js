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
        duration: 800,
        delay: 200,
    })
    .add({
        targets: '#hero p',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        offset: '-=500',
    })
    .add({
        targets: '#hero .btn',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        offset: '-=600',
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

                if (sectionId === 'achievements') {
                    if (window.innerWidth > 768) {
                        const badges = entry.target.querySelectorAll('.badge-item.animate-hidden');
                        badges.forEach((badge, index) => {
                            setTimeout(() => {
                                badge.classList.remove('animate-hidden');
                            }, 100 * index);
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
                    if (sectionId === 'services' && window.innerWidth > 768) {
                        document.querySelectorAll(`#${sectionId} ${targetsToAnimate}`).forEach(el => el.classList.remove('animate-hidden'));
                    } else {
                        anime({
                            targets: `#${sectionId} ${targetsToAnimate}`,
                            opacity: [0,1],
                            translateY: [50, 0],
                            duration: 700,
                            easing: 'easeOutExpo',
                            delay: anime.stagger(80, {start: 100}),
                            begin: (anim) => {
                                anim.animatables.forEach(a => a.target.classList.remove('animate-hidden'));
                            }
                        });
                    }
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
            if (href === '#' || ['faqLink', 'termsLink', 'privacyLink', 'viewCredentialsBtn'].includes(this.id)) {
                 e.preventDefault();
                 return;
            }
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Modal Logic (General Function) ---
    function setupModal(triggerId, modalId) {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const closeBtn = modal.querySelector('.modal-close-btn');

        if (trigger && modal && closeBtn) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
            });

            const closeModal = () => {
                 modal.classList.remove('open');
                 document.body.style.overflow = '';
                 if (modalId === 'credentialsModal') {
                     const originalBadgesContainer = document.querySelector('#achievements .badges-grid');
                     const modalBadgesContainer = document.getElementById('modalBadgesGrid');
                     if (!originalBadgesContainer || !modalBadgesContainer) return;

                     const badgesToMoveBack = Array.from(modalBadgesContainer.children);
                     setTimeout(() => {
                        badgesToMoveBack.forEach(badge => {
                            badge.classList.remove('is-flipped');
                            originalBadgesContainer.appendChild(badge);
                            badge.style.transform = 'rotateY(0deg)';
                        });
                        handleAchievementsDisplay();
                    }, 300);
                }
            };
            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }
    }

    setupModal('viewCredentialsBtn', 'credentialsModal');
    setupModal('faqLink', 'faqModal');
    setupModal('termsLink', 'termsModal');
    setupModal('privacyLink', 'privacyModal');


    const originalBadgesContainer = document.querySelector('#achievements .badges-grid');
    const modalBadgesContainer = document.getElementById('modalBadgesGrid');
    const viewCredentialsBtn = document.getElementById('viewCredentialsBtn');

    if (viewCredentialsBtn) {
        if (viewCredentialsBtn.onclick) viewCredentialsBtn.onclick = null;
        viewCredentialsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!originalBadgesContainer || !modalBadgesContainer) return;

            const badgesToMove = Array.from(originalBadgesContainer.children);
            badgesToMove.forEach(badge => {
                modalBadgesContainer.appendChild(badge);
                badge.classList.remove('animate-hidden');
                badge.style.opacity = 1;
                badge.style.transform = 'translateY(0)';
            });
            const credentialsModal = document.getElementById('credentialsModal');
            if (credentialsModal) {
                credentialsModal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    function handleAchievementsDisplay() {
        const isMobile = window.innerWidth <= 768;
        if(originalBadgesContainer) originalBadgesContainer.style.display = isMobile ? 'none' : 'grid';
        if (viewCredentialsBtn) viewCredentialsBtn.style.display = isMobile ? 'inline-block' : 'none';
    }

    handleAchievementsDisplay();
    window.addEventListener('resize', handleAchievementsDisplay);

    document.querySelectorAll('.badge-item').forEach(badge => {
        badge.addEventListener('click', () => {
            badge.classList.toggle('is-flipped');
        });
    });

    // --- Services Grid Logic ---
    let servicesScrollAnimation;
    const servicesGrid = document.querySelector('.services-grid');
    const serviceDotsContainer = document.querySelector('.service-dots');
    let currentServiceIndex = 0;
    const originalServices = Array.from(document.querySelectorAll('.services-grid > .service-card'));

    function resetServiceGridToOriginal() {
        if (!servicesGrid) return;
        while (servicesGrid.firstChild) {
            servicesGrid.removeChild(servicesGrid.firstChild);
        }
        originalServices.forEach(card => servicesGrid.appendChild(card));
        servicesGrid.scrollLeft = 0;
        currentServiceIndex = 0;
    }

    function startServicesAutoScroll() {
        if (!servicesGrid || !serviceDotsContainer) return;
        const isDesktop = window.innerWidth > 768;

        if (servicesScrollAnimation) {
            servicesScrollAnimation.pause();
            servicesScrollAnimation = null;
        }
        
        resetServiceGridToOriginal();

        if (isDesktop) {
            const gap = parseInt(window.getComputedStyle(servicesGrid).gap) || 20;
            let originalContentTotalWidth = 0;
            originalServices.forEach(card => {
                originalContentTotalWidth += card.offsetWidth + gap;
            });

            if (originalContentTotalWidth > servicesGrid.clientWidth) {
                // Clone cards for infinite loop effect
                originalServices.forEach(card => servicesGrid.appendChild(card.cloneNode(true)));
                servicesGrid.style.scrollSnapType = 'none';
                serviceDotsContainer.style.display = 'none';

                servicesScrollAnimation = anime({
                    targets: servicesGrid,
                    scrollLeft: originalContentTotalWidth,
                    duration: 50000, 
                    easing: 'linear', 
                    loop: true, 
                    autoplay: true,
                });
            } else {
                 servicesGrid.style.scrollSnapType = 'none';
                 serviceDotsContainer.style.display = 'none';
            }
        } else { // On mobile
            servicesGrid.style.scrollSnapType = 'x mandatory';
            serviceDotsContainer.style.display = 'flex';
            createServiceDots();
        }
    }
    
    // --- UPDATED: Centralized functions to control the carousel animation ---
    function pauseServicesAutoScroll() {
        if (servicesScrollAnimation && !servicesScrollAnimation.paused) {
            servicesScrollAnimation.pause();
        }
    }

    function resumeServicesAutoScroll() {
        if (servicesScrollAnimation && servicesScrollAnimation.paused) {
            servicesScrollAnimation.play();
        }
    }

    function createServiceDots() {
        if (!serviceDotsContainer) return;
        serviceDotsContainer.innerHTML = '';
        originalServices.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('service-dot');
            dot.dataset.index = index;
            dot.addEventListener('click', () => scrollToServiceCard(index));
            serviceDotsContainer.appendChild(dot);
        });
        updateServiceDots();
    }

    function updateServiceDots() {
        if (!serviceDotsContainer) return;
        Array.from(serviceDotsContainer.children).forEach((dot, index) => {
            dot.classList.toggle('active', index === currentServiceIndex);
        });
    }

    function scrollToServiceCard(index) {
        if (!servicesGrid) return;
        const targetCard = originalServices[index];
        if (!targetCard) return;
        servicesGrid.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
    }

    if(servicesGrid){
        servicesGrid.addEventListener('scroll', () => {
            if (window.innerWidth > 768) return;
            let closestIndex = 0, minDiff = Infinity;
            const scrollLeft = servicesGrid.scrollLeft;
            const gridWidth = servicesGrid.clientWidth;
            
            originalServices.forEach((card, index) => {
                const diff = Math.abs(scrollLeft + gridWidth / 2 - (card.offsetLeft + card.offsetWidth / 2));
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
    }

    startServicesAutoScroll();

    if (servicesGrid) {
        servicesGrid.addEventListener('mouseenter', pauseServicesAutoScroll);
        servicesGrid.addEventListener('mouseleave', resumeServicesAutoScroll);
        servicesGrid.addEventListener('touchstart', pauseServicesAutoScroll, { passive: true });
        servicesGrid.addEventListener('touchend', resumeServicesAutoScroll);
    }

    window.addEventListener('resize', () => {
        startServicesAutoScroll();
        setupPhilosophySection();
    });

    // --- Philosophy Section Logic ---
    const philosophyGrid = document.querySelector('.philosophy-points');
    const philosophyDotsContainer = document.querySelector('.philosophy-dots');
    let philosophyPoints = [];
    if (philosophyGrid) philosophyPoints = Array.from(philosophyGrid.children);
    let currentPhilosophyIndex = 0;

    function createPhilosophyDots() {
        if (!philosophyDotsContainer) return;
        philosophyDotsContainer.innerHTML = '';
        philosophyPoints.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('philosophy-dot-item');
            dot.dataset.index = index;
            dot.addEventListener('click', () => scrollToPhilosophyPoint(index));
            philosophyDotsContainer.appendChild(dot);
        });
        updatePhilosophyDots();
    }

    function updatePhilosophyDots() {
        if (!philosophyDotsContainer) return;
        Array.from(philosophyDotsContainer.children).forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPhilosophyIndex);
        });
    }

    function scrollToPhilosophyPoint(index) {
        if (!philosophyGrid) return;
        const point = philosophyPoints[index];
        if(!point) return;
        philosophyGrid.scrollTo({ left: point.offsetLeft, behavior: 'smooth' });
    }

    if(philosophyGrid){
        philosophyGrid.addEventListener('scroll', () => {
            if (window.innerWidth > 1024) return;
            let closestIndex = 0, minDiff = Infinity;
            const scrollLeft = philosophyGrid.scrollLeft;
            philosophyPoints.forEach((point, index) => {
                const diff = Math.abs(scrollLeft - point.offsetLeft);
                 if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = index;
                }
            });
            if (closestIndex !== currentPhilosophyIndex) {
                currentPhilosophyIndex = closestIndex;
                updatePhilosophyDots();
            }
        });
    }

    function setupPhilosophySection() {
        if (!philosophyGrid || !philosophyDotsContainer) return;
        const isMobileOrTablet = window.innerWidth <= 1024;
        createPhilosophyDots();
        philosophyGrid.style.scrollSnapType = isMobileOrTablet ? 'x mandatory' : 'none';
        philosophyDotsContainer.style.display = isMobileOrTablet ? 'flex' : 'none';
    }

    setupPhilosophySection();

    // --- Code Protection Measures ---
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
            e.preventDefault();
        }
    });

    // --- UPDATED: MOBIUS UNIVERSAL GUIDE EVENT LISTENER ---
    document.addEventListener('mobius-guide', (e) => {
        const { targetSelector, textToFind } = e.detail;
        if (!targetSelector) return;

        const targetElement = document.querySelector(targetSelector);
        const overlay = document.getElementById('mobius-overlay');
        if (!targetElement || !overlay) return;

        // --- FIX: Pause carousel when guiding to a service card ---
        const isInServicesCarousel = targetElement.closest('.services-grid');
        if (isInServicesCarousel) {
            pauseServicesAutoScroll();
        }

        overlay.classList.add('visible');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        const scrollAnimationDuration = 700;
        setTimeout(() => {
            let originalContent = null;
            
            if (textToFind && targetElement.textContent.includes(textToFind)) {
                originalContent = targetElement.innerHTML;
                const highlightedHTML = targetElement.innerHTML.replace(
                    new RegExp(textToFind, 'gi'), // Use 'gi' for global, case-insensitive match
                    `<span class="mobius-text-highlight">${textToFind}</span>`
                );
                targetElement.innerHTML = highlightedHTML;
            } else {
                targetElement.classList.add('mobius-highlight');
            }

            // Cleanup logic
            setTimeout(() => {
                if (originalContent) {
                    targetElement.innerHTML = originalContent;
                } else {
                    targetElement.classList.remove('mobius-highlight');
                }
                overlay.classList.remove('visible');
                
                // --- FIX: Resume carousel scroll after highlight ---
                if (isInServicesCarousel && window.innerWidth > 768) {
                    resumeServicesAutoScroll();
                }
            }, 4000); // Highlight lasts for 4 seconds

        }, scrollAnimationDuration);
    });
});
