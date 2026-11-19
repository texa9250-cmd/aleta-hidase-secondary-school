/* =========================================================
   Teacher answer styling — injected automatically
   ========================================================= */
(function injectTeacherAnswerStyles() {
  if (document.getElementById('lv-teacher-answer-styles')) return;
  const style = document.createElement('style');
  style.id = 'lv-teacher-answer-styles';
  style.textContent = `
    /* Professional teacher answer card */
    .lv-ans.teacher {
      position: relative;
      border: 1px solid #c7d2fe !important;
      border-left: 4px solid #0b1f8a !important;
      background: linear-gradient(180deg, #f8faff 0%, #ffffff 48%) !important;
      padding: 16px 18px 14px !important;
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(11, 31, 138, 0.06);
      margin: 16px 0 !important;
    }
    .lv-ans.teacher::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: 12px 12px 0 0;
      background: linear-gradient(90deg, #0b1f8a, #3b5bdb);
    }
    .lv-ans.teacher .lv-meta {
      gap: 10px;
      margin-bottom: 2px;
    }
    .lv-ans.teacher .lv-text {
      color: #101733;
      font-size: 0.98rem;
      line-height: 1.7;
      margin: 10px 0 8px;
    }
    /* Refined Teacher badge */
    .lv-tag.t {
      display: inline-flex !important;
      align-items: center;
      gap: 4px;
      background: #0b1f8a !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      font-size: 10.5px !important;
      padding: 4px 11px !important;
      border-radius: 6px !important;
      box-shadow: 0 1px 2px rgba(11, 31, 138, 0.2);
    }
    /* Verified badge */
    .lv-tag.s {
      background: #0f766e !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      font-size: 10.5px !important;
      padding: 4px 11px !important;
      border-radius: 6px !important;
    }
    /* Verified student answers keep a soft green look */
    .lv-ans.verified:not(.teacher) {
      background: #f0fdf4 !important;
      border-left-color: #0f766e !important;
    }
  `;
  document.head.appendChild(style);
})();
/* Student Levels: hub, level pages and discussion board. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi = (en, am) => `<span data-en="${esc(en)}" data-am="${esc(am)}">${esc(en)}</span>`;
const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const params = new URLSearchParams(location.search);
const fmt = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
const myLevels = () => LS.get('lv_levels', {});
const setLevel = (subject, level) => { const m = myLevels(); m[subject] = level; LS.set('lv_levels', m); };
const levelTag = k => LEVELS[k] ? `<span class="lv-tag" style="background:${LEVELS[k].color}22;color:${LEVELS[k].color}">${LEVELS[k].icon} ${esc(LEVELS[k].name)}</span>` : '';

/* ---------- shared header / footer ---------- */
function layout(active) {
  // Discuss page uses site-nav.js (same bar as home). Only fill footer here.
  if (active === 'discuss') {
    const foot = $('#lv-footer');
    if (foot) foot.innerHTML = `<div class="lv-wrap">አለታ ህዳሴ School. Learn at your own pace; every path leads forward.</div>`;
    return;
  }
  const nav = [['index.html','Home'],['announcements.html','Announcement'],['achievement.html','Achievements'],
               ['history.html','About'],['contact.html','Contact'],['levels.html','Student levels','levels'],['discuss.html','Discussion','discuss']];
  const header = $('#lv-header');
  if (header) {
    header.innerHTML = `<div class="lv-wrap lv-bar">
      <a class="lv-logo" href="index.html">አለታ <span>-ህዳሴ</span></a>
      <button class="lv-menu" aria-expanded="false" aria-controls="lv-nav" data-en="Menu" data-am="ማውጫ">Menu</button>
      <nav id="lv-nav" aria-label="Main">${nav.map((n, i) => `<a href="${n[0]}" ${n[2] === active ? 'aria-current="page"' : ''}>${bi(n[1], ['መነሻ','ማስታወቂያ','ስኬቶች','ስለ ትምህርት ቤቱ','አግኙን','የተማሪዎች ደረጃዎች','ውይይት'][i])}</a>`).join('')}</nav>
      <button id="theme-toggle" class="lv-icon" type="button">☾</button></div>`;
    header.insertAdjacentHTML('afterend', `<div class="lv-back-row"><div class="lv-back-in"><a class="lv-back-link" href="index.html" data-en="← Back to Home" data-am="← ወደ መነሻ ተመለስ">← Back to Home</a></div></div>`);
    const b = $('.lv-menu'), n = $('#lv-nav');
    if (b && n) b.addEventListener('click', () => b.setAttribute('aria-expanded', n.classList.toggle('open')));
  }
  const foot = $('#lv-footer');
  if (foot) foot.innerHTML = `<div class="lv-wrap" data-en="አለታ ህዳሴ School. Learn at your own pace; every path leads forward." data-am="አለታ ህዳሴ ትምህርት ቤት። በራስዎ ፍጥነት ይማሩ፤ እያንዳንዱ መንገድ ወደፊት ይመራል።">አለታ ህዳሴ School. Learn at your own pace; every path leads forward.</div>`;
}

const subjectChips = (current, hrefFn) => `<div class="lv-chips" role="group" aria-label="Subject">` +
  SUBJECTS.map(s => `<a class="lv-chip" href="${hrefFn(s)}" aria-pressed="${s === current}">${esc(s)}</a>`).join('') + `</div>`;

