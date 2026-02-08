// Render events
function renderEvents(filterCategory = 'all') {
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsGrid) return;

    // Filter events by category
    let filteredEvents = eventsData;
    if (filterCategory !== 'all') {
        filteredEvents = eventsData.filter(event => event.category === filterCategory);
    }

    // Reset initial animation index when re-rendering
    window.initialAnimationIndex = 0;

    // Clear existing events
    eventsGrid.innerHTML = '';

    // Render each event
    filteredEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card image-card';
        eventCard.setAttribute('data-date', event.date);
        eventCard.setAttribute('data-category', event.category);

        // Get actual participation count from localStorage
        const participantsKey = `event_participants_${event.id}`;
        const participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');
        const actualCurrent = event.capacity.current + participants.length;
        
        // Determine status based on actual capacity
        let displayStatus = event.status;
        if (actualCurrent >= event.capacity.total) {
            displayStatus = 'Sold Out';
        } else {
            displayStatus = 'Available';
        }

        eventCard.innerHTML = `
            <img src="${event.image}" alt="${event.alt}" class="event-poster-image">
            <div class="poster-overlay">
                <div class="poster-info">
                    <div class="info-item info-date">
                        <span class="info-value">${event.displayDate}</span>
                    </div>
                    <div class="info-item info-location">
                        <span class="info-value">${event.location}</span>
                    </div>
                    <div class="info-item info-capacity">
                        <span class="info-value">${actualCurrent}/${event.capacity.total}</span>
                    </div>
                    <div class="info-item info-status">
                        <span class="info-value">${displayStatus}</span>
                    </div>
                </div>
            </div>
        `;

        // Add click event to navigate to detail page
        eventCard.addEventListener('click', function() {
            // Only allow navigation for event id 1 (여정's 생월파티)
            if (event.id === 1) {
                window.location.href = `event-detail.html?id=${event.id}`;
            } else {
                alert('상세페이지 준비중입니다.');
            }
        });

        eventCard.style.cursor = 'pointer';
        eventCard.setAttribute('data-event-id', event.id);

        eventsGrid.appendChild(eventCard);
    });

    // Initialize overlay heights after rendering
    initializeOverlayHeights();
    
    // Initialize scroll animations
    initializeScrollAnimations();
}

// Initialize scroll animations using Intersection Observer
function initializeScrollAnimations() {
    const eventCards = document.querySelectorAll('.event-card.image-card:not(.visible)');
    
    if (eventCards.length === 0) return;
    
    // Track if this is the first time initializing (for initial page load)
    const isInitialLoad = !window.scrollAnimationsInitialized;
    window.scrollAnimationsInitialized = true;
    
    // On initial load, wait a bit for layout to settle, then check which cards are visible
    if (isInitialLoad) {
        // Use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const initiallyVisibleCards = [];
                const scrollVisibleCards = [];
                
                eventCards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    // Card is initially visible if it's within the viewport
                    // Check if card's top is above viewport bottom and bottom is below viewport top
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.top >= -50;
                    
                    if (isVisible) {
                        initiallyVisibleCards.push(card);
                        // Mark card as initially visible to prevent Intersection Observer from triggering
                        card.setAttribute('data-initially-visible', 'true');
                    } else {
                        scrollVisibleCards.push(card);
                    }
                });
                
                // Animate initially visible cards with staggered delay
                // Each card appears one by one (wait for previous card to finish before starting next)
                if (initiallyVisibleCards.length > 0) {
                    initiallyVisibleCards.forEach((card, i) => {
                        // Each card starts after the previous one finishes (2.5s animation + 200ms gap)
                        const delay = i * 2700; // 2500ms animation + 200ms gap between cards
                        setTimeout(() => {
                            if (!card.classList.contains('visible')) {
                                card.classList.add('visible');
                            }
                        }, delay);
                    });
                    
                    // Set up Intersection Observer AFTER initial animations start
                    // Wait for the last initial card's animation to start
                    const lastDelay = (initiallyVisibleCards.length - 1) * 2700;
                    setTimeout(() => {
                        // Now set up Intersection Observer for scroll-visible cards
                        if (scrollVisibleCards.length > 0) {
                            const observer = new IntersectionObserver((entries) => {
                                entries.forEach((entry) => {
                                    // Skip if card was initially visible
                                    if (entry.target.getAttribute('data-initially-visible') === 'true') {
                                        return;
                                    }
                                    
                                    if (entry.isIntersecting && !entry.target.classList.contains('visible')) {
                                        // Animate immediately when card enters viewport
                                        entry.target.classList.add('visible');
                                        observer.unobserve(entry.target);
                                    }
                                });
                            }, {
                                threshold: 0.1, // Trigger when 10% of the card is visible
                                rootMargin: '0px 0px -50px 0px' // Start animation when card is 50px away from viewport bottom
                            });
                            
                            // Observe only scroll-visible cards
                            scrollVisibleCards.forEach(card => {
                                observer.observe(card);
                            });
                        }
                    }, lastDelay + 50);
                } else {
                    // No initially visible cards, set up Intersection Observer immediately
                    if (scrollVisibleCards.length > 0) {
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach((entry) => {
                                if (entry.isIntersecting && !entry.target.classList.contains('visible')) {
                                    entry.target.classList.add('visible');
                                    observer.unobserve(entry.target);
                                }
                            });
                        }, {
                            threshold: 0.1,
                            rootMargin: '0px 0px -50px 0px'
                        });
                        
                        scrollVisibleCards.forEach(card => {
                            observer.observe(card);
                        });
                    }
                }
            });
        });
    } else {
        // For filtered results, use Intersection Observer for all cards
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !entry.target.classList.contains('visible')) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        eventCards.forEach(card => {
            observer.observe(card);
        });
    }
}

