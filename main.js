/* ==========================================================
   MAIN.JS v2 — Lic. Martín Monte
   ========================================================== */
(function () {
  'use strict';

  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn('[Monte] ' + name + ' falló:', e.message); }
  }

  /* ── SPLASH ─────────────────────────────────────────────── */
  safe(function () {
    var splash = document.getElementById('splash');
    if (!splash) return;
    setTimeout(function () { splash.classList.add('hidden'); }, 4600);
  }, 'splash');

  /* ── NAV SCROLL ──────────────────────────────────────────── */
  safe(function () {
    var nav = document.getElementById('nav');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }, 'nav-scroll');

  /* ── CAMBIO 3: marca lateral solo visible en el hero ─────── */
  safe(function () {
    var mark = document.getElementById('side-mark');
    var hero = document.getElementById('hero');
    if (!mark || !hero) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        mark.classList.toggle('hidden', !e.isIntersecting);
      });
    }, { threshold: 0.1 });
    io.observe(hero);
  }, 'side-mark');

  /* ── CURSOR PERSONALIZADO ────────────────────────────────── */
  safe(function () {
    var ring  = document.getElementById('cursor-ring');
    var dot   = document.getElementById('cursor-dot');
    var label = document.getElementById('cursor-label');
    if (!ring || !dot || !label) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    }, { passive: true });

    (function animate() {
      rx += (mx - rx) * .12;
      ry += (my - ry) * .12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      label.style.left = mx + 'px';
      label.style.top  = my + 'px';
      requestAnimationFrame(animate);
    })();

    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        label.textContent = el.getAttribute('data-cursor');
        document.body.classList.add('cursor-active', 'cursor-expand');
      });
      el.addEventListener('mouseleave', function () {
        label.textContent = '';
        document.body.classList.remove('cursor-active', 'cursor-expand');
      });
    });
  }, 'cursor');

  /* ── REVEAL ──────────────────────────────────────────────── */
  safe(function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var safetyTimer = setTimeout(function () {
      els.forEach(function (el) { el.classList.add('visible'); });
    }, 6000);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    window.addEventListener('scroll', function check() {
      if (document.querySelectorAll('.reveal:not(.visible)').length === 0) {
        clearTimeout(safetyTimer);
        window.removeEventListener('scroll', check);
      }
    }, { passive: true });
  }, 'reveal');

  /* ── GSAP HERO ───────────────────────────────────────────── */
  safe(function () {
    if (typeof gsap === 'undefined') return;
    gsap.from('.hero-title',   { opacity:0, y:60, duration:1.2, ease:'power3.out', delay:4.8 });
    gsap.from('.hero-kicker',  { opacity:0, x:-30, duration:.8, ease:'power2.out', delay:5.0 });
    gsap.from('.hero-tagline', { opacity:0, y:20, duration:.8, ease:'power2.out', delay:5.2 });
    gsap.from('.hero-ctas',    { opacity:0, y:20, duration:.8, ease:'power2.out', delay:5.4 });
    gsap.from('.hero-img-wrap',{ opacity:0, scale:.95, duration:1.2, ease:'power3.out', delay:4.8 });
  }, 'gsap-hero');

  /* ── CARRUSEL MOTIVOS — circular ────────────────────────── */
  safe(function () {
    var wrap    = document.getElementById('motivos-cards-wrap');
    var track   = document.getElementById('motivos-cards');
    var dots    = document.querySelectorAll('.motivos-dot');
    var btnPrev = document.getElementById('motivo-prev');
    var btnNext = document.getElementById('motivo-next');
    var counter = document.getElementById('motivo-current');
    if (!wrap || !track) return;

    var cards  = track.querySelectorAll('.motivo-compact');
    var total  = cards.length;
    var current = 0;
    var startX  = 0, isDragging = false, dragStartX = 0;

    function cardWidth() {
      if (window.innerWidth <= 640) return window.innerWidth;
      return cards[0] ? cards[0].offsetWidth + 20 : 0;
    }

    function goTo(idx) {
      // circular
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      current = idx;
      track.style.transform = 'translateX(-' + (current * cardWidth()) + 'px)';
      dots.forEach(function(d,i){ d.classList.toggle('active', i === current); });
      if (counter) counter.textContent = (current+1).toString().padStart(2,'0');
    }

    if (btnPrev) btnPrev.addEventListener('click', function(){ goTo(current - 1); });
    if (btnNext) btnNext.addEventListener('click', function(){ goTo(current + 1); });
    dots.forEach(function(d,i){ d.addEventListener('click', function(){ goTo(i); }); });

    // Touch
    wrap.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, { passive:true });
    wrap.addEventListener('touchend',   function(e){
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
    }, { passive:true });

    // Mouse drag
    wrap.addEventListener('mousedown', function(e){ isDragging=true; dragStartX=e.clientX; });
    window.addEventListener('mouseup',  function(e){
      if (!isDragging) return;
      isDragging = false;
      var dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    });

    // Keyboard
    wrap.setAttribute('tabindex','0');
    wrap.addEventListener('keydown', function(e){
      if (e.key==='ArrowRight') goTo(current+1);
      if (e.key==='ArrowLeft')  goTo(current-1);
    });

    goTo(0);
  }, 'motivos-carousel');

  /* ── CARRUSEL TESTIMONIOS — circular en mobile ───────────── */
  safe(function () {
    var wrap     = document.querySelector('.test-carousel-wrap');
    var carousel = document.getElementById('test-carousel');
    var dots     = document.querySelectorAll('.test-dot');
    if (!wrap || !carousel) return;

    var items   = carousel.querySelectorAll('.test-vineta');
    var total   = items.length;
    var current = 0;
    var startX  = 0, isDragging = false, dragStartX = 0;

    function isMobile() { return window.innerWidth <= 640; }

    function goTo(idx) {
      if (!isMobile()) return;
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      current = idx;
      carousel.style.transform = 'translateX(-' + (current * 100) + 'vw)';
      dots.forEach(function(d,i){ d.classList.toggle('active', i===current); });
    }

    wrap.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, { passive:true });
    wrap.addEventListener('touchend',   function(e){
      if (!isMobile()) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
    }, { passive:true });

    wrap.addEventListener('mousedown', function(e){ isDragging=true; dragStartX=e.clientX; });
    window.addEventListener('mouseup',  function(e){
      if (!isDragging) return;
      isDragging = false;
      if (!isMobile()) return;
      var dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    });

    dots.forEach(function(d,i){ d.addEventListener('click', function(){ goTo(i); }); });

    goTo(0);
  }, 'test-carousel');

  /* ── FORMULARIO: MP primero, WA después con confirmación ─── */
  safe(function () {
    var form    = document.getElementById('booking-form');
    var section = document.getElementById('agendar');
    if (!form) return;

    var MP_LINK = 'https://mpago.la/2pskK8J';
    var WA_NUM  = '5492616117962';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre    = form.querySelector('#f-nombre').value.trim();
      var wsp       = form.querySelector('#f-wsp').value.trim();
      var modalidad = form.querySelector('#f-modalidad').value;
      var motivo    = form.querySelector('#f-motivo').value;
      var mensaje   = form.querySelector('#f-mensaje').value.trim();

      if (!nombre || !wsp || !modalidad || !motivo) {
        alert('Por favor completá todos los campos obligatorios.');
        return;
      }

      var texto = [
        '¡Hola Martín! Quiero reservar una sesión.',
        '',
        '👤 Nombre: ' + nombre,
        '📱 Mi WhatsApp: ' + wsp,
        '🗂 Modalidad: ' + modalidad,
        '💬 Motivo: ' + motivo,
        mensaje ? '📝 ' + mensaje : '',
        '',
        'Ya abono la seña por Mercado Pago.'
      ].filter(Boolean).join('\n');

      var waUrl = 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(texto);

      // 1. Abre Mercado Pago inmediatamente (dentro del evento click — no bloqueado)
      window.open(MP_LINK, '_blank', 'noopener');

      // 2. Muestra banner de confirmación para WA (evita el bloqueo de popup)
      var existing = document.getElementById('wa-confirm-banner');
      if (existing) existing.remove();

      var banner = document.createElement('div');
      banner.id = 'wa-confirm-banner';
      banner.innerHTML =
        '<p>✅ <strong>Ya se abrió Mercado Pago.</strong> Una vez que abonés la seña, avisale a Martín por WhatsApp:</p>' +
        '<a href="' + waUrl + '" target="_blank" rel="noopener" id="wa-confirm-btn">Avisar por WhatsApp →</a>' +
        '<button id="wa-confirm-close" aria-label="Cerrar">✕</button>';

      section.insertAdjacentElement('afterend', banner);

      document.getElementById('wa-confirm-close').addEventListener('click', function () {
        banner.remove();
      });

      // Scroll suave hacia el banner
      setTimeout(function () {
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    });
  }, 'formulario');

})();