/* ================= HUB: levels.html ================= */
function hubPage() {
  let subject = SUBJECTS.includes(params.get('subject')) ? params.get('subject') : SUBJECTS[0];
  const grade = ['9', '10', '11'].includes(params.get('grade')) ? params.get('grade') : null;
  const box = $('#hub');
  function draw() {
    if (!grade) {
      box.innerHTML = `
        <div class="lv-block">
          <h2 data-en="Choose your grade" data-am="ክፍልዎን ይምረጡ">Choose your grade</h2>
          <p class="lv-note" data-en="Select your grade to see the three learning paths available to you." data-am="ለእርስዎ የሚገኙትን ሦስት የመማር መንገዶች ለማየት ክፍልዎን ይምረጡ።">Select your grade to see the three learning paths available to you.</p>
          <div class="lv-grid">${['9', '10', '11'].map((g, i) => `<div class="lv-card" style="border-top:6px solid ${['#1f9d8a', '#ff7a3d', '#5b3fd1'][i]}">
            <h3 data-en="Grade ${g}" data-am="${g}ኛ ክፍል">Grade ${g}</h3>
            <p data-en="View the learning paths for Grade ${g}." data-am="የ${g}ኛ ክፍል የመማር መንገዶችን ይመልከቱ።">View the learning paths for Grade ${g}.</p>
            <div class="lv-actions"><a class="lv-btn small" href="levels.html?grade=${g}" data-en="Choose Grade ${g}" data-am="${g}ኛ ክፍልን ይምረጡ">Choose Grade ${g}</a></div>
          </div>`).join('')}</div>
        </div>`;
      return;
    }
    const mine = myLevels()[subject];
    box.innerHTML = `
      <div class="lv-actions" style="justify-content:space-between;align-items:center">
        <p class="lv-note" data-en="Learning paths for Grade ${grade}" data-am="የ${grade}ኛ ክፍል የመማር መንገዶች">Learning paths for Grade ${grade}</p>
        <a class="lv-btn ghost small" href="levels.html${params.get('subject') ? `?subject=${encodeURIComponent(subject)}` : ''}" data-en="Change grade" data-am="ክፍል ይቀይሩ">Change grade</a>
      </div>
      <p class="lv-note" data-en="Choose a subject. Each subject has its own path, so you can be on Excellence in one subject and Foundation in another." data-am="የትምህርት ዓይነት ይምረጡ። እያንዳንዱ የራሱ መንገድ አለው፤ በአንዱ የልህቀት ደረጃ ላይ ሆነው በሌላው የመሠረት ደረጃ ላይ ሊሆኑ ይችላሉ።">Choose a subject. Each subject has its own path, so you can be on Excellence in one subject and Foundation in another.</p>
      <div class="lv-chips" id="subj">${SUBJECTS.map(s => `<button class="lv-chip" data-s="${esc(s)}" aria-pressed="${s === subject}">${esc(s)}</button>`).join('')}</div>
      ${mine ? `<p class="lv-ok"><span data-en="Your current path in ${esc(subject)}:" data-am="የአሁኑ መንገድዎ በ${esc(subject)} ውስጥ፦">Your current path in ${esc(subject)}:</span> ${LEVELS[mine].icon} ${LEVELS[mine].name} (${LEVELS[mine].am})</p>` : ''}
      <div class="lv-block"><h2 data-en="Not sure where to start? Take the 1-minute self-check" data-am="ከየት እንደሚጀምሩ አልተረጋገጡም? የ1 ደቂቃ ራስ-ምዘናውን ይውሰዱ">Not sure where to start? Take the 1-minute self-check</h2>
        <form class="lv-form" id="check">
          ${CHECK.map((c, i) => `<fieldset style="border:0;padding:0;margin:0"><legend><b><span data-en="${esc(c.q)}" data-am="${esc(CHECK_AM[i].q)}">${i + 1}. ${esc(c.q)}</span></b></legend>
            ${c.o.map((o, j) => `<label class="inline"><input type="radio" name="q${i}" value="${j}" required> <span data-en="${esc(o)}" data-am="${esc(CHECK_AM[i].o[j])}">${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}
          <button class="lv-btn" type="submit" style="justify-self:start" data-en="Suggest my path" data-am="መንገዴን ጠቁሙ">Suggest my path</button>
        </form><div id="result"></div></div>
      <div class="lv-block"><h2 data-en="Or choose a path yourself" data-am="ወይም መንገድዎን እራስዎ ይምረጡ">Or choose a path yourself</h2><div class="lv-grid">
        ${Object.entries(LEVELS).map(([k, L]) => `<div class="lv-card" style="border-top:6px solid ${L.color}">
          <h3>${L.icon} ${L.name} <span class="lv-note">${L.am}</span></h3><p>${bi(L.tag, L.tagAm || L.tag)}</p>
          <div class="lv-actions"><a class="lv-btn small" href="portal/grade.html?grade=${grade}&level=${k}&subject=${encodeURIComponent(subject)}" data-en="Open this path" data-am="ይህን መንገድ ይክፈቱ">Open this path</a></div></div>`).join('')}
      </div></div>
      <p class="lv-note" style="margin-top:24px" data-en="You can change your path at any time. Moving up is something to celebrate, and your choices are private to this device." data-am="መንገድዎን በማንኛውም ጊዜ መቀየር ይችላሉ። ወደ ከፍተኛ ደረጃ መሸጋገር የሚያከብሩት ነው፤ ምርጫዎችዎም በዚህ መሣሪያ ላይ ብቻ ይቀመጣሉ።">You can change your path at any time. Moving up is something to celebrate, and your choices are private to this device.</p>`;
    $('#subj').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { subject = b.dataset.s; draw(); } });
    $('#check').addEventListener('submit', e => {
      e.preventDefault();
      const score = CHECK.reduce((t, _, i) => t + Number(new FormData(e.target).get('q' + i)), 0);
      const k = score <= 3 ? 'foundation' : score <= 6 ? 'growth' : 'excellence', L = LEVELS[k];
      $('#result').innerHTML = `<div class="lv-card" style="margin-top:14px;border-left:6px solid ${L.color}">
        <h3><span data-en="A good starting point for ${esc(subject)}:" data-am="ለ${esc(subject)} ጥሩ መነሻ ነጥብ፦">${'A good starting point for ' + esc(subject) + ':'}</span> ${L.name} (${L.am})</h3>
        <p data-en="This is only a starting point. You know yourself best, and you can switch at any time." data-am="ይህ መነሻ ነጥብ ብቻ ነው። ራስዎን በተሻለ ሁኔታ ያውቃሉ፤ በማንኛውም ጊዜም መቀየር ይችላሉ።">This is only a starting point. You know yourself best, and you can switch at any time.</p>
        <div class="lv-actions"><a class="lv-btn small" id="useit" href="portal/grade.html?grade=${grade}&level=${k}&subject=${encodeURIComponent(subject)}" data-en="Start this path" data-am="ይህን መንገድ ይጀምሩ">Start this path</a></div></div>`;
      $('#useit').addEventListener('click', () => setLevel(subject, k));
    });
  }
  draw();
}