// Initialize overlay heights
function initializeOverlayHeights() {
    const imageCards = document.querySelectorAll('.event-card.image-card');
    imageCards.forEach(card => {
        const img = card.querySelector('.event-poster-image');
        if (img) {
            if (img.complete) {
                updateOverlayHeight(card, img);
            } else {
                img.addEventListener('load', () => {
                    updateOverlayHeight(card, img);
                });
            }
        }
    });
}

function updateOverlayHeight(card, img) {
    const overlay = card.querySelector('.poster-overlay');
    if (overlay) {
        overlay.style.height = img.offsetHeight + 'px';
        
        card.addEventListener('mouseenter', () => {
            setTimeout(() => {
                overlay.style.height = img.offsetHeight + 'px';
            }, 10);
        });
    }
}

// Update event capacity on storage change
async function updateEventCapacity(eventId) {
    const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
    if (!eventCard) return;
    
    const event = eventsData.find(e => e.id === eventId);
    if (!event) return;
    
    // Get actual participation count from Firestore (with localStorage fallback)
    let participants = [];
    try {
        participants = await EventParticipants.getParticipants(eventId);
    } catch (error) {
        console.error('Error loading participants for capacity update:', error);
        // Fallback to localStorage
        const participantsKey = `event_participants_${eventId}`;
        participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');
    }
    
    const actualCurrent = event.capacity.current + participants.length;
    
    // Determine status based on actual capacity
    let displayStatus = event.status;
    if (actualCurrent >= event.capacity.total) {
        displayStatus = 'Sold Out';
    } else {
        displayStatus = 'Available';
    }
    
    // Update capacity and status
    const capacityElement = eventCard.querySelector('.info-capacity .info-value');
    const statusElement = eventCard.querySelector('.info-status .info-value');
    
    if (capacityElement) {
        capacityElement.textContent = `${actualCurrent}/${event.capacity.total}`;
    }
    if (statusElement) {
        statusElement.textContent = displayStatus;
    }
}

// Smooth scroll and basic interactions
document.addEventListener('DOMContentLoaded', function() {
    // Render events on page load
    renderEvents();
    
    // Listen for storage events to update event cards (localStorage fallback)
    window.addEventListener('storage', function() {
        // Update all event cards when storage changes
        eventsData.forEach(event => {
            updateEventCapacity(event.id);
        });
    });
    
    // Also listen for custom events (for same-window updates)
    window.addEventListener('eventParticipationChanged', function(e) {
        if (e.detail && e.detail.eventId) {
            updateEventCapacity(e.detail.eventId);
        }
    });
    
    // Update event capacities when page gains focus (user returns from detail page)
    window.addEventListener('focus', function() {
        eventsData.forEach(event => {
            updateEventCapacity(event.id);
        });
    });
    
    // Subscribe to real-time updates for all events
    eventsData.forEach(event => {
        EventParticipants.subscribeToParticipants(event.id, () => {
            updateEventCapacity(event.id);
        });
    });

    // Category filter functionality
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Get category from link text or data attribute
            const categoryMap = {
                'socializing': 'socializing',
                'private party': 'private party',
                'self-development': 'self-development',
                'regular gathering': 'regular gathering',
                'all': 'all'
            };
            
            let category = 'all';
            const linkText = this.textContent.trim().toLowerCase();
            
            // Check if link has data-category attribute
            if (this.dataset.category) {
                category = this.dataset.category;
            } else if (categoryMap[linkText]) {
                category = categoryMap[linkText];
            }
            
            // Render filtered events
            renderEvents(category);
            // Re-initialize animations after filtering
            // Reset flag for filtered results
            window.scrollAnimationsInitialized = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        initializeScrollAnimations();
                    }, 100);
                });
            });
        });
    });
    
    // Initialize scroll animations on initial page load
    // Use multiple requestAnimationFrame calls to ensure DOM and layout are fully ready
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    initializeScrollAnimations();
                }, 100);
            });
        });
    });
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to top button
    const topButton = document.querySelector('.top-button');
    if (topButton) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                topButton.style.opacity = '1';
                topButton.style.visibility = 'visible';
            } else {
                topButton.style.opacity = '0';
                topButton.style.visibility = 'hidden';
            }
        });
        
        // Initially hide the button
        topButton.style.opacity = '0';
        topButton.style.visibility = 'hidden';
        topButton.style.transition = 'opacity 0.3s, visibility 0.3s';
    }

});
