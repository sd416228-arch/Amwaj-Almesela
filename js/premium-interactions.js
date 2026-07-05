/**
 * Amwaj Almesela - Premium Storefront Interaction Script
 * Manages scroll animation triggers, intercepts template placeholders,
 * and handles newsletter submissions via Toastr notifications.
 */

$(document).ready(function() {
    // 1. Initialize Scroll Reveal animations
    initializeScrollReveal();

    // 2. Intercept Newsletter Form Submissions
    handleNewsletter();

    // 3. Intercept Empty/Placeholder buttons and links
    handlePlaceholderLinks();
});

/**
 * Checks for elements with class 'reveal-fade-in' and animates them
 * into view as the user scrolls down the page.
 */
function initializeScrollReveal() {
    const revealElements = document.querySelectorAll('.product-card, .flash_deal_product, .__best-selling, .category_div');
    
    // Add the class dynamically to avoid layout shifting on initial load
    revealElements.forEach(el => {
        el.classList.add('reveal-fade-in');
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        revealElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => {
            el.classList.add('active');
        });
    }
}

/**
 * Binds client side validations and animations to the footer newsletter form.
 */
function handleNewsletter() {
    const form = $('form[action="subscription"]');
    if (!form.length) return;

    form.on('submit', function(e) {
        e.preventDefault();
        const emailInput = form.find('input[type="email"]');
        const email = emailInput.val().trim();

        if (!email) return;

        // Perform mock animation on the button
        const button = form.find('button[type="submit"]');
        const originalText = button.html();
        
        button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i>');

        setTimeout(() => {
            button.prop('disabled', false).html(originalText);
            emailInput.val('');

            if (window.toastr) {
                toastr.success('Thank you for subscribing to our newsletter!', 'Newsletter Subscribed', {
                    closeButton: true,
                    progressBar: true,
                    positionClass: "toast-bottom-right"
                });
            } else {
                alert('Thank you for subscribing to our newsletter!');
            }
        }, 1200);
    });
}

/**
 * Gracefully intercept template buttons or footer policies that link to dead endpoints,
 * showing a friendly "Coming Soon" toast rather than 404 or empty redirect.
 */
function handlePlaceholderLinks() {
    const deadSelectors = [
        'a[href="about-us"]',
        'a[href="contacts"]',
        'a[href="helpTopic"]',
        'a[href="refund-policy"]',
        'a[href="return-policy"]',
        'a[href="cancellation-policy"]',
        'a[href="track-order"]',
        'a[href="terms"]',
        'a[href="privacy-policy"]',
        'a[href="subscription"]'
    ];

    $(document).on('click', deadSelectors.join(','), function(e) {
        e.preventDefault();
        const pageName = $(this).text().trim() || "This section";
        
        if (window.toastr) {
            toastr.info(`${pageName} page is being updated. Full deployment coming soon!`, 'Information', {
                closeButton: true,
                progressBar: true,
                positionClass: "toast-bottom-right"
            });
        } else {
            alert(`${pageName} page is being updated. Full deployment coming soon!`);
        }
    });
}