/* ================= LEVEL PAGE: level.html?level=growth&subject=Physics ================= */
const TXT = {
  am: {who:'ይህ መንገድ ለማን ነው?', plan:'የሳምንቱ እቅድ', tips:'የሚረዱ የጥናት ልምዶች', check:'የእድገት ማረጋገጫ ዝርዝር', help:'ልምምድና እገዛ', change:'መንገድዎን ይቀይሩ',
       notes:'አጫጭር ማስታወሻዎች', topics:'ርዕሶችና የመጽሐፍ ገጾች', sources:'የጥያቄ ምንጮች', ask:'በመድረኩ ይጠይቁ ወይም ይመልሱ', day:'ቀን',
       prog:(n, t) => `${n} ከ ${t} እርምጃዎች ተጠናቀዋል። ትንንሽ እርምጃዎችም ይቆጠራሉ።`, ready:'በጣም ጥሩ! ለመሸጋገር ዝግጁ ነዎት፦'},
  en: {who:'Who this path is for', plan:'Your week at a glance', tips:'Study habits that help', check:'Your progress checklist', help:'Practice and get help', change:'Change your path',
       notes:'Short notes', topics:'Topics and textbook pages', sources:'Question sources', ask:'Ask or answer on the board', day:'Day',
       prog:(n, t) => `${n} of ${t} steps done. Small steps count.`, ready:'Well done! You are ready to try'}
};
function levelPage() {
  const key = LEVELS[params.get('level')] ? params.get('level') : 'foundation', L = LEVELS[key];
  const subject = SUBJECTS.includes(params.get('subject')) ? params.get('subject') : SUBJECTS[0];
  const grade = ['9', '10', '11'].includes(params.get('grade')) ? params.get('grade') : null, gq = grade ? `&grade=${grade}` : '';
  document.documentElement.style.setProperty('--c', L.color);
  setLevel(subject, key);
  const ckKey = `lv_check_${key}_${subject}${grade ? '_g' + grade : ''}`, q = encodeURIComponent(subject), enc = x => encodeURIComponent(x);
  let lang = localStorage.getItem('site_lang') === 'am' ? 'am' : 'en';

  function render() {
    const X = TXT[lang], am = lang === 'am', done = LS.get(ckKey, []);
    document.title = am ? `${L.am} | ${subject}${grade ? ' | ' + grade + 'ኛ ክፍል' : ''} | አለታ ህዳሴ` : `${L.name} | ${subject}${grade ? ' | Grade ' + grade : ''} | አለታ ህዳሴ`;
    document.documentElement.lang = am ? 'am' : 'en';
    const plan = L.plan.map((p, i) => [am ? `${X.day} ${i + 1}` : p[0], am ? L.planAm[i] : p[1]]);
    const tips = am ? L.tipsAm : L.tips, list = am ? L.checklistAm : L.checklist;
    $('#level').innerHTML = `
      <div class="lv-hero"><div class="lv-wrap"><p class="lv-note" style="color:#aab6e8">${esc(subject)}${grade ? ` · ${am ? grade + 'ኛ ክፍል' : 'Grade ' + grade}` : ''}</p>
        <h1>${L.icon} ${L.name} <span style="font-weight:400">· ${L.am}</span></h1><p>${esc(am ? L.tagAm : L.tag)}</p></div></div>
      <div class="lv-wrap">
        <div class="lv-chips" role="group" aria-label="Language" style="justify-content:flex-end;margin-bottom:0">
          <button class="lv-chip" data-lang="am" aria-pressed="${am}">አማርኛ</button><button class="lv-chip" data-lang="en" aria-pressed="${!am}">English</button></div>
        ${subjectChips(subject, s => `level.html?level=${key}&subject=${enc(s)}${gq}`)}
        <div class="lv-block"><div class="lv-card"><h3>${X.who}</h3><p>${esc(am ? L.forWhoAm : L.forWho)}</p></div></div>
        <div class="lv-block"><h2>${X.plan}</h2><ul class="lv-plan">${plan.map(p => `<li><b>${esc(p[0])}</b><span>${esc(p[1])}</span></li>`).join('')}</ul></div>
        <div class="lv-block"><h2>${X.tips}</h2><div class="lv-grid">${tips.map(t => `<div class="lv-card"><p>${esc(t)}</p></div>`).join('')}</div></div>
        <div class="lv-block"><h2>${X.check}</h2><ul class="lv-check" id="ck">
          ${list.map((c, i) => `<li><label><input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}> <span>${esc(c)}</span></label></li>`).join('')}</ul>
          <div class="lv-bar-track"><div class="lv-bar-fill" id="fill"></div></div><p id="msg" class="lv-note"></p></div>
        <div class="lv-block"><h2>${X.help}</h2><div class="lv-actions">
          ${grade ? `<a class="lv-btn" href="/portal/grade.html?grade=${grade}&level=${key}&subject=${q}#notes">${X.notes}: ${esc(subject)}</a>
          <a class="lv-btn" href="/portal/grade.html?grade=${grade}&level=${key}&subject=${q}#sources">${X.sources}</a>
          <a class="lv-btn" href="/portal/visualizer.html?grade=${grade}&level=${key}">${am ? 'የእይታ የጥናት ላብ' : 'Visual study lab'}</a>` : `
          <a class="lv-btn" href="/portal/notes.html?subject=${q}">${X.notes}: ${esc(subject)}</a>
          <a class="lv-btn" href="/portal/topics.html?subject=${q}">${X.topics}</a>
          <a class="lv-btn" href="/portal/resources.html?subject=${q}">${X.sources}</a>`}
          <a class="lv-btn ghost" href="discuss.html?subject=${q}&level=${key}">${X.ask}</a></div></div>
        ${grade ? `<div class="lv-block"><a class="lv-btn ghost small" href="levels.html?subject=${q}">${am ? 'ክፍል ይቀይሩ (አሁን ' + grade + 'ኛ ክፍል)' : 'Change grade (now Grade ' + grade + ')'}</a></div>` : ''}
        <div class="lv-block"><h2>${X.change}</h2><div class="lv-actions">
          ${Object.entries(LEVELS).filter(([k]) => k !== key).map(([k, x]) => `<a class="lv-btn ghost small" href="level.html?level=${k}&subject=${q}${gq}">${x.icon} ${x.name} · ${x.am}</a>`).join('')}</div></div>
      </div>`;
    document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
      const current = localStorage.getItem('site_lang') === 'am' ? 'am' : 'en';
      if (current !== b.dataset.lang && document.getElementById('lang-toggle')) {
        document.getElementById('lang-toggle').click();
        return;
      }
      lang = b.dataset.lang;
      try { localStorage.setItem('site_lang', lang); localStorage.setItem('lv_lang', lang); } catch (e) {}
      render();
    }));
    $('#ck').addEventListener('change', e => {
      const i = Number(e.target.dataset.i), s = new Set(LS.get(ckKey, []));
      e.target.checked ? s.add(i) : s.delete(i); LS.set(ckKey, [...s]); progress();
    });
    progress();
  }
  function progress() {
    const X = TXT[lang], n = LS.get(ckKey, []).length, total = L.checklist.length;
    $('#fill').style.width = (n / total * 100) + '%';
    if (n < total) { $('#msg').textContent = X.prog(n, total); $('#msg').className = 'lv-note'; return; }
    $('#msg').className = 'lv-ok';
    $('#msg').innerHTML = L.next
      ? `${X.ready} <a href="level.html?level=${L.next}&subject=${q}${gq}">${LEVELS[L.next].icon} ${LEVELS[L.next].name}</a>.`
      : esc(lang === 'am' ? L.finishAm : L.finish);
  }
  render();
  window.addEventListener('site-language-change', e => {
    lang = e.detail && e.detail.language === 'am' ? 'am' : 'en';
    try { localStorage.setItem('site_lang', lang); localStorage.setItem('lv_lang', lang); } catch (x) {}
    render();
  });
}

