/* ===========================================================
   NRJI · interactive behaviours
   - mouse-reactive aurora background (smoothed)
   - scroll-triggered reveal animations
   - simple form submit -> success state
   =========================================================== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- mouse-reactive aurora ---------- */
  (function () {
    var tx = 0, ty = 0, cx = 0, cy = 0;
    var RANGE = 160; // px of travel — orbs lightly follow the cursor
    function onMove(e) {
      var px = (e.touches ? e.touches[0].clientX : e.clientX);
      var py = (e.touches ? e.touches[0].clientY : e.clientY);
      tx = (px / window.innerWidth - 0.5) * RANGE;
      ty = (py / window.innerHeight - 0.5) * RANGE;
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });

    function tick() {
      cx += (tx - cx) * 0.085;
      cy += (ty - cy) * 0.085;
      root.style.setProperty('--mx', cx.toFixed(1) + 'px');
      root.style.setProperty('--my', cy.toFixed(1) + 'px');
      requestAnimationFrame(tick);
    }
    if (!reduce) requestAnimationFrame(tick);
  })();

  /* ---------- glowing orb that follows the cursor ---------- */
  (function () {
    var orb = document.createElement('div');
    orb.id = 'cursor-orb';
    function mount() {
      (document.body || root).appendChild(orb);
    }
    if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }

    var ox = window.innerWidth / 2, oy = window.innerHeight / 2;
    var px = ox, py = oy, seen = false;
    function onMove(e) {
      var t = e.touches ? e.touches[0] : e;
      px = t.clientX; py = t.clientY;
      if (!seen) { seen = true; ox = px; oy = py; orb.classList.add('on'); }
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseleave', function () { orb.classList.remove('on'); });
    window.addEventListener('mouseenter', function () { if (seen) orb.classList.add('on'); });

    function follow() {
      ox += (px - ox) * 0.055;
      oy += (py - oy) * 0.055;
      orb.style.transform = 'translate(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(follow);
    }
    if (!reduce) { requestAnimationFrame(follow); }
  })();

  /* ---------- scroll reveal ---------- */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- mobile state flag ---------- */
  (function () {
    var mq = window.matchMedia('(max-width:560px)');
    function sync() {
      var on = document.body.hasAttribute('data-force-mobile') || mq.matches;
      document.body.classList.toggle('is-mobile', on);
    }
    sync();
    if (mq.addEventListener) { mq.addEventListener('change', sync); } else if (mq.addListener) { mq.addListener(sync); }
  })();

  /* ---------- mobile nav dropdown ---------- */
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var links = nav.querySelector('.links');
    if (!links) return;
    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    var menu = document.createElement('div');
    menu.className = 'nav-menu';
    Array.prototype.slice.call(links.querySelectorAll('a')).forEach(function (a) {
      var c = a.cloneNode(true);
      c.classList.remove('hide-sm');
      menu.appendChild(c);
    });
    nav.appendChild(btn);
    nav.appendChild(menu);
    function close() { menu.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    function toggle() { var o = menu.classList.toggle('open'); btn.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) close(); });
  })();

  /* ---------- carousel swipe dots ---------- */
  (function () {
    var tracks = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
    tracks.forEach(function (track) {
      var items = Array.prototype.slice.call(track.children);
      if (items.length < 2) return;
      var dots = document.createElement('div');
      dots.className = 'swipe-dots';
      track.parentNode.insertBefore(dots, track.nextSibling);
      items.forEach(function (it, i) {
        var b = document.createElement('button');
        b.className = 'dot';
        b.setAttribute('aria-label', 'Go to ' + (i + 1));
        b.addEventListener('click', function () {
          track.scrollTo({ left: it.offsetLeft - track.offsetLeft, behavior: 'smooth' });
        });
        dots.appendChild(b);
      });
      var dotEls = Array.prototype.slice.call(dots.children);
      function update() {
        var c = track.scrollLeft + track.clientWidth / 2;
        var best = 0, bd = Infinity;
        items.forEach(function (it, i) {
          var mid = it.offsetLeft - track.offsetLeft + it.offsetWidth / 2;
          var d = Math.abs(mid - c);
          if (d < bd) { bd = d; best = i; }
        });
        dotEls.forEach(function (d, i) { d.classList.toggle('active', i === best); });
      }
      track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
      update();
    });
  })();

  /* ---------- founder credits marquee (mobile) ---------- */
  (function () {
    var row = document.querySelector('.founder .credits-row');
    if (!row || row.querySelector('.credits-track')) return;
    var spans = Array.prototype.slice.call(row.children);
    if (spans.length < 2) return;
    var track = document.createElement('div');
    track.className = 'credits-track';
    spans.forEach(function (s) { track.appendChild(s); });
    spans.forEach(function (s) { var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.className += ' dup'; track.appendChild(c); });
    row.appendChild(track);
  })();

  /* ---------- demo form submit ---------- */
  (function () {
    var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-demo]'));
    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var success = document.querySelector('#' + form.getAttribute('data-success'));
        form.style.display = 'none';
        if (success) {
          success.classList.add('show');
          var top = success.getBoundingClientRect().top + window.pageYOffset - 120;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  })();
})();
