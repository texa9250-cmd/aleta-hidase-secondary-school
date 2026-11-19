
/* Shared top menu: the same bar as the home page, for every page.
   Use: <script src="/site-nav.js"></script>
   then mountSiteNav('#slot', {
     active: 'achievements',
     sub: [[href, label, key]],
     subActive: 'key'
   })
*/
(function () {
  var LINKS = [
    ['/index.html', 'Home', 'home', 'መነሻ'],
    ['/announcements.html', 'Announcement', 'announcements', 'ማስታወቂያ'],
    ['/achievement.html', 'Achievements', 'achievements', 'ስኬቶች'],
    ['/history.html', 'About', 'about', 'ስለ ትምህርት ቤቱ'],
    ['/contact.html', 'Contact', 'contact', 'ያግኙን']
  ];

  var SUB_AM = {
    '← All achievements': '← ሁሉም ስኬቶች',
    'Home': 'መነሻ',
    'Question sources': 'የጥያቄ ምንጮች',
    'Exam news': 'የፈተና ዜና',
    'Topics to pages': 'ርዕሶችና የመጽሐፍ ገጾች',
    'Short notes': 'አጭር ማስታወሻዎች',
    'Student stories': 'የተማሪዎች ታሪኮች',
    'Student levels': 'የተማሪ ደረጃዎች',
    'Discussion board': 'የውይይት መድረክ'
  };

  var CSS = `
  .sn-top{position:sticky;top:0;z-index:100;background:#0f172a;border-bottom:1px solid burlywood;font-family:Arial,"Noto Sans Ethiopic",sans-serif;line-height:1.7;text-align:left}
  .sn-top *{box-sizing:border-box;margin:0;padding:0}
  .sn-nav{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem 2rem;min-height:72px;padding:1rem 5%;background:rgba(255,255,255,.05)}
  .sn-logo{display:flex;font-size:1.8rem;font-weight:700;color:coral;letter-spacing:1px;margin-right:auto;text-decoration:none;white-space:nowrap}
  .sn-logo span{color:darkgrey}
  .sn-links{list-style:none;display:flex;gap:5rem;margin-right:min(200px,8vw);padding-left:7rem;justify-content:space-between}
  .sn-links a{font-size:1.05rem;font-weight:500;text-decoration:none;color:#e2e8f0;transition:.3s;border-bottom:3px solid transparent;padding-bottom:2px}
  .sn-links a:hover{color:#38bdf8;text-shadow:0 0 10px #38bdf8}
  .sn-links a[aria-current="page"]{border-bottom-color:#ff7a3d;color:#fff}
  .sn-actions{display:flex;align-items:center;gap:.5rem}
  .sn-icon{border:1px solid #64748b;background:transparent;color:#fff;border-radius:8px;padding:.6rem .75rem;min-width:42px;min-height:42px;font-size:1.1rem;cursor:pointer}
  @media(max-width:1200px){.sn-nav{padding:.7rem 4%;min-height:0;gap:.5rem 1rem}.sn-logo{order:1;font-size:1.5rem}.sn-actions{order:2}
    .sn-links{order:3;flex:1 1 100%;margin:0;padding:0;gap:.5rem;justify-content:space-between;overflow-x:auto}.sn-links a{font-size:.95rem;white-space:nowrap}}
  @media(max-width:600px){.sn-nav{padding:.6rem 3%}.sn-logo{font-size:1.25rem}.sn-links a{font-size:.8rem}.sn-icon{min-width:38px;min-height:38px;padding:.4rem .6rem}}
  @media(max-width:380px){.sn-links a{font-size:.72rem}.sn-logo{font-size:1.1rem}}
  .sn-back-row{background:#f8fafc;border-bottom:1px solid #e2e8f0;font-family:Arial,"Noto Sans Ethiopic",sans-serif}
  .sn-back-in{width:min(1120px,100% - 32px);margin:0 auto;padding:13px 0 15px}
  .sn-back-link{display:inline-flex;align-items:center;gap:8px;padding:3px 0;color:#0f172a;text-decoration:none;font-size:.92rem;font-weight:700;transition:color .2s ease}
  .sn-back-link:hover{color:#ff7a3d;text-decoration:underline;text-decoration-color:#ff7a3d;text-decoration-thickness:2px;text-underline-offset:4px}
  .sn-sub{background:#fff;border-bottom:1px solid #d9e1ef;font-family:Arial,"Noto Sans Ethiopic",sans-serif}
  .sn-sub-in{width:min(1120px,100% - 32px);margin:0 auto;display:flex;gap:6px 22px;flex-wrap:wrap;padding:6px 0}
  .sn-sub a{color:#101733;text-decoration:none;font-weight:600;font-size:.92rem;padding:8px 0;border-bottom:3px solid transparent}
  .sn-sub a:hover{color:#0b1f8a}
  .sn-sub a[aria-current="page"]{border-bottom-color:#ff7a3d;color:#0b1f8a}
  .sn-sub-sticky{position:sticky;top:0;z-index:110;box-shadow:0 3px 10px rgba(15,23,42,.08)}
  @media(max-width:600px){.sn-sub-in{flex-wrap:nowrap;overflow-x:auto}.sn-sub a{white-space:nowrap;font-size:.85rem}}`;

  window.mountSiteNav = function (slot, opts) {
    opts = opts || {};

    if (!document.getElementById('sn-style')) {
      var st = document.createElement('style');
      st.id = 'sn-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[c];
      });
    };

    var head = document.createElement('header');
    head.className = 'sn-top';

    head.innerHTML =
      '<nav class="sn-nav" aria-label="Main">' +
      '<a class="sn-logo" href="/index.html">' +
      '<span data-en="Aleta" data-am="አለታ">Aleta</span> ' +
      '<span data-en="-Hidase" data-am="-ህዳሴ">-Hidase</span>' +
      '</a>' +
      '<ul class="sn-links">' +
      LINKS.map(function (l) {
        return '<li><a href="' + l[0] +
          '" data-en="' + esc(l[1]) +
          '" data-am="' + esc(l[3]) + '"' +
          (l[2] === opts.active ? ' aria-current="page"' : '') +
          '>' + esc(l[1]) + '</a></li>';
      }).join('') +
      '</ul>' +
      '<div class="sn-actions">' +
      '<button id="theme-toggle" class="sn-icon" type="button">☾</button>' +
      '</div>' +
      '</nav>';

    var back = document.createElement('div');
    back.className = 'sn-back-row';

    back.innerHTML =
      '<div class="sn-back-in">' +
      '<a class="sn-back-link" href="/index.html" ' +
      'data-en="← Back to Home" ' +
      'data-am="← ወደ መነሻ ተመለስ">' +
      '← Back to Home</a></div>';

    var nodes = opts.main === false ? [] : [head, back];

    if (opts.sub && opts.sub.length) {

      // Hide these two links ONLY on the News page.
      var visibleSubLinks = opts.sub;

      if (document.body.dataset.page === 'news') {
        visibleSubLinks = opts.sub.filter(function (l) {
          var label = String(l[1] || '').trim().toLowerCase();

          return label !== 'discussion board' &&
                 label !== 'student levels';
        });
      }

      if (visibleSubLinks.length) {
        var sub = document.createElement('div');
        sub.className = opts.stickySub
          ? 'sn-sub sn-sub-sticky'
          : 'sn-sub';

        sub.innerHTML =
          '<div class="sn-sub-in">' +
          visibleSubLinks.map(function (l) {
            var en = l[1];
            var am = l[3] || SUB_AM[en] || en;

            return '<a href="' + esc(l[0]) +
              '" data-en="' + esc(en) +
              '" data-am="' + esc(am) + '"' +
              (l[2] === opts.subActive
                ? ' aria-current="page"'
                : '') +
              '>' + esc(en) + '</a>';
          }).join('') +
          '</div>';

        nodes.push(sub);
      }
    }

    if (opts.main === false && opts.back !== false) {
      nodes.push(back);
    }

    var target = typeof slot === 'string'
      ? document.querySelector(slot)
      : slot;

    if (target && target.replaceWith) {
      target.replaceWith.apply(target, nodes);
    } else {
      nodes.slice().reverse().forEach(function (n) {
        document.body.insertBefore(n, document.body.firstChild);
      });
    }
  };
})();
