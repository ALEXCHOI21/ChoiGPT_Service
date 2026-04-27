// Scroll Animations using Intersection Observer
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    const animateElements = document.querySelectorAll('.project-grid, .glass-card, .section-tag, .service-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Smooth Scrolling for Nav Links
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

    // Navbar scroll effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '0.8rem 0';
            nav.style.backgroundColor = 'rgba(10, 11, 16, 0.95)';
        } else {
            nav.style.padding = '1.5rem 0';
            nav.style.backgroundColor = 'rgba(10, 11, 16, 0.8)';
        }
    });

    // Handle Inquiry Form Submission
    const inquiryForm = document.getElementById('inquiry-form');
    const formSuccess = document.getElementById('form-success');

    if (inquiryForm) {
        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate API call
            inquiryForm.style.display = 'none';
            formSuccess.style.display = 'block';
            
            // Scroll to the success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
});
