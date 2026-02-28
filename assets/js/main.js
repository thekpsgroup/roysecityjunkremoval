/**
 * Royse City Junk Removal — Main JavaScript
 * roysecityjunkremoval.com
 */

(function () {
  'use strict';

  /* ===========================
     Sticky Header
  =========================== */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ===========================
     Mobile Menu
  =========================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav    = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (e) => {
      if (
        mainNav.classList.contains('open') &&
        !mainNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) closeMenu();
    });

    function closeMenu() {
      mainNav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /* ===========================
     Active Nav Link
  =========================== */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ===========================
     FAQ Accordion
  =========================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item, index) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(other => {
        other.classList.remove('open');
        const q = other.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });

    // Open first by default
    if (index === 0) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
    }
  });

  /* ===========================
     Smooth Scroll Anchor Links
  =========================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = (header ? header.offsetHeight : 0) + 16;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth',
        });
      }
    });
  });

  /* ===========================
     Contact Form — Resend via /api/contact
  =========================== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('[type="submit"]');
      const originalHtml = btn.innerHTML;

      // Validate required fields
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        field.classList.remove('form-field-error');
        if (!field.value.trim()) {
          field.classList.add('form-field-error');
          valid = false;
        }
      });

      if (!valid) {
        showMsg(contactForm, 'Please fill in all required fields.', 'error');
        return;
      }

      // Build payload
      const data = {};
      new FormData(contactForm).forEach((val, key) => { data[key] = val; });

      btn.innerHTML = '<span style="opacity:.7">Sending…</span>';
      btn.disabled  = true;

      try {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok && json.success) {
          showMsg(
            contactForm,
            '✅ Request sent! We\'ll call you within 1 hour. For same-day service call 469-534-3392.',
            'success'
          );
          contactForm.reset();
          contactForm.querySelectorAll('[required]').forEach(f => { f.classList.remove('form-field-error'); });
          if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
              event_category: 'Contact',
              event_label: data['service'] || 'unknown',
            });
          }
        } else {
          showMsg(
            contactForm,
            json.error || 'Something went wrong. Please call us at 469-534-3392.',
            'error'
          );
        }
      } catch {
        showMsg(contactForm, 'Network error. Please call us directly at 469-534-3392.', 'error');
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled  = false;
      }
    });

    // Clear red border on input
    contactForm.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => {
        if (field.value.trim()) {
          field.classList.remove('form-field-error');
        }
      });
    });
  }

  function showMsg(form, message, type) {
    let el = form.querySelector('.form-message');
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-message';
      form.appendChild(el);
    }
    el.textContent = message;
    const isSuccess = type === 'success';
    el.className = isSuccess ? 'form-message form-message-success' : 'form-message form-message-error';
    if (isSuccess) setTimeout(() => el.remove(), 10000);
  }

  /* ===========================
     Animated Number Counters
  =========================== */
  function animateCounter(el, target, duration = 1400) {
    const start = performance.now();
    const isDecimal = String(target).includes('.');
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = ease * target;
      el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ===========================
     Intersection Observer
  =========================== */
  if ('IntersectionObserver' in window) {
    // Counter animation
    const counters = document.querySelectorAll('[data-count]');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el  = entry.target;
          const val = parseFloat(el.dataset.count);
          animateCounter(el, val);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => {
      el.textContent = '0';
      counterObserver.observe(el);
    });

    // Fade-in cards
    const fadeEls = document.querySelectorAll(
      '.service-card, .step-card, .area-card, .feature-item, .testimonial-card, .pricing-card, .accept-item'
    );
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('fade-in-visible');
          }, (i % 6) * 70);
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    fadeEls.forEach(el => {
      el.classList.add('fade-in-ready');
      fadeObserver.observe(el);
    });
  }

  /* ===========================
     Phone Click Tracking (GA4)
  =========================== */
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_call', {
          event_category: 'Contact',
          event_label: link.textContent.trim(),
        });
      }
    });
  });

  /* ===========================
     Dynamic Year in Footer
  =========================== */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
