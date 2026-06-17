/**
 * main.js - Core UI Logic & Interactions
 * Built for Varsha Sugur's Portfolio Website
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. CUSTOM TRAILING CURSOR
    // ==========================================================================
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.custom-cursor-dot');
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    // Position updates
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant inner dot placement
        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
            cursorDot.style.opacity = '1';
        }
        if (cursor) {
            cursor.style.opacity = '1';
        }
    });
    
    // Hide cursors when leaving viewport
    document.addEventListener('mouseleave', () => {
        if (cursor) cursor.style.opacity = '0';
        if (cursorDot) cursorDot.style.opacity = '0';
    });
    
    // Interpolated outer circle tracking (lagging effect)
    function updateCursor() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        // Speed scaling
        cursorX += dx * 0.12;
        cursorY += dy * 0.12;
        
        if (cursor) {
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
        }
        
        requestAnimationFrame(updateCursor);
    }
    updateCursor();
    
    // Scale up cursors on interactive hovers
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .skill-card, .project-card, .contribution-cell');
    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            if (cursor) {
                cursor.style.width = '45px';
                cursor.style.height = '45px';
                cursor.style.borderColor = 'var(--gold-glow)';
                cursor.style.backgroundColor = 'rgba(212, 175, 55, 0.08)';
            }
            if (cursorDot) {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1.8)';
            }
        });
        
        el.addEventListener('mouseleave', () => {
            if (cursor) {
                cursor.style.width = '28px';
                cursor.style.height = '28px';
                cursor.style.borderColor = 'var(--gold-primary)';
                cursor.style.backgroundColor = 'transparent';
            }
            if (cursorDot) {
                cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        });
    });

    // ==========================================================================
    // 2. HERO TYPING ANIMATION
    // ==========================================================================
    const typedTextSpan = document.getElementById('typed-text');
    const titles = ["AI/ML Enthusiast", "Full Stack Developer", "Problem Solver"];
    const typingSpeed = 100;
    const erasingSpeed = 50;
    const newTextDelay = 2000; // Delay between titles
    let titleIndex = 0;
    let charIndex = 0;
    
    function type() {
        if (!typedTextSpan) return;
        
        if (charIndex < titles[titleIndex].length) {
            typedTextSpan.textContent += titles[titleIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingSpeed);
        } else {
            setTimeout(erase, newTextDelay);
        }
    }
    
    function erase() {
        if (!typedTextSpan) return;
        
        if (charIndex > 0) {
            typedTextSpan.textContent = titles[titleIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingSpeed);
        } else {
            titleIndex++;
            if (titleIndex >= titles.length) titleIndex = 0;
            setTimeout(type, typingSpeed + 500);
        }
    }
    
    // Trigger typewriter start
    if (typedTextSpan) {
        setTimeout(type, 1000);
    }

    // ==========================================================================
    // 3. NAVIGATION & MOBILE MENU TOGGLE
    // ==========================================================================
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Navbar background blur/shrink on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Back-to-top button show/hide
        const backToTopBtn = document.getElementById('back-to-top-btn');
        if (backToTopBtn) {
            if (window.scrollY > 600) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        }
        
        // Dynamic active state toggle during scroll
        updateActiveNavLink();
    });
    
    // Toggle mobile navigation menu
    if (mobileToggle && navLinksContainer) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });
    }
    
    // Close menu when links are clicked (for mobile navigation)
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (mobileToggle) mobileToggle.classList.remove('active');
            if (navLinksContainer) navLinksContainer.classList.remove('active');
        });
    });
    
    // Update active nav links on scroll selection
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 120; // offset navigation height
        
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach((link) => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ==========================================================================
    // 4. 3D CARD TILT EFFECT
    // ==========================================================================
    const tiltCards = document.querySelectorAll('[data-tilt]');
    
    tiltCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Mouse offsets relative to the element width/height
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate percentage positions (-0.5 to 0.5 range)
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = (x - xc) / xc;
            const dy = (y - yc) / yc;
            
            // Rotate card: Y-coordinate shifts rotate around X-axis (vice-versa)
            const rotX = -dy * 10; // Max tilt: 10 degrees
            const rotY = dx * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`;
            
            // Move glowing backgrounds of card if present
            const cardGlow = card.querySelector('.about-card-glow, .project-glow');
            if (cardGlow) {
                cardGlow.style.transform = `translate(${dx * 20}px, ${dy * 20}px)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            const cardGlow = card.querySelector('.about-card-glow, .project-glow');
            if (cardGlow) {
                cardGlow.style.transform = 'translate(0px, 0px)';
            }
        });
    });

    // ==========================================================================
    // 5. SCROLL REVEAL ANIMATIONS
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve once triggered to optimize scroll performance
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });
    
    revealElements.forEach((el) => {
        revealObserver.observe(el);
    });

    // ==========================================================================
    // 6. RENDER GITHUB CONTRIBUTION GRID
    // ==========================================================================
    const gridContainer = document.getElementById('contributions-grid');
    if (gridContainer) {
        // Build 26 columns of 7 rows (representing half a year)
        const cols = 26;
        const rows = 7;
        const totalCells = cols * rows;
        
        // Generate random activity distribution
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('contribution-cell');
            
            // Weights to make realistic distribution pattern (clustered activity)
            const randomVal = Math.random();
            let level = 0;
            
            if (randomVal > 0.85) {
                level = 4; // High commits
            } else if (randomVal > 0.70) {
                level = 3;
            } else if (randomVal > 0.50) {
                level = 2;
            } else if (randomVal > 0.20) {
                level = 1; // Low commits
            } // level 0 for remainder
            
            cell.classList.add(`level-${level}`);
            
            // Simulated commits counter
            let commitsCount = 0;
            if (level === 1) commitsCount = Math.floor(Math.random() * 2) + 1;
            else if (level === 2) commitsCount = Math.floor(Math.random() * 3) + 3;
            else if (level === 3) commitsCount = Math.floor(Math.random() * 4) + 6;
            else if (level === 4) commitsCount = Math.floor(Math.random() * 5) + 10;
            
            // Hover tooltips showing dates (simulated)
            const date = new Date();
            date.setDate(date.getDate() - (totalCells - i));
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            cell.setAttribute('title', `${commitsCount > 0 ? commitsCount : 'No'} contributions on ${dateString}`);
            gridContainer.appendChild(cell);
        }
    }

    // ==========================================================================
    // 7. RIPPLE CLICK EFFECT
    // ==========================================================================
    const rippleButtons = document.querySelectorAll('.ripple');
    rippleButtons.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            // Remove previous ripple elements
            const oldRipple = this.querySelector('.ripple-effect');
            if (oldRipple) oldRipple.remove();
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const rippleSpan = document.createElement('span');
            rippleSpan.classList.add('ripple-effect');
            rippleSpan.style.left = `${x}px`;
            rippleSpan.style.top = `${y}px`;
            
            this.appendChild(rippleSpan);
            
            // Cleanup
            setTimeout(() => {
                rippleSpan.remove();
            }, 600);
        });
    });

    // ==========================================================================
    // 8. CONTACT FORM SUBMISSION WITH SUCCESS ANIMATION
    // ==========================================================================
    const contactForm = document.getElementById('portfolio-contact-form');
    const successOverlay = document.getElementById('form-success');
    const resetFormBtn = document.getElementById('btn-reset-form');
    
    if (contactForm && successOverlay) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Select submit button
            const submitBtn = contactForm.querySelector('.btn-submit');
            const submitBtnText = submitBtn.querySelector('span');
            const submitBtnIcon = submitBtn.querySelector('i');
            
            // Show loading animation on button
            submitBtn.style.pointerEvents = 'none';
            if (submitBtnText) submitBtnText.textContent = 'Sending...';
            if (submitBtnIcon) {
                submitBtnIcon.className = 'fa-solid fa-circle-notch fa-spin';
            }
            
            // Simulate asynchronous POST request
            setTimeout(() => {
                // Show success screen overlay with active class transitions
                successOverlay.classList.add('active');
                
                // Reset submit button state
                submitBtn.style.pointerEvents = 'all';
                if (submitBtnText) submitBtnText.textContent = 'Send Message';
                if (submitBtnIcon) {
                    submitBtnIcon.className = 'fa-solid fa-paper-plane';
                }
                
                // Clear input fields
                contactForm.reset();
            }, 1800);
        });
    }
    
    // Dismiss success screen overlay and return to form
    if (resetFormBtn && successOverlay) {
        resetFormBtn.addEventListener('click', () => {
            successOverlay.classList.remove('active');
        });
    }
});