/* ================= DISCUSSION BOARD: discuss.html ================= */
const owned = () => LS.get('lv_owned', {});   // delete tokens for questions this browser posted
let mode = 'server';                       // switches to 'local' when the server routes are not installed
async function call(method, path, body, teacher) {
  if (mode === 'local') return localApi(method, path, body, teacher);
  let r;
  const mq = path.match(/^\/questions\/(\d+)$/), ownerTok = method === 'DELETE' && mq ? owned()[mq[1]] : '';
  try {
    r = await fetch('/api/discuss' + path, {method, headers: {'Content-Type':'application/json', ...(teacher ? {'x-teacher-code': teacher} : {}), ...(ownerTok ? {'x-owner-token': ownerTok} : {})},
      body: body ? JSON.stringify(body) : undefined});
  } catch (e) { mode = 'local'; return localApi(method, path, body, teacher); }
  const ct = r.headers.get('content-type') || '';
  if (r.status === 404 && !ct.includes('json')) { mode = 'local'; return localApi(method, path, body, teacher); }
  const data = ct.includes('json') ? await r.json() : {};
  if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
/* browser-only copy of the same routes: works before the server part is installed (posts stay on this device) */
function localApi(method, path, body, teacher) {
  const d = LS.get('lv_discuss', {next: 1, q: []}), save = () => LS.set('lv_discuss', d);
  const pub = q => ({id:q.id, title:q.title, body:q.body, subject:q.subject, level:q.level, author:q.anon ? 'Anonymous' : (q.name || 'Student'),
    createdAt:q.createdAt, answers:q.a.length, solved:q.a.some(a => a.verified)});
  let m;
  if (method === 'GET' && (m = path.match(/^\/questions(?:\?(.*))?$/))) {
    const p = new URLSearchParams(m[1] || '');
    return d.q.filter(q => (!p.get('subject') || q.subject === p.get('subject')) && (!p.get('level') || q.level === p.get('level'))).sort((a, b) => b.id - a.id).map(pub);
  }
  if (method === 'POST' && path === '/questions') {
    const q = {id: d.next++, title: body.title, body: body.body, subject: body.subject, level: body.level, name: body.name, anon: !!body.anon, createdAt: new Date().toISOString(), a: []};
    d.q.push(q); save(); return {id: q.id};
  }
  if (method === 'GET' && (m = path.match(/^\/questions\/(\d+)$/))) {
    const q = d.q.find(x => x.id == m[1]); if (!q) throw new Error('Question not found.');
    return {...pub(q), answerList: q.a.map(a => ({id:a.id, body:a.body, author: a.isTeacher ? (a.name || 'Teacher') : (a.name || 'Student'), isTeacher: !!a.isTeacher, verified: !!a.verified, votes:a.votes, createdAt:a.createdAt}))};
  }
  if (method === 'POST' && (m = path.match(/^\/questions\/(\d+)\/answers$/))) {
    const q = d.q.find(x => x.id == m[1]); if (!q) throw new Error('Question not found.');
    q.a.push({id: d.next++, body: body.body, name: body.name, isTeacher: !!teacher, verified: false, votes: 0, createdAt: new Date().toISOString()}); save(); return {ok:true};
  }
  if (method === 'DELETE' && (m = path.match(/^\/questions\/(\d+)$/))) { d.q = d.q.filter(x => x.id != m[1]); save(); return {ok:true}; }
  if (method === 'POST' && (m = path.match(/^\/answers\/(\d+)\/vote$/))) {
    d.q.forEach(q => q.a.forEach(a => { if (a.id == m[1]) a.votes++; })); save(); return {ok:true};
  }
  if (/\/report$/.test(path)) return {ok:true};
  throw new Error('This needs the school server. Ask your teacher to enable it.');
}

function discussPage() {
  const S = {
    subject: SUBJECTS.includes(params.get('subject')) ? params.get('subject') : 'All',
    level: LEVELS[params.get('level')] ? params.get('level') : 'All',
    term: '',
    teacher: sessionStorage.getItem('lv_teacher') || '',
    teacherSubject: '',
    open: null
  };
  const list = $('#qlist'), voted = new Set(LS.get('lv_voted', []));

  $('#f-subject').innerHTML = '<option value="All" data-en="All subjects" data-am="ሁሉም ትምህርት ዓይነቶች">All subjects</option>' + SUBJECTS.map(s => `<option ${s === S.subject ? 'selected' : ''}>${esc(s)}</option>`).join('');
  $('#f-level').innerHTML = '<option value="All" data-en="All paths" data-am="ሁሉም መንገዶች">All paths</option>' + Object.entries(LEVELS).map(([k, L]) => `<option value="${k}" data-en="${L.name}" data-am="${L.am}" ${k === S.level ? 'selected' : ''}>${L.name}</option>`).join('');
  $('#n-subject').innerHTML = SUBJECTS.map(s => `<option ${s === S.subject ? 'selected' : ''}>${esc(s)}</option>`).join('');
  $('#n-level').innerHTML = Object.entries(LEVELS).map(([k, L]) => `<option value="${k}" data-en="${L.name}" data-am="${L.am}" ${k === S.level ? 'selected' : ''}>${L.name}</option>`).join('');
  if ($('#n-name')) $('#n-name').value = LS.get('lv_name', '');

  function syncTeacherScope() {
    const active = mode === 'server' && Boolean(S.teacher) && SUBJECTS.includes(S.teacherSubject);
    const filter = $('#f-subject'), askSubject = $('#n-subject');
    if (active) {
      S.subject = S.teacherSubject;
      if (filter) filter.value = S.teacherSubject;
      if (askSubject) askSubject.value = S.teacherSubject;
    }
    if (filter) filter.disabled = active;
    if (askSubject) askSubject.disabled = active;
  }

  function showModeBanner() {
    const el = $('#mode');
    if (!el) return;
    if (mode === 'local') {
      el.innerHTML = `<div class="lv-banner" data-en="Practice mode: questions stay on this device only. When the school server is running, everyone shares the same board." data-am="ልምምድ ሁነታ፦ ጥያቄዎች በዚህ መሣሪያ ላይ ብቻ ይቆያሉ። የትምህርት ቤቱ ሰርቨር ሲሰራ ሁሉም ተማሪዎች አንድ መድረክ ይጠቀማሉ።">Practice mode: questions stay on this device only. When the school server is running, everyone shares the same board.</div>`;
      S.teacher = ''; S.teacherSubject = '';
      sessionStorage.removeItem('lv_teacher');
      sessionStorage.removeItem('lv_teacher_subject');
      syncTeacherScope();
      if ($('#teacher-box')) $('#teacher-box').style.display = 'none';
      return;
    }
    syncTeacherScope();
    if ($('#teacher-box')) $('#teacher-box').style.display = '';
    if (S.teacher) {
      el.innerHTML = `<div class="lv-teacher-banner">
        <span><strong><span data-en="Teacher mode for ${esc(S.teacherSubject)} is on." data-am="የ${esc(S.teacherSubject)} የመምህር ሁነታ ንቁ ነው።">Teacher mode for ${esc(S.teacherSubject)} is on.</span></strong> <span data-en="You can manage this subject only." data-am="ይህን ትምህርት ዓይነት ብቻ ማስተዳደር ይችላሉ።">You can manage this subject only.</span></span>
        <button type="button" id="stop-teacher" class="lv-btn small" style="background:#b3261e" data-en="Stop teacher mode" data-am="የመምህር ሁነታን አቁም">Stop teacher mode</button>
      </div>`;
      const stop = $('#stop-teacher');
      if (stop) stop.onclick = () => {
        S.teacher = ''; S.teacherSubject = '';
        sessionStorage.removeItem('lv_teacher');
        sessionStorage.removeItem('lv_teacher_subject');
        const msg = $('#t-msg'); if (msg) { msg.textContent = ''; msg.className = ''; }
        const code = $('#t-code'); if (code) code.value = '';
        showModeBanner(); load();
      };
    } else {
      el.innerHTML = '';
    }
  }

  function statsClass(q) {
    if (q.solved) return 'qa-stats solved';
    if (q.answers > 0) return 'qa-stats has-answers';
    return 'qa-stats';
  }

  async function load() {
    const p = new URLSearchParams();
    if (S.subject !== 'All') p.set('subject', S.subject);
    if (S.level !== 'All') p.set('level', S.level);
    try {
      const all = await call('GET', '/questions?' + p, null, S.teacher);
      showModeBanner();
      const t = S.term.trim().toLowerCase();
      const scoped = S.teacher && S.teacherSubject && mode === 'server';
      const rows = all.filter(q => (!scoped || q.subject === S.teacherSubject) && (!t || (q.title + ' ' + q.body).toLowerCase().includes(t)));
      list.innerHTML = rows.length ? rows.map(q => `
        <article class="qa-card ${S.open == q.id ? 'is-open' : ''}" data-id="${q.id}">
          <button class="qa-card-head" data-act="toggle" aria-expanded="${S.open == q.id}">
            <div class="${statsClass(q)}">
              <strong>${q.answers}</strong>
              <span data-en="${q.answers === 1 ? 'answer' : 'answers'}" data-am="መልሶች">${q.answers === 1 ? 'answer' : 'answers'}</span>
            </div>
            <div class="qa-card-body">
              <h3>${esc(q.title)}</h3>
              <div class="qa-card-meta">
                <span class="qa-chip">${esc(q.subject)}</span>
                ${LEVELS[q.level] ? `<span class="qa-chip path" data-en="${LEVELS[q.level].icon} ${esc(LEVELS[q.level].name)}" data-am="${LEVELS[q.level].icon} ${LEVELS[q.level].am}">${LEVELS[q.level].icon} ${esc(LEVELS[q.level].name)}</span>` : ''}
                ${q.solved ? '<span class="qa-chip solved" data-en="✔ Verified" data-am="✔ የተረጋገጠ">✔ Verified</span>' : ''}
                <span>${esc(q.author)}</span>
                <span>·</span>
                <span>${fmt(q.createdAt)}</span>
              </div>
            </div>
          </button>
          <div class="qa-thread" ${S.open == q.id ? '' : 'hidden'}></div>
        </article>`).join('')
        : `<div class="qa-empty"><strong data-en="No questions yet" data-am="እስካሁን ጥያቄዎች የሉም">No questions yet</strong></div>`;
      if (S.open) openThread(S.open);
    } catch (e) {
      list.innerHTML = `<div class="qa-empty"><strong data-en="Could not load" data-am="መጫን አልተቻለም">Could not load</strong>${esc(e.message)}</div>`;
    }
  }

  /* ---- teacher voice helpers (record, upload at once, show time, size and progress) ---- */
  const media = new WeakMap();           // form -> {blob, type, url, remote}
  let rec = null;
  const LBL = {rec: bi('🎤 Record voice', '🎤 ድምፅ ቅዳ'), stop: bi('⏹ Stop recording', '⏹ ቀረጻ አቁም'), rm: bi('Remove', 'አስወግድ'), file: bi('📁 Choose audio file', '📁 የድምፅ ፋይል ምረጥ')};
  const MB = n => (n / 1048576).toFixed(2) + ' MB';
  const clock = sec => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  const status = (form, msg, bad) => { const el = $('.qa-status', form); if (el) { el.textContent = msg || ''; el.className = 'qa-status' + (bad ? ' bad' : ''); } };
  const info = (form, sec, size) => { const el = $('.qa-info', form); if (el) el.textContent = (sec == null ? '' : '⏱ ' + clock(sec) + ' min   ·   ') + '💾 ' + MB(size); };
  const progress = (form, pct) => {
    const box = $('.qa-progress', form); if (!box) return;
    box.hidden = pct == null;
    if (pct != null) { $('.qa-bar i', box).style.width = pct + '%'; $('span', box).textContent = pct + '%'; }
  };
  function uploadMedia(blob, type, onp) {            // XMLHttpRequest, because fetch cannot report upload progress
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/discuss/media');
      x.setRequestHeader('Content-Type', type);
      x.setRequestHeader('x-teacher-code', S.teacher);
      x.upload.onprogress = e => { if (e.lengthComputable && onp) onp(Math.round(e.loaded / e.total * 100)); };
      x.onerror = () => reject(new Error('Upload failed: could not reach the server.'));
      x.onload = () => {
        let d = {}; try { d = JSON.parse(x.responseText); } catch (e) {}
        if (x.status >= 200 && x.status < 300 && d.url) { if (onp) onp(100); resolve(d.url); }
        else reject(new Error(d.error || `Upload failed (error ${x.status}). The server or proxy may be limiting file size.`));
      };
      x.send(blob);
    });
  }
  async function sendVoice(form, m) {
    progress(form, 0); status(form, 'Uploading voice…');
    try { m.remote = await uploadMedia(m.blob, m.type, p => progress(form, p)); status(form, '✔ Uploaded 100%. Press “Post as teacher”.');
      const au = $('.qa-preview audio', form); if (au) { au.src = m.remote; au.load(); } }
    catch (x) { progress(form, null); status(form, x.message, true); throw x; }
  }
  async function setVoice(form, blob, type, secs) {
    const old = media.get(form); if (old) URL.revokeObjectURL(old.url);
    const box = $('.qa-preview', form);
    if (!blob) { media.delete(form); box.innerHTML = ''; box.hidden = true; status(form, ''); info(form, null, 0); $('.qa-info', form).textContent = ''; progress(form, null); return; }
    const m = {blob, type, url: URL.createObjectURL(blob), remote: ''};
    media.set(form, m);
    box.hidden = false;
    box.innerHTML = `<audio controls preload="auto" src="${m.url}"></audio><button type="button" class="lv-btn ghost small" data-act="clearmedia">${LBL.rm}</button>`;
    info(form, secs, blob.size);
    if (secs == null) {                               // chosen file: read its length
      const probe = new Audio(); probe.preload = 'metadata'; probe.src = m.url;
      probe.onloadedmetadata = () => { if (isFinite(probe.duration)) info(form, probe.duration, blob.size); };
    }
    try { await sendVoice(form, m); } catch (x) { /* message already shown */ }
  }
  async function toggleRec(btn, form) {
    if (rec) { rec.stop(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const r = new MediaRecorder(stream, mt ? {mimeType: mt} : undefined), chunks = [];
    let bytes = 0; const t0 = Date.now();
    r.ondataavailable = e => { if (e.data.size) { chunks.push(e.data); bytes += e.data.size; } };
    const tick = setInterval(() => { const sec = (Date.now() - t0) / 1000; status(form, `🔴 Recording… ${clock(sec)} min · ${MB(bytes)}`); }, 250);
    const limit = setTimeout(() => r.state === 'recording' && r.stop(), 5 * 60 * 1000);   // 5 minute limit
    r.onstop = () => {
      clearInterval(tick); clearTimeout(limit); stream.getTracks().forEach(t => t.stop()); rec = null;
      btn.classList.remove('rec'); btn.innerHTML = LBL.rec;
      const type = (r.mimeType || mt || 'audio/webm').split(';')[0], secs = (Date.now() - t0) / 1000;
      if (chunks.length) setVoice(form, new Blob(chunks, {type}), type, secs); else status(form, 'Nothing was recorded. Check the microphone.', true);
    };
    r.start(500); rec = r; btn.classList.add('rec'); btn.innerHTML = LBL.stop;
  }
  const mediaHtml = a => a.mediaUrl ? `<audio class="qa-audio" controls preload="none" src="${esc(a.mediaUrl)}"></audio>` : '';

  async function openThread(id) {
    const box = list.querySelector(`[data-id="${id}"] .qa-thread`);
    if (!box) return;
    try {
      const q = await call('GET', '/questions/' + id, null, S.teacher);
      const T = !!S.teacher && mode === 'server';
      const mine = mode === 'local' || !!owned()[q.id];
      box.innerHTML = `
        <div class="qa-qbody">${esc(q.body)}</div>
        ${q.realName ? `<p class="lv-note"><span data-en="Teacher view: asked by" data-am="የመምህር እይታ፦ የጠየቀው">Teacher view: asked by</span> ${esc(q.realName)}</p>` : ''}
        ${(T || mine) ? `<div class="lv-actions"><button class="lv-btn danger small" data-act="delq" data-id="${q.id}" data-en="Delete question" data-am="ጥያቄውን ሰርዝ">Delete question</button></div>` : ''}
        <h4>${q.answerList.length} <span data-en="${q.answerList.length === 1 ? 'Answer' : 'Answers'}" data-am="መልሶች">${q.answerList.length === 1 ? 'Answer' : 'Answers'}</span></h4>
        ${q.answerList.map(a => `
          <div class="qa-ans ${a.isTeacher ? 'teacher' : ''} ${a.verified ? 'verified' : ''}">
            <div class="lv-meta">
              ${a.isTeacher ? '<span class="lv-tag t" data-en="Teacher" data-am="መምህር">Teacher</span>' : ''}
              ${a.verified ? '<span class="lv-tag s" data-en="✔ Verified" data-am="✔ የተረጋገጠ">✔ Verified</span>' : ''}
              <span>${esc(a.author)}</span>
              <span>${fmt(a.createdAt)}</span>
            </div>
            ${a.body ? `<p class="lv-text">${esc(a.body)}</p>` : ''}
            ${mediaHtml(a)}
            ${T ? `<div class="lv-actions">
              <button class="lv-btn ghost small" data-act="verify" data-id="${a.id}" data-en="${a.verified ? 'Remove verified' : 'Mark verified'}" data-am="${a.verified ? 'ማረጋገጫን አስወግድ' : 'እንደተረጋገጠ ምልክት አድርግ'}">${a.verified ? 'Remove verified' : 'Mark verified'}</button>
              <button class="lv-btn danger small" data-act="dela" data-id="${a.id}" data-en="Delete" data-am="ሰርዝ">Delete</button></div>` : ''}
          </div>`).join('')}
        <form class="qa-reply ${T ? 'teacher-mode' : ''}" data-qid="${q.id}">
          <h4>${T ? '<span data-en="Teacher answer" data-am="የመምህር መልስ">Teacher answer</span>' : '<span data-en="Your answer" data-am="መልስዎ">Your answer</span>'}</h4>
          <label class="qa-label"><textarea rows="4" maxlength="2000"></textarea></label>
          ${T ? `<div class="qa-tools">
              <button type="button" class="lv-btn ghost small" data-act="rec">${LBL.rec}</button>
              <button type="button" class="lv-btn ghost small" data-act="voicefile">${LBL.file}</button>
              <input type="file" class="qa-voicefile" accept="audio/*" hidden>
            </div>
            <div class="qa-preview" hidden></div>
            <p class="qa-info" aria-live="polite"></p>
            <div class="qa-progress" hidden><div class="qa-bar"><i></i></div><span>0%</span></div>
            <p class="qa-status" role="status"></p>` : ''}
          <div class="qa-reply-row">
            <label class="qa-label"><span data-en="Your name (optional)" data-am="ስምዎ (አማራጭ)">Your name (optional)</span>
              <input type="text" class="qa-name" maxlength="40" value="${esc(T ? (LS.get('lv_tname', '') || 'Teacher') : LS.get('lv_name', ''))}">
            </label>
            <button class="lv-btn" type="submit" data-en="${T ? 'Post as teacher' : 'Post answer'}" data-am="${T ? 'እንደ መምህር ይለጥፉ' : 'መልስ ይለጥፉ'}">${T ? 'Post as teacher' : 'Post answer'}</button>
          </div>
          <p class="lv-err" role="alert"></p>
        </form>`;
    } catch (e) {
      box.innerHTML = `<p class="lv-err">${esc(e.message)}</p>`;
    }
  }

  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id || b.closest('.qa-card')?.dataset.id;
    const act = b.dataset.act;
    const am = localStorage.getItem('site_lang') === 'am';
    try {
      if (act === 'toggle') {
        const qid = b.closest('.qa-card').dataset.id;
        S.open = S.open == qid ? null : qid;
        return load();
      }
      if (act === 'voicefile') { $('input.qa-voicefile', b.closest('form')).click(); return; }
      if (act === 'rec') {
        const f = b.closest('form');
        if (!rec && (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)) {
          status(f, 'This page cannot use the microphone (it needs https). Use “Choose audio file” and record with your phone’s voice recorder.', true); return;
        }
        try { await toggleRec(b, f); } catch (x) { status(f, 'Microphone is blocked. Allow the microphone for this site, or use “Choose audio file”.', true); }
        return;
      }
      if (act === 'clearmedia') { setVoice(b.closest('form'), null); return; }
      if (act === 'verify') await call('POST', `/answers/${id}/verify`, null, S.teacher);
      if (act === 'dela' && confirm(am ? 'ይህን መልስ ይሰርዙ?' : 'Delete this answer?')) await call('DELETE', `/answers/${id}`, null, S.teacher);
      if (act === 'delq') {
        if (!confirm(am ? 'ይህን ጥያቄና መልሶቹን ይሰርዙ?' : 'Delete this question and its answers?')) return;
        await call('DELETE', `/questions/${id}`, null, S.teacher);
        const o = owned(); delete o[id]; LS.set('lv_owned', o);
        S.open = null;
      }
      load();
    } catch (err) { alert(err.message); }
  });

  list.addEventListener('change', e => {
    const inp = e.target.closest('input.qa-voicefile');
    if (!inp) return;
    const form = inp.closest('form'), file = inp.files[0];
    inp.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return status(form, 'This audio file is too large (8 MB maximum).', true);
    setVoice(form, file, (file.type || 'audio/mp4').split(';')[0]);
  });

  list.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.dataset.qid) return;
    const err = $('.lv-err', f), btn = $('button[type=submit]', f);
    const name = ($('input.qa-name', f)?.value || '').trim();
    const body = ($('textarea', f)?.value || '').trim();
    const m = media.get(f);
    if (rec) { if (err) err.textContent = 'Stop the recording first.'; return; }
    if (m && m.remote === undefined) return;
    if (!body && !m) { if (err) err.innerHTML = bi('Please write your answer.', 'እባክዎ መልስዎን ይጻፉ።'); return; }
    if (btn) btn.disabled = true;
    try {
      if (m && S.teacher && !m.remote) await sendVoice(f, m);
      const mediaUrl = m && S.teacher ? m.remote : undefined;
      await call('POST', `/questions/${f.dataset.qid}/answers`, { body, name, mediaUrl }, S.teacher);
      if (m) URL.revokeObjectURL(m.url);
      if (S.teacher) LS.set('lv_tname', name); else LS.set('lv_name', name);
      load();
    } catch (x) { if (err) err.textContent = x.message; status(f, x.message, true); if (btn) btn.disabled = false; }
  });

  $('#f-subject')?.addEventListener('change', e => { S.subject = e.target.value; S.open = null; load(); });
  $('#f-level')?.addEventListener('change', e => { S.level = e.target.value; S.open = null; load(); });
  $('#f-search')?.addEventListener('input', e => { S.term = e.target.value; load(); });

  $('#ask')?.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#ask-err'); if (err) err.textContent = '';
    const body = {
      title: $('#n-title').value.trim(),
      body: $('#n-body').value.trim(),
      subject: $('#n-subject').value,
      level: $('#n-level').value,
      name: $('#n-name').value.trim(),
      anon: $('#n-anon').checked
    };
    if (body.title.length < 5 || body.body.length < 10) {
      if (err) err.innerHTML = bi('Please write a clear title (5+ letters) and some detail (10+ letters).', 'እባክዎ ግልጽ ርዕስ (5+ ፊደላት) እና ተጨማሪ ዝርዝር (10+ ፊደላት) ይጻፉ።');
      return;
    }
    try {
      const r = await call('POST', '/questions', body, S.teacher);
      LS.set('lv_name', body.name);
      if (r.deleteToken) { const o = owned(); o[r.id] = r.deleteToken; LS.set('lv_owned', o); }
      e.target.reset();
      if ($('#n-name')) $('#n-name').value = body.name;
      const ok = $('#ask-ok'); if (ok) ok.innerHTML = bi('Your question is posted.', 'ጥያቄዎ ተለጥፏል።');
      S.open = r.id; S.level = 'All';
      if (S.teacherSubject) {
        S.subject = S.teacherSubject;
        if ($('#n-subject')) $('#n-subject').value = S.teacherSubject;
        if ($('#f-subject')) $('#f-subject').value = S.teacherSubject;
      } else {
        S.subject = 'All';
        if ($('#f-subject')) $('#f-subject').value = 'All';
      }
      if ($('#f-level')) $('#f-level').value = 'All';
      load();
      document.getElementById('questions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (x) { if (err) err.textContent = x.message; }
  });

  $('#teacher-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const code = ($('#t-code')?.value || '').trim();
    const m = $('#t-msg');
    if (!code) { if (m) { m.innerHTML = bi('Enter the teacher code.', 'የመምህር ኮዱን ያስገቡ።'); m.className = 'lv-err'; } return; }
    try {
      const auth = await call('GET', '/teacher/check', null, code);
      if (!SUBJECTS.includes(auth.subject)) throw new Error('This code is not assigned to a subject.');
      S.teacher = code;
      S.teacherSubject = auth.subject;
      S.subject = auth.subject;
      sessionStorage.setItem('lv_teacher', code);
      sessionStorage.setItem('lv_teacher_subject', auth.subject);
      if (m) { m.innerHTML = `<span data-en="Teacher mode for ${esc(auth.subject)} is on." data-am="የ${esc(auth.subject)} የመምህር ሁነታ ንቁ ነው።">Teacher mode for ${esc(auth.subject)} is on.</span>`; m.className = 'lv-ok'; }
      const box = $('#teacher-box'); if (box) box.open = false;
      showModeBanner(); load();
    } catch (x) { if (m) { m.textContent = x.message; m.className = 'lv-err'; } }
  });

  async function restoreTeacher() {
    if (S.teacher) {
      try {
        const auth = await call('GET', '/teacher/check', null, S.teacher);
        if (!SUBJECTS.includes(auth.subject)) throw new Error('Invalid teacher subject.');
        S.teacherSubject = auth.subject;
        S.subject = auth.subject;
        sessionStorage.setItem('lv_teacher_subject', auth.subject);
      } catch (e) {
        S.teacher = ''; S.teacherSubject = '';
        sessionStorage.removeItem('lv_teacher');
        sessionStorage.removeItem('lv_teacher_subject');
      }
    }
    showModeBanner();
    load();
  }

  restoreTeacher();
}

/* ---------- start ---------- */
const PAGE = document.body.dataset.page;
layout(PAGE === 'hub' || PAGE === 'level' ? 'levels' : 'discuss');
({hub: hubPage, level: levelPage, discuss: discussPage})[PAGE]?.();
