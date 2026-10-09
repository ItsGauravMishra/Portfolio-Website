(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // ---------- Theme ----------
    const root = document.documentElement;
    const themeBtn = $('#theme-toggle');

    function storedTheme() {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) { /* storage unavailable */ }
    }

    const initial = storedTheme() ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    root.setAttribute('data-theme', initial);

    themeBtn.addEventListener('click', () => {
        applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    // ---------- Navigation ----------
    const nav = $('#nav');
    const menu = $('#nav-menu');
    const hamburger = $('#hamburger');

    function setMenu(open) {
        menu.classList.toggle('open', open);
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', String(open));
    }

    hamburger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    $$('.nav-link').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    function onScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Highlight the link of the section in view
    const links = $$('.nav-link');
    const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => spy.observe(s));
    }

    // ---------- Reveal on scroll ----------
    const revealTargets = $$('.section-head, .card, .timeline-item, .about-grid, .learning, .contact-grid');
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealTargets.forEach(el => el.classList.add('reveal'));
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealTargets.forEach(el => io.observe(el));
    }

    // ---------- Footer year ----------
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // ---------- Contact form (EmailJS) ----------
    const form = $('#contact-form');
    if (!form) return;

    const submitBtn = $('#submit-btn');
    const btnText = $('#btn-text');
    const statusEl = $('#form-status');
    const emailJS = {
        publicKey: 'gEQahHnEQ_kSAltX7',
        serviceID: 'service_b01c26r',
        templateID: 'template_jeyqk88'
    };
    let hideTimer;

    function showStatus(text, type) {
        clearTimeout(hideTimer);
        statusEl.textContent = text;
        statusEl.className = 'form-message ' + type;
        statusEl.hidden = false;
        hideTimer = setTimeout(() => { statusEl.hidden = true; }, 8000);
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        btnText.textContent = loading ? 'Sending...' : 'Send message';
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const data = new FormData(form);
        const params = {
            from_name: (data.get('from_name') || '').trim(),
            from_email: (data.get('from_email') || '').trim(),
            subject: (data.get('subject') || '').trim(),
            message: (data.get('message') || '').trim(),
            to_name: 'Gaurav Mishra'
        };
        params.reply_to = params.from_email;

        if (!params.from_name || !params.from_email || !params.subject || !params.message) {
            showStatus('Please fill in all fields.', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.from_email)) {
            showStatus('Please enter a valid email address.', 'error');
            return;
        }
        if (params.message.length < 10) {
            showStatus('Please write a slightly longer message (at least 10 characters).', 'error');
            return;
        }
        if (typeof emailjs === 'undefined') {
            showStatus('The email service could not be loaded. Please email me directly.', 'error');
            return;
        }

        setLoading(true);
        try {
            emailjs.init(emailJS.publicKey);
            await emailjs.send(emailJS.serviceID, emailJS.templateID, params);
            showStatus('Thanks! Your message has been sent and I will get back to you soon.', 'success');
            form.reset();
        } catch (err) {
            showStatus('Sorry, the message could not be sent. Please try again or email me directly.', 'error');
        } finally {
            setLoading(false);
        }
    });
})();
