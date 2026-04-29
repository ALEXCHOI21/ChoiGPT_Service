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

    const SUPABASE_URL = 'https://bxtrfsjcxknmbopctvaw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dHJmc2pjeGtubWJvcGN0dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjAzNTAsImV4cCI6MjA4Njc5NjM1MH0.T95GvNYbpVU7um3WW2eyqikgWDn-dwsQ3zPxTM4rfhM';

    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = inquiryForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '전송 중...';

            const formData = {
                name: inquiryForm.querySelector('input[placeholder="홍길동"]').value,
                contact: inquiryForm.querySelector('input[placeholder="example@gmail.com"]').value,
                category: inquiryForm.querySelector('select').value,
                message: inquiryForm.querySelector('textarea').value
            };

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    inquiryForm.style.display = 'none';
                    formSuccess.style.display = 'block';
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    throw new Error('전송 실패');
                }
            } catch (error) {
                alert('문의 전송 중 오류가 발생했습니다. 이메일로 연락 부탁드립니다.');
                submitBtn.disabled = false;
                submitBtn.textContent = '문의 신청 완료';
            }
        });
    }
});
