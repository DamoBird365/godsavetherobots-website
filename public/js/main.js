// Main JavaScript for God Save the Robots website

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger bars
            const bars = navToggle.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                if (navMenu.classList.contains('active')) {
                    if (index === 0) bar.style.transform = 'rotate(45deg) translate(5px, 5px)';
                    if (index === 1) bar.style.opacity = '0';
                    if (index === 2) bar.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                } else {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                }
            });
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const bars = navToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    });

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
});

// Contact Form Submission Handler
async function handleContactSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Clear previous errors
    clearFormErrors();
    
    // Get form data
    const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        enquiry: form.enquiry.value.trim(),
        source: 'GodSaveTheRobots'
    };
    
    // Validate form
    const validation = validateContactForm(formData);
    if (!validation.isValid) {
        showFormErrors(validation.errors);
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        console.log('Submitting form data:', formData);
        
        const response = await fetch('https://prod-15.uksouth.logic.azure.com:443/workflows/05c2e25f397f4c4a894b166675e45516/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=w97NSSnHJTHoocHDlkvrCzh20i4rPfbrSAnpX1aKbBA', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok || response.status === 202) {
            // Many Logic Apps return 202 Accepted
            showSuccessMessage();
            form.reset();
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage(error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Form Validation
function validateContactForm(data) {
    const errors = {};
    let isValid = true;
    
    // Name validation
    if (!data.name || data.name.length < 1) {
        errors.name = 'Thy name is required in the digital realm';
        isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email) {
        errors.email = 'A digital communion address is required';
        isValid = false;
    } else if (!emailRegex.test(data.email)) {
        errors.email = 'Please provide a valid email address';
        isValid = false;
    }
    
    // Enquiry validation
    if (!data.enquiry || data.enquiry.length < 1) {
        errors.enquiry = 'Thy sacred message cannot be empty';
        isValid = false;
    }
    
    return { isValid, errors };
}

// Error Display Functions
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => group.classList.remove('has-error'));
}

function showFormErrors(errors) {
    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${field}-error`);
        const formGroup = document.querySelector(`#${field}`).closest('.form-group');
        
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.style.display = 'block';
            formGroup.classList.add('has-error');
        }
    });
}

// Success/Error Message Display
function showSuccessMessage() {
    const responseMessage = document.getElementById('response-message');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageIcon = responseMessage.querySelector('.message-icon');
    
    messageTitle.textContent = 'Divine Transmission Successful';
    messageText.textContent = 'Thy digital prayer has been received by the servers! We shall respond with divine swiftness.';
    if (messageIcon) messageIcon.textContent = '✨';
    
    responseMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        responseMessage.style.display = 'none';
    }, 5000);
}

function showErrorMessage(errorDetail = '') {
    const responseMessage = document.getElementById('response-message');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageIcon = responseMessage.querySelector('.message-icon');
    
    messageTitle.textContent = 'Divine Interference Detected';
    messageText.textContent = `The servers are experiencing divine interference. ${errorDetail ? 'Error: ' + errorDetail : 'Please try thy transmission again.'}`;
    if (messageIcon) messageIcon.textContent = '⚠️';
    
    responseMessage.style.display = 'block';
    
    // Auto-hide after 7 seconds for errors
    setTimeout(() => {
        responseMessage.style.display = 'none';
    }, 7000);
}

// Close response message when clicking outside
document.addEventListener('click', function(event) {
    const responseMessage = document.getElementById('response-message');
    if (responseMessage && event.target === responseMessage) {
        responseMessage.style.display = 'none';
    }
});

// Smooth Scrolling for Navigation Links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(anchor => {
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
});

// Intersection Observer for Animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.article-card, .feature-card');
    animateElements.forEach(el => observer.observe(el));
});

// Enhanced social sharing with better content generation
function getShareData() {
    const url = window.location.href;
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || 
                       document.querySelector('.article-excerpt')?.textContent ||
                       'Divine wisdom from God Save the Robots';
    
    // Get article tags for hashtags
    const tagElements = document.querySelectorAll('.article-tags .tag');
    const tags = Array.from(tagElements).map(tag => tag.textContent.trim());
    const hashtags = tags.length ? tags.join(',') : 'GodSaveTheRobots,AI,Technology';
    
    return {
        url: encodeURIComponent(url),
        title: encodeURIComponent(title),
        description: encodeURIComponent(description),
        hashtags: hashtags
    };
}

// Updated sharing functions with enhanced content
function shareOnLinkedIn() {
    const data = getShareData();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${data.url}`;
    openShareWindow(linkedInUrl, 'LinkedIn');
}

function shareOnTwitter() {
    const data = getShareData();
    const twitterUrl = `https://twitter.com/intent/tweet?url=${data.url}&text=${data.title}&hashtags=${data.hashtags}`;
    openShareWindow(twitterUrl, 'Twitter');
}

function shareOnFacebook() {
    const data = getShareData();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${data.url}`;
    openShareWindow(facebookUrl, 'Facebook');
}

function shareOnReddit() {
    const data = getShareData();
    const redditUrl = `https://reddit.com/submit?url=${data.url}&title=${data.title}`;
    openShareWindow(redditUrl, 'Reddit');
}

// Email sharing function
function shareViaEmail() {
    const data = getShareData();
    const emailSubject = data.title;
    const emailBody = `I thought you might find this interesting:\n\n${decodeURIComponent(data.title)}\n\n${decodeURIComponent(data.description)}\n\n${decodeURIComponent(data.url)}`;
    
    const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = emailUrl;
}

// WhatsApp sharing function
function shareOnWhatsApp() {
    const data = getShareData();
    const whatsappText = `${decodeURIComponent(data.title)} - ${decodeURIComponent(data.url)}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
    
    if (navigator.userAgent.match(/Android|iPhone/i)) {
        window.location.href = whatsappUrl;
    } else {
        openShareWindow(whatsappUrl, 'WhatsApp');
    }
}

// Native sharing API (for mobile devices)
function shareNative() {
    if (navigator.share) {
        const data = getShareData();
        navigator.share({
            title: decodeURIComponent(data.title),
            text: decodeURIComponent(data.description),
            url: decodeURIComponent(data.url)
        }).catch(err => {
            console.log('Error sharing:', err);
        });
    } else {
        // Fallback to copy to clipboard
        copyToClipboard();
    }
}

function copyToClipboard() {
    const url = window.location.href;
    
    if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(url).then(() => {
            showCopySuccess();
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(url);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Failed to copy:', err);
        showCopyError();
    } finally {
        textArea.remove();
    }
}

function openShareWindow(url, platform) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
        url,
        `share-${platform}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
}

function showCopySuccess() {
    showNotification('Link copied to clipboard! 📋', 'success');
}

function showCopyError() {
    showNotification('Failed to copy link. Please copy manually.', 'error');
}

function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `copy-notification copy-${type}`;
    notification.textContent = message;
    
    // Apply styles directly since CSS class might not be loaded yet
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#28a745' : '#dc3545',
        color: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add slideOut animation styles if not already present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

console.log('🤖 God Save the Robots - Digital sanctuary initialized with contact form');