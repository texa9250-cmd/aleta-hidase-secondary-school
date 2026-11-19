/* Grade 9 / 10 / 11 page. Needs js/data.js (NOTES, TOPICS) and the school server (question sources). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const bi = (en, am) => `<span data-en="${esc(en)}" data-am="${esc(am)}">${esc(en)}</span>`;
  const biField = (row, key) => bi(row[key] || '', row[key + 'Am'] || row['am' + key[0].toUpperCase() + key.slice(1)] || row[key + '_am'] || row[key] || '');
  const enc = encodeURIComponent;

  function getLang() { return localStorage.getItem('site_lang') === 'am' ? 'am' : 'en'; }
  function localizeSpans() {
    const lang = getLang();
    document.querySelectorAll('[data-en][data-am]').forEach(el => {
      const v = lang === 'am' ? el.dataset.am : el.dataset.en;
      if (v == null) return;
      if (el.children.length === 0) el.textContent = v;
      else el.setAttribute('aria-label', v);
    });
  }
  function applyLocaleAttributes() {
    const lang = getLang();
    document.querySelectorAll('[data-en-placeholder][data-am-placeholder]').forEach(el => { el.placeholder = el.dataset[lang + 'Placeholder']; });
    document.querySelectorAll('[data-en-aria-label][data-am-aria-label]').forEach(el => { el.setAttribute('aria-label', el.dataset[lang + 'AriaLabel']); });
    localizeSpans();
    if (typeof GRADE !== 'undefined' && GRADE) {
      document.title = lang === 'am' ? `${GRADE}ኛ ክፍል | አለታ ህዳሴ ዝግጅት` : `Grade ${GRADE} | አለታ ህዳሴ Prep`;
    }
  }
  document.addEventListener('DOMContentLoaded', applyLocaleAttributes);
  document.addEventListener('site-language-change', e => {
    const lang = e.detail && e.detail.language === 'am' ? 'am' : 'en';
    try { localStorage.setItem('site_lang', lang); localStorage.setItem('lv_lang', lang); } catch (x) {}
    applyLocaleAttributes();
  });

  const fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  const params = new URLSearchParams(location.search);
  const GRADE = ['9', '10', '11'].includes(params.get('grade')) ? params.get('grade') : null;
  if (!GRADE) { location.replace('/levels.html'); return; }

  const LEVELS = {
    foundation: {name: 'Foundation', am: 'መሠረት', msg: 'Build strong basics first: read the short notes, then try the easier practice.', msgAm: 'መጀመሪያ ጠንካራ መሠረት ይገንቡ፦ አጭር ማስታወሻዎቹን ያንብቡ፣ ከዚያ ቀላል ልምምዶችን ይሞክሩ።'},
    growth: {name: 'Growth', am: 'ዕድገት', msg: 'Strengthen what you know: mix notes with practice and past questions.', msgAm: 'የሚያውቁትን ያጠናክሩ፦ ማስታወሻዎችን ከልምምድና ካለፉ ፈተና ጥያቄዎች ጋር ያጣምሩ።'},
    excellence: {name: 'Excellence', am: 'ልህቀት', msg: 'Aim high: challenge yourself with harder questions and full exams.', msgAm: 'ከፍተኛ ዓላማ ይኑርዎት፦ ከባድ ጥያቄዎችንና ሙሉ ፈተናዎችን በመስራት ራስዎን ይፈትኑ።'}
  };
  const LEVEL = LEVELS[params.get('level')] ? params.get('level') : null;

  let STREAM = null;
  if (GRADE === '11') STREAM = params.get('stream') === 'social' ? 'social' : 'natural';

  const COMMON = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History', 'Civics', 'Economics'];
  const NAT = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Civics', 'Information Technology', 'Aptitude'];
  const SOC = ['Mathematics', 'English', 'Geography', 'History', 'Economics', 'Civics', 'Information Technology', 'Aptitude'];
  const SUBJ = {'9': COMMON, '10': COMMON, '11': STREAM === 'social' ? SOC : NAT};
  const subjects = SUBJ[GRADE];
  const AM = typeof SUBJECT_AM !== 'undefined' ? SUBJECT_AM : {};
  const qs = '?grade=' + GRADE + (LEVEL ? '&level=' + LEVEL : '') + (STREAM ? '&stream=' + STREAM : '');

  /* ---------- header & footer ---------- */
  const NAV = [['#subjects', 'Subjects'], ['#topics', 'Concept map'], ['#sources', 'Question sources'], ['#notes', 'Short notes'], ['visualizer.html' + qs, 'Visual lab'], ['/levels.html?grade=' + GRADE, 'Change grade']];
  const NAVAM = ['ትምህርት ዓይነቶች', 'የፅንሰ-ሃሳብ ካርታ', 'የጥያቄ ምንጮች', 'አጭር ማስታወሻዎች', 'የእይታ ላብ', 'ክፍል ቀይር'];
  $('#site-header').innerHTML = `
    <header class="top"><div class="wrap bar">
      <a class="brand" href="grade.html${qs}">አለታ ህዳሴ <span>Grade ${GRADE}</span></a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav" data-en="Menu" data-am="ማውጫ">Menu</button>
      <nav id="nav" aria-label="Main">
        ${NAV.map((n, i) => `<a href="${n[0]}">${bi(n[1], NAVAM[i])}</a>`).join('')}
      </nav></div></header>
      <div class="grade-back-row"><div class="grade-back-in"><a class="grade-back-link" href="/index.html" onclick="if (window.history.length > 1) { window.history.back(); return false; }" data-en="← Back" data-am="← ተመለስ">← Back</a></div></div>`;
  $('#site-footer').innerHTML = `<footer><div class="wrap"><span data-en="አለታ ህዳሴ Grade ${esc(GRADE)} study space. Study materials are linked from their original sources." data-am="አለታ ህዳሴ የ${esc(GRADE)}ኛ ክፍል የጥናት ቦታ። የጥናት ግብዓቶች ከዋና ምንጮቻቸው ጋር ተያይዘዋል።">አለታ ህዳሴ Grade ${esc(GRADE)} study space.</span> <a href="/index.html" data-en="Back to the school website" data-am="ወደ ትምህርት ቤቱ ድረ-ገጽ ተመለስ">Back to the school website</a></div></footer>`;
  const btn = $('.menu-btn'), nav = $('#nav');
  btn.addEventListener('click', () => btn.setAttribute('aria-expanded', nav.classList.toggle('open')));

  $('#gh').innerHTML = `<span data-en="Grade ${GRADE} study space" data-am="${GRADE}ኛ ክፍል የጥናት ቦታ">Grade ${GRADE} study space</span>`;
  $('#labdoor').href = 'visualizer.html' + qs;
  if (LEVEL) {
    $('#lvl').hidden = false;
    $('#lvl').innerHTML = `<span data-en="${esc(LEVELS[LEVEL].name)} path" data-am="${esc(LEVELS[LEVEL].am)} መንገድ">${esc(LEVELS[LEVEL].name)} path</span>`;
    $('#lvlmsg').innerHTML = `<span data-en="${esc(LEVELS[LEVEL].msg)}" data-am="${esc(LEVELS[LEVEL].msgAm)}">${esc(LEVELS[LEVEL].msg)}</span>`;
  }
  let switchHtml = ['9', '10', '11'].map(g =>
    `<a href="grade.html?grade=${g}${LEVEL ? '&level=' + LEVEL : ''}${params.get('subject') ? '&subject=' + enc(params.get('subject')) : ''}" ${g === GRADE ? 'aria-current="page"' : ''}>${bi('Grade ' + g, g + 'ኛ ክፍል')}</a>`).join('');
  if (GRADE === '11') {
    switchHtml += `<a href="grade.html?grade=11&stream=natural${LEVEL ? '&level=' + LEVEL : ''}" ${STREAM === 'natural' ? 'aria-current="page"' : ''}>${bi('Natural', 'ተፈጥሮ')}</a>`;
    switchHtml += `<a href="grade.html?grade=11&stream=social${LEVEL ? '&level=' + LEVEL : ''}" ${STREAM === 'social' ? 'aria-current="page"' : ''}>${bi('Social', 'ማህበራዊ')}</a>`;
  }
  switchHtml += `<a href="/levels.html?grade=${GRADE}" data-en="Change level" data-am="ደረጃ ቀይር">Change level</a>`;
  $('#gswitch').innerHTML = switchHtml;

  /* ---------- notes ---------- */
  const TAG = /\s*\(G(\d+)(?:\s*[\u2013\-]\s*(\d+))?\)\s*$/;
  function gradeRange(n) {
    const m = TAG.exec(n.title);
    if (!m) return [12, 12];
    const a = +m[1], b = m[2] ? +m[2] : a;
    return [a, b];
  }
  const notes = (typeof NOTES !== 'undefined' ? NOTES : []).map(n => {
    const [a, b] = gradeRange(n);
    return {subject: n.subject, points: n.points || [], pointsAm: n.pointsAm || n.amPoints || [], title: n.title.replace(TAG, ''),
      titleAm: (n.titleAm || n.amTitle || '').replace(TAG, ''), a, b};
  }).filter(n => +GRADE >= n.a && +GRADE <= n.b);

  /* ---------- question sources ---------- */
  async function getJSON(url) {
    try { const r = await fetch(url); if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null; return await r.json(); }
    catch (e) { return null; }
  }
  let sources = [], notePdfs = [], serverOk = true;
  const srcCard = r => {
    const url = r.file_url || r.url, isFile = !!r.file_url;
    const uploadedText = r.type === 'Notes' ? String(r.note_text || '').trim() : '';
    return `<article class="card">
      <div class="meta"><span class="tag">${esc(r.subject)} ${AM[r.subject] ? `<small>${esc(AM[r.subject])}</small>` : ''}</span><span class="tag hot" data-en="${esc(r.type)}" data-am="${esc(r.typeAm || r.amType || r.type)}">${esc(r.type)}</span>${r.year ? `<span class="tag date">${esc(r.year)}</span>` : ''}</div>
      <h3>${biField(r, 'title')}</h3>${r.description ? `<p>${biField(r, 'description')}</p>` : ''}
      ${uploadedText ? `<div class="uploaded-note-text" style="white-space:pre-wrap;overflow-wrap:anywhere;margin:.75rem 0;line-height:1.7">${esc(uploadedText)}</div>` : ''}
      ${url ? (isFile
        ? `<div class="res-actions"><a class="btn alt" href="${esc(url)}?download=1" download>${bi('Download', 'አውርድ')}${r.file_size ? ' (' + fmtSize(r.file_size) + ')' : ''}</a></div>`
        : `<div class="res-actions"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-en="Open source" data-am="ምንጩን ክፈት">Open source</a><span class="host">${esc(hostOf(url))}</span></div>`)
        : uploadedText ? '' : `<span class="pending" data-en="Link not added yet" data-am="አገናኝ ገና አልተጨመረም">Link not added yet</span>`}
    </article>`;
  };
  const noteCard = n => `
    <article class="card"><div class="meta"><span class="tag">${esc(n.subject)}</span><span class="tag date">Grade ${n.a === n.b ? n.a : n.a + '\u2013' + n.b}</span></div>
      <h3>${biField(n, 'title')}</h3><ul>${n.points.map((p, i) => `<li>${bi(p, (n.pointsAm || [])[i] || p)}</li>`).join('')}</ul></article>`;

  /* ---------- TOPICS: concept progressions ---------- */
  const SOCIAL_SET = new Set(['Geography', 'History', 'Economics', 'Civics', 'Social Studies', 'Citizenship']);
  const streamFor = s => SOCIAL_SET.has(s) ? 'social' : 'natural';
  const TOPIC_LIST = (typeof TOPICS !== 'undefined' && Array.isArray(TOPICS)) ? TOPICS : [];  // works whether data.js uses var or const

  function ensureConceptStyles() {
    if (document.getElementById('concept-styles')) return;
    const s = document.createElement('style');
    s.id = 'concept-styles';
    s.textContent = `
      .concept .path{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin:.7rem 0 0;padding:0;list-style:none}
      .concept .path li{position:relative;background:#f8fafc;border:1px solid #d9e1ef;border-radius:12px;padding:.55rem .6rem}
      .concept .path li::after{content:'→';position:absolute;right:-14px;top:50%;transform:translateY(-50%);color:#55607f;font-weight:700}
      .concept .path li:last-child::after{display:none}
      .concept .path li.current{border-color:#ff7a3d;box-shadow:0 0 0 2px rgba(255,122,61,.25);background:#fff7ed}
      .concept .path li a{color:#101733;text-decoration:none;display:block}
      .concept .path .g-tag{display:inline-block;font-size:.72rem;font-weight:800;padding:.05rem .45rem;border-radius:999px;background:#0b1f8a;color:#fff;margin-bottom:.3rem}
      .concept .path li.current .g-tag{background:#ff7a3d}
      .concept .path strong{display:block;font-size:.85rem;margin:.15rem 0 .2rem}
      .concept .path small{display:block;color:#55607f;font-size:.76rem}
      .concept .path small.adds{color:#0e8c78;margin-top:.3rem}
      @media(max-width:720px){.concept .path{grid-template-columns:1fr 1fr}.concept .path li::after{display:none}}
    `;
    document.head.appendChild(s);
  }

  let topicsHost = null;
  if (TOPIC_LIST.length) {
    ensureConceptStyles();
    topicsHost = document.createElement('section');
    topicsHost.className = 'block'; topicsHost.id = 'topics'; topicsHost.style.paddingTop = '0';
    topicsHost.innerHTML = `<div class="wrap">
      <div class="sec-head"><h2 data-en="Concept map (Grade 9 → 12)" data-am="የፅንሰ-ሃሳብ ካርታ (9ኛ → 12ኛ)">Concept map (Grade 9 → 12)</h2><p class="count" id="tcount"></p></div>
      <p class="lead" data-en="See how one idea grows from Grade 9 to Grade 12 — where it starts, how each grade extends it, and where to find it in your textbook. Click any grade to jump to that class." data-am="አንድ ሃሳብ ከ9ኛ እስከ 12ኛ ክፍል እንዴት እንደሚያድግ ይመልከቱ — የሚጀምርበት፣ እያንዳንዱ ክፍል የሚያራዝመው፣ እና በመጽሐፍዎ የሚገኝበት ገጽ። ወደዚያ ክፍል ለመሄድ ማንኛውንም ክፍል ይጫኑ።">See how one idea grows from Grade 9 to Grade 12. Click any grade to jump to that class.</p>
      <div id="tlist" class="grid"></div>
      <div id="tempty" class="empty" hidden></div>
    </div>`;
    const srcSection = $('#sources');
    if (srcSection && srcSection.parentNode) srcSection.parentNode.insertBefore(topicsHost, srcSection);
    else document.querySelector('main').appendChild(topicsHost);
  }

  const topicCard = c => {
    const prog = (c.progression || []).slice().sort((a, b) => +a.grade - +b.grade);
    const cells = prog.map(p => {
      const isCur = String(p.grade) === GRADE;
      const stream = +p.grade === 11 ? '&stream=' + streamFor(c.subject) : '';
      const href = `grade.html?grade=${p.grade}${stream}&subject=${enc(c.subject)}`;
      return `<li class="${isCur ? 'current' : ''}">
        <a href="${href}">
          <span class="g-tag">G${esc(p.grade)}</span>
          <strong>${bi(p.unit || '', p.unitAm || p.unit || '')}</strong>
          ${p.page ? `<small>p. ${esc(p.page)}</small>` : ''}
          ${p.adds ? `<small class="adds">${bi(p.adds, p.addsAm || p.adds)}</small>` : ''}
        </a>
      </li>`;
    }).join('');
    return `<article class="card concept">
      <div class="meta"><span class="tag">${esc(c.subject)} ${AM[c.subject] ? `<small>${esc(AM[c.subject])}</small>` : ''}</span><span class="tag hot" data-en="Concept map" data-am="የፅንሰ-ሃሳብ ካርታ">Concept map</span></div>
      <h3>${bi(c.topic, c.topicAm || c.topic)}</h3>
      <ol class="path">${cells}</ol>
    </article>`;
  };

  /* ---------- filtering ---------- */
  let subject = subjects.includes(params.get('subject')) ? params.get('subject') : 'All', term = '';
  const chips = $('#chips');
  chips.innerHTML = ['All', ...subjects].map(s => `<button class="chip" data-s="${esc(s)}">${bi(s, s === 'All' ? 'ሁሉም' : AM[s] || s)}</button>`).join('');

  function draw() {
    chips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === subject));
    const t = term.trim().toLowerCase();
    const okS = s => subject === 'All' || s === subject || s === 'All subjects';

    const src = sources.filter(r => okS(r.subject) && (!t || (r.title + ' ' + (r.description || '') + ' ' + r.type + ' ' + r.subject + ' ' + (r.year || '')).toLowerCase().includes(t)));
    const nts = notes.filter(n => okS(n.subject) && (!t || (n.title + ' ' + n.points.join(' ') + ' ' + n.subject).toLowerCase().includes(t)));
    const pdfs = notePdfs.filter(r => okS(r.subject) && (!t || (r.title + ' ' + (r.description || '') + ' ' + (r.note_text || '') + ' ' + r.subject).toLowerCase().includes(t)));

    $('#slist').innerHTML = src.map(srcCard).join('');
    $('#nlist').innerHTML = pdfs.map(srcCard).join('') + nts.map(noteCard).join('');
    $('#scount').innerHTML = bi(src.length + (src.length === 1 ? ' source' : ' sources'), src.length + ' የጥያቄ ምንጮች');
    const nTotal = nts.length + pdfs.length;
    $('#ncount').innerHTML = bi(nTotal + (nTotal === 1 ? ' note' : ' notes'), nTotal + ' ማስታወሻዎች');

    const se = $('#sempty'), ne = $('#nempty');
    se.hidden = src.length > 0; ne.hidden = nTotal > 0;
    const sourceEmpty = !serverOk ? ['Question sources could not be loaded. Please try again later.', 'የጥያቄ ምንጮች መጫን አልቻሉም። እባክዎ በኋላ እንደገና ይሞክሩ።']
      : sources.length ? ['Nothing matches. Try another subject or word.', 'ምንም ውጤት አልተገኘም። ሌላ ትምህርት ዓይነት ወይም ቃል ይሞክሩ።']
      : [`No question sources have been added for Grade ${GRADE} yet. Check back soon.`, `ለ${GRADE}ኛ ክፍል የጥያቄ ምንጮች ገና አልተጨመሩም። በቅርቡ እንደገና ይመልከቱ።`];
    const noteEmpty = (notes.length || notePdfs.length) ? ['Nothing matches. Try another subject or word.', 'ምንም ውጤት አልተገኘም። ሌላ ትምህርት ዓይነት ወይም ቃል ይሞክሩ።']
      : [`No notes have been added for Grade ${GRADE} yet.`, `ለ${GRADE}ኛ ክፍል ማስታወሻዎች ገና አልተጨመሩም።`];
    se.innerHTML = bi(sourceEmpty[0], sourceEmpty[1]);
    ne.innerHTML = bi(noteEmpty[0], noteEmpty[1]);

    if (topicsHost) {
      const cps = TOPIC_LIST.filter(c => {
        if (!okS(c.subject)) return false;
        if (!c.progression || !c.progression.length) return false;
        if (t) {
          const hay = (c.topic + ' ' + (c.topicAm || '') + ' ' + (c.keywords || []).join(' ') + ' ' +
            c.progression.map(p => (p.adds || '') + ' ' + (p.addsAm || '') + ' ' + (p.unit || '')).join(' ')).toLowerCase();
          if (!hay.includes(t)) return false;
        }
        return true;
      });
      $('#tlist').innerHTML = cps.map(topicCard).join('');
      $('#tcount').innerHTML = bi(cps.length + (cps.length === 1 ? ' concept' : ' concepts'), cps.length + ' ፅንሰ-ሃሳቦች');
      const te = $('#tempty');
      te.hidden = cps.length > 0;
      te.innerHTML = bi('Nothing matches. Try another subject or word.', 'ምንም ውጤት አልተገኘም። ሌላ ትምህርት ዓይነት ወይም ቃል ይሞክሩ።');
    }
    localizeSpans();
  }
  chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { subject = b.dataset.s; draw(); } });
  $('#q').addEventListener('input', e => { term = e.target.value; draw(); });

  function drawSubjects() {
    const count = (list, s) => list.filter(x => x.subject === s || x.subject === 'All subjects').length;
    $('#streams').innerHTML = `<div class="stream"><h3>${bi('Grade ' + GRADE, GRADE + 'ኛ ክፍል')} <span data-en="subjects" data-am="ትምህርት ዓይነቶች">subjects</span></h3><div class="subj-grid">` +
      subjects.map(s => {
        const ns = count(sources, s), nn = count(notes, s) + count(notePdfs, s);
        return `<div class="subj"><b>${esc(s)} <small>${esc(AM[s] || '')}</small></b>
          <span class="cnt">${bi(ns + (ns === 1 ? ' question source' : ' question sources') + ' · ' + nn + (nn === 1 ? ' note' : ' notes'), ns + ' የጥያቄ ምንጭ · ' + nn + ' ማስታወሻ')}</span>
          <div class="subj-links"><a class="primary" href="#sources" data-go="${esc(s)}" data-en="Question sources" data-am="የጥያቄ ምንጮች">Question sources</a><a href="#notes" data-go="${esc(s)}" data-en="Notes" data-am="ማስታወሻዎች">Notes</a></div></div>`;
      }).join('') + '</div></div>';
    localizeSpans();
  }
  $('#streams').addEventListener('click', e => {
    const a = e.target.closest('[data-go]'); if (!a) return;
    subject = a.dataset.go; draw();
    const target = document.querySelector(a.getAttribute('href'));
    if (target && target.scrollIntoView) target.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  draw(); drawSubjects();
  getJSON('/api/grade/resources?grade=' + GRADE).then(rows => {
    if (rows) { sources = rows.filter(r => r.type !== 'Notes'); notePdfs = rows.filter(r => r.type === 'Notes'); } else serverOk = false;
    drawSubjects(); draw();
  });

  $('#tutor-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('#tutor-question'), button = e.currentTarget.querySelector('button[type="submit"]');
    const status = $('#tutor-status'), responseBox = $('#tutor-response');
    const responseTitle = $('#tutor-response-title'), answer = $('#tutor-answer');
    const am = getLang() === 'am';
    const question = input.value.trim();
    if (!question) return;

    button.disabled = true;
    status.textContent = am ? 'መልስ በመፈለግ ላይ…' : 'Getting an answer…';
    responseBox.hidden = true;
    responseBox.classList.remove('error');
    responseTitle.textContent = '';
    answer.textContent = '';
    const showError = (message, title) => {
      status.textContent = '';
      responseTitle.textContent = title || (am ? 'መልስ ማግኘት አልተቻለም' : 'Could not get an answer');
      answer.textContent = message;
      responseBox.classList.add('error');
      responseBox.hidden = false;
    };
    try {
      const selectedSubject = subject === 'All' ? '' : subject;
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({question, grade: GRADE, subject: selectedSubject, level: LEVEL || '', language: am ? 'am' : 'en'})
      });
      const data = await response.json();
      if (!response.ok) {
        const title = response.status === 503 ? (am ? 'የAI አጋዡን ማዋቀር ያስፈልጋል' : 'AI helper setup required') : null;
        showError(am ? data.errorAm || data.error || 'መልስ ማግኘት አልተቻለም።' : data.error || 'Could not get an answer.', title);
        return;
      }
      answer.textContent = data.answer;
      status.textContent = '';
      responseTitle.textContent = am ? 'AI መልስ፦ ከመጽሐፍዎ ጋር ያረጋግጡ' : 'AI answer — check it against your learning materials';
      responseBox.hidden = false;
    } catch (error) {
      showError(am ? 'ሰርቨሩን ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Could not reach the server. Please try again.');
    } finally {
      button.disabled = false;
    }
  });
})();