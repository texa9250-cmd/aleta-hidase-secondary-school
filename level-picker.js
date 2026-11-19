/* Level -> Grade picker (attractive version).
   Put this file next to levels.html (public folder).
   Clicking Foundation, Growth or Excellence opens an animated window
   where the student chooses Grade 9, 10 or 11. */
(function () {
  if (!document.body || document.body.dataset.page !== 'hub') return;

  var PORTAL = '/portal/';              // folder that holds grade.html
  var GRADES = [
    {g: '9',  tag: 'Start strong', am: 'በጠንካራ መሠረት ይጀምሩ', icon: '🌱'},
    {g: '10', tag: 'Build up', am: 'ዕውቀትዎን ያሳድጉ', icon: '📘'},
    {g: '11', tag: 'Aim higher', am: 'ከፍ ያለ ዓላማ ይኑርዎት', icon: '🚀'}
  ];
  var LEVELS = {
    foundation: {name: 'Foundation', icon: '🌱', color: '#4ade80', line: 'Strong basics, one small step at a time.'},
    growth:     {name: 'Growth',     icon: '📈', color: '#5ec2ff', line: 'Strengthen what you know and keep climbing.'},
    excellence: {name: 'Excellence', icon: '🏆', color: '#ffc857', line: 'Challenge yourself and aim for the top.'}
  };

  var css = document.createElement('style');
  css.textContent =
    '.lvgp-back{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:9999;padding:1rem;' +
      'background:radial-gradient(circle at 50% 30%,rgba(40,60,140,.55),rgba(4,8,26,.88));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '.lvgp-back.on{display:flex;animation:lvgpFade .25s ease}' +
    '.lvgp-box{--c:#ffc857;position:relative;overflow:hidden;width:100%;max-width:34rem;color:#eef1ff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;' +
      'background:linear-gradient(160deg,#18245a 0%,#0e1738 70%);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:1.8rem 1.5rem 1.4rem;' +
      'box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset;animation:lvgpPop .4s cubic-bezier(.2,1.2,.4,1)}' +
    '.lvgp-box:before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--c),#ff8a5b)}' +
    '.lvgp-box:after{content:"";position:absolute;width:16rem;height:16rem;right:-6rem;top:-8rem;border-radius:50%;background:var(--c);opacity:.14;filter:blur(30px);pointer-events:none}' +
    '.lvgp-x{position:absolute;right:.9rem;top:.9rem;width:2.2rem;height:2.2rem;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:1.2rem;line-height:1;cursor:pointer;transition:background .2s,transform .2s}' +
    '.lvgp-x:hover{background:rgba(255,255,255,.18);transform:rotate(90deg)}' +
    '.lvgp-chip{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;font-size:.85rem;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:.2rem .8rem;background:rgba(255,255,255,.05)}' +
    '.lvgp-box h2{margin:.7rem 0 .25rem;font-size:1.75rem;line-height:1.15}' +
    '.lvgp-box h2 span{background:linear-gradient(90deg,var(--c),#ff8a5b);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.lvgp-box p{margin:0 0 1.3rem;color:#aab5dc}' +
    '.lvgp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}' +
    '.lvgp-card{position:relative;font:inherit;color:#fff;cursor:pointer;text-align:center;padding:1.1rem .4rem 1rem;border-radius:18px;border:1.5px solid rgba(255,255,255,.16);' +
      'background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03));opacity:0;animation:lvgpUp .45s ease forwards;transition:transform .2s,border-color .2s,box-shadow .2s,background .2s}' +
    '.lvgp-card:nth-child(1){animation-delay:.12s}.lvgp-card:nth-child(2){animation-delay:.22s}.lvgp-card:nth-child(3){animation-delay:.32s}' +
    '.lvgp-ic{display:block;font-size:1.6rem;margin-bottom:.1rem;transition:transform .25s}' +
    '.lvgp-lab{display:block;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:#aab5dc}' +
    '.lvgp-num{display:block;font-size:2.6rem;font-weight:800;line-height:1.05;color:var(--c)}' +
    '.lvgp-tag{display:block;font-size:.85rem;margin-top:.3rem;color:#d8def5}' +
    '.lvgp-go{display:block;margin-top:.5rem;font-size:.8rem;font-weight:700;color:#ff8a5b;opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s}' +
    '.lvgp-card:hover,.lvgp-card:focus-visible{outline:none;transform:translateY(-6px) scale(1.03);border-color:var(--c);background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));box-shadow:0 14px 34px rgba(0,0,0,.4),0 0 24px -4px var(--c)}' +
    '.lvgp-card:hover .lvgp-ic,.lvgp-card:focus-visible .lvgp-ic{transform:scale(1.25) rotate(-6deg)}' +
    '.lvgp-card:hover .lvgp-go,.lvgp-card:focus-visible .lvgp-go{opacity:1;transform:none}' +
    '.lvgp-foot{margin-top:1.2rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;font-size:.85rem;color:#8f9bc4}' +
    '.lvgp-cancel{background:none;border:0;color:#aab5dc;font:inherit;cursor:pointer;text-decoration:underline}' +
    '@keyframes lvgpFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes lvgpPop{from{opacity:0;transform:translateY(24px) scale(.92)}to{opacity:1;transform:none}}' +
    '@keyframes lvgpUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
    '@media(max-width:30rem){.lvgp-grid{grid-template-columns:1fr}.lvgp-card{display:flex;align-items:center;justify-content:space-between;gap:.6rem;text-align:left;padding:.8rem 1rem}.lvgp-num{font-size:2rem}.lvgp-go{display:none}}' +
    '@media(prefers-reduced-motion:reduce){.lvgp-back.on,.lvgp-box,.lvgp-card{animation:none;opacity:1}.lvgp-card,.lvgp-ic,.lvgp-x{transition:none}}';
  document.head.appendChild(css);

  var back = document.createElement('div');
  back.className = 'lvgp-back';
  back.innerHTML =
    '<div class="lvgp-box" role="dialog" aria-modal="true" aria-labelledby="lvgp-t">' +
      '<button type="button" class="lvgp-x" aria-label="Close" data-en-aria-label="Close" data-am-aria-label="ዝጋ">&times;</button>' +
      '<span class="lvgp-chip" id="lvgp-chip"></span>' +
      '<h2 id="lvgp-t"><span data-en="Which grade are you in?" data-am="በስንተኛ ክፍል ነዎት?">Which grade are you in?</span></h2>' +
      '<p id="lvgp-p"></p>' +
      '<div class="lvgp-grid">' +
      GRADES.map(function (x) {
        return '<button type="button" class="lvgp-card" data-g="' + x.g + '">' +
          '<span class="lvgp-ic">' + x.icon + '</span>' +
          '<span><span class="lvgp-lab" data-en="Grade" data-am="ክፍል">Grade</span><span class="lvgp-num">' + x.g + '</span></span>' +
          '<span><span class="lvgp-tag" data-en="' + x.tag + '" data-am="' + x.am + '">' + x.tag + '</span><span class="lvgp-go" data-en="Open my path →" data-am="የእኔን መንገድ ክፈት →">Open my path &rarr;</span></span></button>';
      }).join('') +
      '</div>' +
      '<div class="lvgp-foot"><span data-en="You can change your grade any time." data-am="ክፍልዎን በማንኛውም ጊዜ መቀየር ይችላሉ።">You can change your grade any time.</span><button type="button" class="lvgp-cancel" data-en="Cancel" data-am="ይቅር">Cancel</button></div>' +
    '</div>';
  document.body.appendChild(back);

  var box = back.querySelector('.lvgp-box'), level = null, opener = null, target = null;

  function open(key, from) {
    var L = LEVELS[key]; level = key; opener = from;
    var link = from && from.querySelector ? from.querySelector('a[href^="level.html?level="]') : null;
    if (from && from.matches && from.matches('a[href^="level.html?level="]')) link = from;
    var chip = document.querySelector('#subj [aria-pressed="true"]');
    target = link ? link.getAttribute('href')
      : 'level.html?level=' + key + (chip ? '&subject=' + encodeURIComponent(chip.dataset.s) : '');
    box.style.setProperty('--c', L.color);
    var labels = {
      foundation: 'ጠንካራ መሠረት ይገንቡ፦ በአንድ ጊዜ አንድ ትንሽ እርምጃ።',
      growth: 'የሚያውቁትን ያጠናክሩና ወደ ላይ ይቀጥሉ።',
      excellence: 'ራስዎን ይፈትኑና ከፍተኛ ውጤት ዓላማ ያድርጉ።'
    };
    document.getElementById('lvgp-chip').innerHTML = '<span data-en="' + L.icon + ' ' + L.name + ' path" data-am="' + L.icon + ' ' + ({foundation:'መሠረት',growth:'ዕድገት',excellence:'ልህቀት'}[key]) + ' መንገድ">' + L.icon + ' ' + L.name + ' path</span>';
    document.getElementById('lvgp-p').innerHTML = '<span data-en="' + L.line + ' Pick your grade to open your path." data-am="' + labels[key] + ' መንገድዎን ለመክፈት ክፍልዎን ይምረጡ።">' + L.line + ' Pick your grade to open your path.</span>';
    back.classList.add('on');
    back.querySelector('[data-g]').focus();
  }
  function close() { back.classList.remove('on'); if (opener && opener.focus) try { opener.focus(); } catch (e) {} }

  back.addEventListener('click', function (e) {
    if (e.target === back || e.target.closest('.lvgp-cancel') || e.target.closest('.lvgp-x')) return close();
    var b = e.target.closest('[data-g]');
    if (b) location.href = target + '&grade=' + b.dataset.g;
  });
  document.addEventListener('keydown', function (e) {
    if (!back.classList.contains('on')) return;
    if (e.key === 'Escape') return close();
    if (e.key === 'Tab') {                 // keep keyboard focus inside the window
      var f = back.querySelectorAll('button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* which level names does this element mention? */
  function names(el) {
    var t = el.textContent || '';
    return Object.keys(LEVELS).filter(function (k) { return new RegExp('\\b' + LEVELS[k].name + '\\b', 'i').test(t); });
  }

  document.addEventListener('click', function (e) {
    if (back.contains(e.target)) return;
    var scope = document.getElementById('hub') || document.querySelector('main');
    if (!scope || !scope.contains(e.target)) return;
    var el = e.target, key = null, card = null;
    while (el && el !== scope) {
      var n = names(el);
      if (n.length === 1) { key = n[0]; card = el; }
      else if (n.length > 1) break;
      el = el.parentElement;
    }
    if (!key) return;
    e.preventDefault(); e.stopPropagation();
    open(key, card);
  }, true);
})();
