/* site-effects.js : page-load splash + night mode.
   Add  <script src="site-effects.js"></script>  inside <head> of every page. */
(function () {
  var root = document.documentElement, KEY = 'night-mode';

  /* ---------- apply saved theme + splash immediately (no flash) ---------- */
  try { if (localStorage.getItem(KEY) === 'dark') root.setAttribute('data-night', 'on'); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arriving = false;
  try { arriving = sessionStorage.getItem('splash') === '1'; sessionStorage.removeItem('splash'); } catch (e) {}
  if (arriving && !reduce) root.classList.add('splash', 'arriving');

  /* ---------- styles ---------- */
  var DARK = 'invert(1) hue-rotate(180deg)';
  var css = `
  html.splash::before{content:"አለታ-ህዳሴ";position:fixed;inset:0;z-index:99999;display:grid;place-items:center;
    background:#0f1730;color:#ff7a3d;font:800 clamp(2rem,6vw,3rem) "Noto Sans Ethiopic",system-ui,sans-serif;animation:sp-in .25s ease both}
  html.splash::after{content:"";position:fixed;left:50%;top:calc(50% + 46px);width:120px;height:4px;margin-left:-60px;z-index:100000;
    border-radius:4px;background:linear-gradient(90deg,#ff7a3d,#fdc83a);animation:sp-bar .7s ease-in-out infinite alternate}
  html.splash.arriving::before{animation:none}
  html.splash-out::before,html.splash-out::after{opacity:0;transition:opacity .4s ease}
  @keyframes sp-in{from{opacity:0}to{opacity:1}}
  @keyframes sp-bar{from{transform:scaleX(.3)}to{transform:scaleX(1)}}

  /* night mode: invert the page, but keep the header, pictures and video as they are */
  html[data-night="on"]{background:#0b1020;color-scheme:dark}
  html[data-night="on"] body{background:#0b1020}
  html[data-night="on"] body > :not(header):not(nav):not(script):not(style):not(#theme-toggle):not(#lang-toggle){filter:${DARK}}
  html[data-night="on"] body > :not(header):not(nav) :is(img,picture,video,iframe,canvas,.hero){filter:${DARK}}
  #theme-toggle{cursor:pointer}
  #theme-toggle.floating{position:fixed;right:16px;bottom:16px;z-index:9999;width:46px;height:46px;border-radius:50%;
    border:0;background:#14206b;color:#fff;font-size:1.3rem;line-height:1;box-shadow:0 4px 14px rgba(0,0,0,.35)}
  #lang-toggle{position:fixed;right:22px;bottom:78px;z-index:10001;padding:10px 18px;border:2px solid #f08a5d;
    border-radius:999px;background:#0e1a35;color:#fff;font:700 .9rem Arial,"Noto Sans Ethiopic",sans-serif;
    cursor:pointer;box-shadow:0 6px 18px rgba(14,26,53,.25)}
  #lang-toggle:hover{background:#f08a5d;color:#0e1a35;transform:translateY(-2px)}
  `;
  var st = document.createElement('style'); st.textContent = css; (document.head || root).appendChild(st);

  /* ---------- after the page is ready ---------- */
  function ready() {
    /* hide the splash */
    if (root.classList.contains('splash')) {
      var hide = function () {
        root.classList.add('splash-out');
        setTimeout(function () { root.classList.remove('splash', 'splash-out', 'arriving'); }, 420);
      };
      if (document.readyState === 'complete') setTimeout(hide, 250);
      else window.addEventListener('load', function () { setTimeout(hide, 250); });
    }

    /* Switch between authored English and Amharic text. */
    if (!window.__siteLanguageInitialized) {
    window.__siteLanguageInitialized = true;
    var langBtn = document.getElementById('lang-toggle');
    if (!langBtn) {
      langBtn = document.createElement('button');
      langBtn.id = 'lang-toggle';
      langBtn.className = 'notranslate';
      langBtn.type = 'button';
      langBtn.setAttribute('translate', 'no');
      document.body.appendChild(langBtn);
    }
    var lang = 'en';
    try {
      if (localStorage.getItem('site_lang_initialized') !== '1') {
        localStorage.setItem('site_lang', 'en');
        localStorage.setItem('lv_lang', 'en');
        localStorage.setItem('site_lang_initialized', '1');
      }
      lang = localStorage.getItem('site_lang') === 'am' ? 'am' : 'en';
    } catch (e) {}

    function updateLanguageButton() {
      langBtn.textContent = lang === 'am' ? 'EN' : 'አማ';
      langBtn.setAttribute('aria-label', lang === 'am' ? 'ወደ እንግሊዝኛ ቀይር' : 'Translate page to Amharic');
      langBtn.setAttribute('aria-pressed', lang === 'am' ? 'true' : 'false');
      root.lang = lang;
      try { localStorage.setItem('lv_lang', lang); } catch (e) {}
    }
    function translateElements(scope) {
      var selector = '[data-en][data-am], [data-en-placeholder][data-am-placeholder], [data-en-title][data-am-title], [data-en-aria-label][data-am-aria-label]';
      var nodes = [];
      if (scope.nodeType === 1 && scope.matches(selector)) nodes.push(scope);
      if (scope.querySelectorAll) {
        nodes = nodes.concat(Array.prototype.slice.call(scope.querySelectorAll(selector)));
      }
      nodes.forEach(function (el) {
        if (!el.children.length) {
          var text = el.getAttribute(lang === 'am' ? 'data-am' : 'data-en');
          if (text !== null && el.textContent !== text) el.textContent = text;
        }
        ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
          var en = el.getAttribute('data-en-' + attr);
          var am = el.getAttribute('data-am-' + attr);
          if (en !== null && am !== null) el.setAttribute(attr, lang === 'am' ? am : en);
        });
      });
    }
    updateLanguageButton();
    translateElements(document);
    var languageObserver = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) translateElements(node);
        });
      });
    });
    languageObserver.observe(document.body, {childList: true, subtree: true});
    langBtn.addEventListener('click', function () {
      lang = lang === 'am' ? 'en' : 'am';
      try { localStorage.setItem('site_lang', lang); } catch (e) {}
      updateLanguageButton();
      translateElements(document);
      window.dispatchEvent(new CustomEvent('site-language-change', {detail: {language: lang}}));
    });
    }

    /* night-mode button: #theme-toggle, else the moon/sun button, else the last button in the header */
    var btn = document.getElementById('theme-toggle') ||
      document.querySelector('.nav-actions .icon-button') ||
      Array.prototype.find.call(document.querySelectorAll('header button, header a, nav button'),
        function (b) { return /[☾🌙☀🌞]/.test(b.textContent); });
    if (!btn) {
      btn = document.createElement('button'); btn.className = 'floating'; btn.textContent = '☾';
      document.body.appendChild(btn);
    }
    if (btn) {
      var setIcon = function () {
        var dark = root.getAttribute('data-night') === 'on';
        btn.textContent = dark ? '☀' : '☾';
        btn.setAttribute('aria-pressed', dark);
        btn.setAttribute('aria-label', root.lang === 'am'
          ? (dark ? 'ወደ ቀን ሁነታ ቀይር' : 'ወደ ሌሊት ሁነታ ቀይር')
          : (dark ? 'Switch to day mode' : 'Switch to night mode'));
      };
      var fresh = btn.cloneNode(true);            // removes any old click handlers
      btn.parentNode.replaceChild(fresh, btn); btn = fresh; btn.id = 'theme-toggle';
      if (btn.tagName === 'A') {                       // your icon is an <a> without a link: make it behave like a button
        btn.setAttribute('role', 'button'); btn.tabIndex = 0; btn.style.cursor = 'pointer';
        btn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btn.click(); } });
      } else btn.type = 'button';
      btn.addEventListener('click', function () {
        var dark = root.getAttribute('data-night') === 'on';
        if (dark) root.removeAttribute('data-night'); else root.setAttribute('data-night', 'on');
        try { localStorage.setItem(KEY, dark ? 'light' : 'dark'); } catch (e) {}
        setIcon();
      });
      setIcon();
      window.addEventListener('site-language-change', setIcon);
    }

    /* menu text turns black while the menu is over a light background */
    var navEl = document.querySelector('nav'), hdrEl = document.querySelector('header') || navEl, ticking = false;
    function isLight(el) {
      for (; el && el !== root; el = el.parentElement) {
        var cs = getComputedStyle(el);
        if (cs.backgroundImage !== 'none') return false;              // photo / gradient (hero) = dark
        var m = cs.backgroundColor.match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > 0.5))
          return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6;
      }
      return false;
    }
    function updateNav() {
      ticking = false;
      if (!navEl) return;
      var light = false;
      if (root.getAttribute('data-night') !== 'on') {
        var r = hdrEl.getBoundingClientRect(), y = Math.max(1, Math.min(r.bottom - 8, innerHeight - 1)), votes = 0;
        hdrEl.style.pointerEvents = 'none';
        [0.25, 0.5, 0.75].forEach(function (f) { if (isLight(document.elementFromPoint(innerWidth * f, y))) votes++; });
        hdrEl.style.pointerEvents = '';
        light = votes >= 2;
      }
      navEl.classList.toggle('on-light', light);
    }
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(updateNav); } }
    addEventListener('scroll', queue, {passive: true}); addEventListener('resize', queue);
    document.addEventListener('click', function () { setTimeout(updateNav, 0); });   // after night-mode toggle
    updateNav();

    /* splash when moving between pages (including clicking Home while on Home) */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return;
      if (u.pathname === location.pathname && u.hash) return;      // same-page anchor: normal scroll
      if (reduce) return;
      e.preventDefault();
      root.classList.remove('arriving', 'splash-out'); root.classList.add('splash');
      try { sessionStorage.setItem('splash', '1'); } catch (err) {}
      setTimeout(function () { location.href = u.href; }, 280);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

  /* back/forward button: never leave the splash stuck */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) root.classList.remove('splash', 'splash-out', 'arriving');
  });
})();
