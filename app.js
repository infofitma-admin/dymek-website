(function () {
  'use strict';

  /* ---------- Reveal-on-scroll animation ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('.r');

  Array.prototype.forEach.call(revealables, function (el) {
    var d = el.getAttribute('data-d');
    if (d) el.style.setProperty('--d', d);
  });

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- Scroll progress bar + active nav link ---------- */
  var bar = document.getElementById('progressBar');
  var navLinks = document.querySelectorAll('.nav-horizontal a');
  var sections = [];
  Array.prototype.forEach.call(navLinks, function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el) sections.push({ link: a, el: el });
  });

  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var doc = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (doc > 0 ? (y / doc) * 100 : 0) + '%';

    var mid = y + window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (s) { if (s.el.offsetTop <= mid) current = s; });
    sections.forEach(function (s) {
      var on = s === current;
      s.link.classList.toggle('is-here', on);
      if (on) s.link.setAttribute('aria-current', 'true'); else s.link.removeAttribute('aria-current');
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Contact form ----------
     Sends directly in the background, with no email app and no extra click:
     1) FormSubmit emails the enquiry straight to web@dymek.com
     2) Netlify Forms also stores a copy (if form detection is on)
     The visitor sees success if either service accepts it. */
  var RECIPIENT = 'web@dymek.com';
  var form = document.getElementById('enquiry');
  var status = document.getElementById('form-status');

  function showError(msg) {
    if (!status) return;
    status.className = 'field--wide form__status is-error';
    status.innerHTML = msg;
  }

  function sendToEmail(data) {
    var payload = {};
    data.forEach(function (v, k) {
      if (k === 'bot-field' || k === 'form-name' || k === 'subject') return;
      payload[k] = v;
    });
    payload._subject = 'New route-planning enquiry: ' + (payload.company || payload.name || 'Dymek website');
    payload._replyto = payload.email;
    payload._template = 'table';
    payload._captcha = 'false';
    return fetch('https://formsubmit.co/ajax/' + RECIPIENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        // "success": sent. "needs activation": first-ever use; FormSubmit holds the
        // message and delivers it once web@dymek.com clicks Activate (one time only).
        if (String(j.success) === 'true' || /activat/i.test(j.message || '')) return true;
        throw new Error(j.message || ('HTTP ' + res.status));
      });
    });
  }

  function sendToNetlify(data) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    }).then(function (res) {
      if (!res.ok) throw new Error('Netlify ' + res.status);
      return true;
    });
  }

  function showSuccess() {
    var wrap = form.parentNode;
    form.reset();
    form.hidden = true;
    var note = wrap.querySelector('.note');
    if (note) note.hidden = true;
    var ok = document.createElement('div');
    ok.className = 'form-success';
    ok.setAttribute('role', 'status');
    ok.setAttribute('tabindex', '-1');
    ok.innerHTML = '<div class="form-success__ico" aria-hidden="true"><svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>' +
      '<h4>Thank you. Your enquiry has been sent.</h4>' +
      '<p>A member of the Dymek team will contact you shortly to arrange an initial consultation.</p>';
    wrap.insertBefore(ok, form);
    ok.focus();
  }

  if (form) {
    form.setAttribute('novalidate', '');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');

      if (!form.checkValidity()) {
        var firstBad = form.querySelector(':invalid');
        showError('Please complete the required fields (Name, Company, Email and Country) with a valid email address.');
        if (firstBad) firstBad.focus();
        return;
      }

      var data = new FormData(form);
      if (data.get('bot-field')) { showSuccess(); return; } // spam bot

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (status) { status.className = 'field--wide form__status'; status.textContent = ''; }

      var jobs = [sendToEmail(data), sendToNetlify(data)].map(function (p) {
        return p.then(function () { return true; }, function () { return false; });
      });

      Promise.all(jobs).then(function (r) {
        if (r[0] || r[1]) {
          showSuccess();
        } else {
          if (btn) { btn.disabled = false; btn.textContent = 'Submit Enquiry'; }
          showError('Sorry, we could not send your enquiry. Please check your internet connection and try again.');
        }
      });
    });
  }

  /* ---------- Industry pills: click to start an enquiry ---------- */
  var industrySelect = document.getElementById('f-ind');
  Array.prototype.forEach.call(document.querySelectorAll('[data-industry]'), function (a) {
    a.addEventListener('click', function () {
      if (!industrySelect) return;
      var val = (a.getAttribute('data-industry') || a.textContent).trim();
      Array.prototype.forEach.call(industrySelect.options, function (o) {
        if (o.text.trim() === val) industrySelect.value = o.value || o.text;
      });
      setTimeout(function () {
        var first = document.getElementById('f-name');
        if (first) first.focus({ preventScroll: true });
      }, 600);
    });
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    Array.prototype.forEach.call(mobileNav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); }
    });
  }

  /* ---------- Header shrink + back-to-top button ---------- */
  var masthead = document.getElementById('masthead');
  var toTop = document.querySelector('.to-top');
  function onScrollUI() {
    var y = window.scrollY;
    if (masthead) masthead.classList.toggle('is-scrolled', y > 40); // shadow only
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight);
  }
  window.addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  /* ---------- Mobile sticky CTA: hide while the form is on screen ---------- */
  var mcta = document.querySelector('.mobile-cta');
  var formArea = document.getElementById('contact-form');
  if (mcta && formArea && 'IntersectionObserver' in window) {
    var heroEl = document.getElementById('overview');
    var formVisible = false, heroVisible = true;
    function syncCta() { document.body.classList.toggle('show-mcta', !formVisible && !heroVisible); }
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; syncCta(); }, { threshold: 0.05 }).observe(formArea);
    if (heroEl) new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; syncCta(); }, { threshold: 0.15 }).observe(heroEl);
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
