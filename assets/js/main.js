/**
 * Royse City Junk Removal — Main JavaScript
 * roysecityjunkremoval.com
 */

(function () {
  'use strict';

  /* ===========================
     Meta Pixel Utilities
  =========================== */
  const FB_PIXEL_ID = '2040716276843820';

  function genEventId(prefix) {
    const tag = (prefix || 'eid') + '_';
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return tag + crypto.randomUUID();
    }
    return tag + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function readFbCookie(name) {
    try {
      const m = document.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)');
      return m ? decodeURIComponent(m[1]) : '';
    } catch (_) { return ''; }
  }

  function normPhone(ph) {
    const d = (ph || '').replace(/\D/g, '');
    return d.length === 10 ? '1' + d : d;
  }

  // Capture landing time + fbclid at page load for accurate fbc construction
  const _fbLandingTime    = Date.now();
  const _fbclidAtLanding  = new URLSearchParams(window.location.search).get('fbclid') || '';

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

      // Capture UTM and click IDs for attribution parity with quote.html
      const _p = new URLSearchParams(window.location.search);
      data.utm_source   = _p.get('utm_source')   || 'direct';
      data.utm_medium   = _p.get('utm_medium')   || 'none';
      data.utm_campaign = _p.get('utm_campaign') || 'none';
      if (_p.get('utm_term'))    data.utm_term    = _p.get('utm_term');
      if (_p.get('utm_content')) data.utm_content = _p.get('utm_content');
      if (_p.get('gclid'))       data.gclid       = _p.get('gclid');
      if (_p.get('msclkid'))     data.msclkid     = _p.get('msclkid');
      if (_p.get('fbclid'))      data.fbclid      = _p.get('fbclid');

      // Source + URL for CAPI event_source_url and deduplication
      data.form_source = 'contact';
      data.page_url    = window.location.href;

      // Meta Pixel attribution — event ID forwarded to server for Conversions API deduplication
      const _fbEventId = genEventId('lead');
      data.fb_event_id = _fbEventId;
      data.fbp         = readFbCookie('_fbp');
      data.fbc         = readFbCookie('_fbc') ||
                         (_fbclidAtLanding ? 'fb.1.' + _fbLandingTime + '.' + _fbclidAtLanding : '');

      btn.innerHTML = '<span style="opacity:.7">Sending…</span>';
      btn.disabled  = true;

      try {
        const _ac  = new AbortController();
        const _tid = setTimeout(() => _ac.abort(), 15000);

        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
          signal:  _ac.signal,
        });

        clearTimeout(_tid);

        const json = await res.json().catch(() => ({}));

        if (res.ok && json.success) {
          showMsg(
            contactForm,
            '✅ Request sent! We\'ll call you within 1 hour. For same-day service call 469-721-0145.',
            'success'
          );
          contactForm.reset();
          contactForm.querySelectorAll('[required]').forEach(f => { f.classList.remove('form-field-error'); });
          if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
              event_category: 'Contact',
              event_label: data.service || 'unknown',
            });
          }
          if (typeof fbq !== 'undefined') {
            try {
              fbq('init', FB_PIXEL_ID, {
                em: (data.email      || '').toLowerCase().trim(),
                ph: normPhone(data.phone),
                fn: (data.first_name || '').toLowerCase().trim(),
                ln: (data.last_name  || '').toLowerCase().trim(),
              });
              fbq('track', 'Lead', {
                content_category: 'Contact Form',
                content_name: data.service || 'general',
                value: 150,
                currency: 'USD',
              }, { eventID: _fbEventId });
            } catch (_fbErr) {}
          }
        } else {
          showMsg(
            contactForm,
            json.error || 'Something went wrong. Please call us at 469-721-0145.',
            'error'
          );
        }
      } catch {
        showMsg(contactForm, 'Network error. Please call us directly at 469-721-0145.', 'error');
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
     CTA Phone Icon — ring once on scroll
  =========================== */
  if ('IntersectionObserver' in window) {
    const phoneIcons = document.querySelectorAll('.cta-phone-icon');
    const phoneObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ring');
          phoneObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    phoneIcons.forEach(el => phoneObserver.observe(el));
  }

  /* ===========================
     Phone Click Tracking (GA4 + Meta Pixel)
     Uses event delegation — catches static and dynamically injected tel: links
  =========================== */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="tel:"]');
    if (!link) return;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'phone_call', {
        event_category: 'Contact',
        event_label: link.textContent.trim(),
      });
    }
    if (typeof fbq !== 'undefined') {
      try {
        fbq('track', 'Contact', {}, { eventID: genEventId('contact') });
      } catch (_fbErr) {}
    }
  });

  /* ===========================
     Meta Pixel — ViewContent on service & area pages
     Fires on any page whose path ends with -tx (all service/area pages)
     Powers intent-based audiences for retargeting and lookalikes
  =========================== */
  if (/-tx(\.html)?$/.test(window.location.pathname) && typeof fbq !== 'undefined') {
    try {
      const _h1   = document.querySelector('h1');
      const _slug = window.location.pathname.split('/').pop().replace(/\.html$/, '');
      fbq('track', 'ViewContent', {
        content_ids:      [_slug],
        content_name:     _h1 ? _h1.textContent.trim() : document.title,
        content_category: 'Junk Removal Service',
        content_type:     'product',
      });
    } catch (_fbErr) {}
  }

  /* ===========================
     Dynamic Year in Footer
  =========================== */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
