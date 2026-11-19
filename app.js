const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi = (en, am) => `<span data-en="${esc(en)}" data-am="${esc(am)}">${esc(en)}</span>`;
const biField = (row, key, fallback = '') => bi(row[key] || fallback, row[key + 'Am'] || row['am' + key[0].toUpperCase() + key.slice(1)] || row[key + '_am'] || fallback || row[key]);
function applyLocaleAttributes() {
  const lang = localStorage.getItem('site_lang') === 'am' ? 'am' : 'en';
  document.querySelectorAll('[data-en-placeholder][data-am-placeholder]').forEach(el => { el.placeholder = el.dataset[lang + 'Placeholder']; });
  document.querySelectorAll('[data-en-aria-label][data-am-aria-label]').forEach(el => { el.setAttribute('aria-label', el.dataset[lang + 'AriaLabel']); });
}
document.addEventListener('DOMContentLoaded', () => {
  applyLocaleAttributes();
});
document.addEventListener('site-language-change', e => {
  const lang = e.detail && e.detail.language === 'am' ? 'am' : 'en';
  try { localStorage.setItem('site_lang', lang); localStorage.setItem('lv_lang', lang); } catch (x) {}
  applyLocaleAttributes();
});
const enc = encodeURIComponent;
const fmtDate = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}); };
const byDate = (a, b) => new Date(b.date) - new Date(a.date);
const fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

/* works even if js/portal-config.js is missing */
const _STREAMS = typeof STREAMS !== 'undefined' ? STREAMS : {
  natural: {name: 'Natural Science', am: 'የተፈጥሮ ሳይንስ', subjects: ['Mathematics','Physics','Chemistry','Biology','English','Aptitude','Civics']},
  social:  {name: 'Social Science',  am: 'የማኅበራዊ ሳይንስ', subjects: ['Mathematics','Geography','History','Economics','English','Aptitude','Civics']}};
const _SUBJECT_AM = typeof SUBJECT_AM !== 'undefined' ? SUBJECT_AM : {};
const _RES_TYPES = typeof RES_TYPES !== 'undefined' ? RES_TYPES : ['Past exam','Textbook','Practice','Video','Reference','Notes'];
const _RES_TYPES_AM = {'Past exam':'ያለፈ ፈተና','Textbook':'መማሪያ መጽሐፍ','Practice':'ልምምድ','Video':'ቪዲዮ','Reference':'ማጣቀሻ','Notes':'ማስታወሻዎች'};
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

const NAV = [
  ['students.html','Home','home'],
  ['resources.html','Question sources','resources'],
  ['news.html','Exam news','news'],
  ['topics.html','Topics to pages','topics'],
  ['notes.html','Short notes','notes'],
  ['stories.html','Student stories','stories']
];

function layout() {
  const page = document.body.dataset.page;
  const portalLinks = NAV.map((n, i) => [n[0], n[1], n[2], ['መነሻ','የጥያቄ ምንጮች','የፈተና ዜና','ርዕሶችና ገጾች','አጭር ማስታወሻዎች','የተማሪዎች ተሞክሮ'][i]]);
  if (page !== 'home') portalLinks.push(['/levels.html', 'Student levels', 'levels', 'የተማሪዎች ደረጃዎች'], ['/discuss.html', 'Discussion board', 'discuss', 'የውይይት መድረክ']);
  mountSiteNav('#site-header', {main: false, stickySub: true, sub: portalLinks, subActive: page});
  document.querySelectorAll('.sn-sub a').forEach((a, i) => {
    const item = portalLinks[i];
    if (item && item[3]) { a.setAttribute('data-en', item[1]); a.setAttribute('data-am', item[3]); }
  });
  $('#site-footer').innerHTML = `<footer><div class="wrap"><span data-en="አለታ ህዳሴ Grade 12 Preparatory Portal. Study materials are linked from their original sources." data-am="አለታ ህዳሴ የ12ኛ ክፍል ዝግጅት ፖርታል። የጥናት ግብዓቶች ከዋና ምንጮቻቸው ጋር ተያይዘዋል።">አለታ ህዳሴ Grade 12 Preparatory Portal. Study materials are linked from their original sources.</span> <a href="/index.html" data-en="Back to the school website" data-am="ወደ ትምህርት ቤቱ ድረ-ገጽ ተመለስ">Back to the school website</a></div></footer>`;
}

/* ---------- data: the school server first, the sample data in data.js as a fallback ---------- */
async function getJSON(url) {
  try { const r = await fetch(url); if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null; return await r.json(); }
  catch (e) { return null; }
}
const newsData = async () => (await getJSON('/api/portal/news')) ?? NEWS;
const resourcesData = async () => (await getJSON('/api/portal/resources')) ?? (typeof STARTER_SOURCES !== 'undefined' ? STARTER_SOURCES : RESOURCES.map(r => ({...r, stream: 'both'}))).map(r => ({...r, isFile: false}));

/* shared search + subject filter for list pages (topics, notes) */
function listPage({data, card, fields}) {
  const params = new URLSearchParams(location.search);
  let subject = params.get('subject') || 'All', term = '';
  const chips = $('#chips'), list = $('#list'), empty = $('#empty'), q = $('#q');
  const subjects = ['All', ...SUBJECTS];
  chips.innerHTML = subjects.map(s => `<button class="chip" data-s="${esc(s)}">${bi(s, s === 'All' ? 'ሁሉም' : _SUBJECT_AM[s] || s)}</button>`).join('');
  function draw() {
    chips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === subject));
    const t = term.trim().toLowerCase();
    const rows = data.filter(d => (subject === 'All' || d.subject === subject) &&
      (!t || fields.some(f => [].concat(d[f] || '').join(' ').toLowerCase().includes(t))));
    list.innerHTML = rows.map(card).join('');
    empty.hidden = rows.length > 0;
    $('#count').innerHTML = bi(rows.length + (rows.length === 1 ? ' result' : ' results'), rows.length + ' ውጤት');
  }
  chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { subject = b.dataset.s; draw(); } });
  q.addEventListener('input', () => { term = q.value; draw(); });
  draw();
}

const newsCard = n => `
  <article class="news-row">
    <div class="meta">${n.pinned ? '<span class="tag hot" data-en="📌 Pinned" data-am="📌 የተሰካ">📌 Pinned</span>' : ''}${n.tag ? `<span class="tag ${n.tag === 'SAMPLE' ? 'hot' : ''}">${esc(n.tag)}</span>` : ''}<span class="tag date">${esc(fmtDate(n.date))}</span></div>
    <h3>${biField(n, 'title')}</h3><p style="white-space:pre-wrap">${biField(n, 'body')}</p>
  </article>`;

const STREAM_LABEL = {natural: 'Natural Science', social: 'Social Science'};

const PAGES = {
  async home() {
    /* subject list for both streams, with the number of sources found for each subject */
    const res = await resourcesData();
    const count = (s, k) => res.filter(r => (r.subject === s || r.subject === 'All subjects') && (r.stream === 'both' || r.stream === k)).length;
    $('#streams').innerHTML = Object.entries(_STREAMS).map(([k, S]) => `
      <div class="stream" id="${k}"><h3>${bi(S.name, S.am)} <span>${esc(S.am)}</span></h3>
        <div class="subj-grid">${S.subjects.map(s => { const n = count(s, k); return `
          <div class="subj"><b>${esc(s)} <small>${esc(_SUBJECT_AM[s] || '')}</small></b>
            <span class="cnt">${n ? bi(n + (n === 1 ? ' question source' : ' question sources'), n + ' የጥያቄ ምንጭ') : bi('No sources added yet', 'ምንጮች ገና አልተጨመሩም')}</span>
            <div class="subj-links"><a class="primary" href="resources.html?subject=${enc(s)}&stream=${k}" data-en="Question sources" data-am="የጥያቄ ምንጮች">Question sources</a>
              <a href="notes.html?subject=${enc(s)}" data-en="Notes" data-am="ማስታወሻዎች">Notes</a><a href="topics.html?subject=${enc(s)}" data-en="Topics" data-am="ርዕሶች">Topics</a></div></div>`; }).join('')}</div></div>`).join('');

    const news = [...(await newsData())].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byDate(a, b)).slice(0, 3);
    $('#latest-news').innerHTML = news.length ? news.map(newsCard).join('') : '<div class="empty" style="margin-bottom:0" data-en="No news yet. Check back soon." data-am="እስካሁን ዜና የለም። በቅርቡ እንደገና ይመልከቱ።">No news yet. Check back soon.</div>';

    const box = $('#countdown');
    if (typeof EXAM_DATE !== 'undefined' && EXAM_DATE) {
      const days = Math.ceil((new Date(EXAM_DATE) - new Date()) / 86400000);
      box.innerHTML = days > 0 ? `<b>${days}</b><small data-en="days until the exam" data-am="ቀናት እስከ ፈተናው">days until the exam</small>` : `<b data-en="Good luck!" data-am="መልካም ዕድል!">Good luck!</b><small data-en="The exam has started" data-am="ፈተናው ተጀምሯል">The exam has started</small>`;
    } else box.remove();
  },

  async resources() {
    const items = await resourcesData();
    const params = new URLSearchParams(location.search);
    let subject = SUBJECTS.includes(params.get('subject')) ? params.get('subject') : 'All';
    let stream = ['natural', 'social'].includes(params.get('stream')) ? params.get('stream') : 'All', type = 'All', term = '';
    const chips = $('#chips'), sChips = $('#streamchips'), sel = $('#typesel');
    chips.innerHTML = ['All', ...SUBJECTS].map(s => `<button class="chip" data-s="${esc(s)}">${bi(s, s === 'All' ? 'ሁሉም' : _SUBJECT_AM[s] || s)}</button>`).join('');
    sChips.innerHTML = [['All','Both streams','ሁለቱም ዘርፎች'],['natural','Natural Science','የተፈጥሮ ሳይንስ'],['social','Social Science','የማኅበራዊ ሳይንስ']].map(s => `<button class="chip" data-k="${s[0]}">${bi(s[1],s[2])}</button>`).join('');
    sel.innerHTML = `<option value="All" data-en="All types" data-am="ሁሉም ዓይነቶች">All types</option>` + _RES_TYPES.map(t => `<option data-en="${esc(t)}" data-am="${esc(_RES_TYPES_AM[t] || t)}">${esc(t)}</option>`).join('');
    const card = r => `
      <article class="card">
        <div class="meta"><span class="tag">${esc(r.subject)}</span>${r.stream !== 'both' && STREAM_LABEL[r.stream] ? `<span class="tag stream" data-en="${STREAM_LABEL[r.stream]}" data-am="${r.stream === 'natural' ? 'የተፈጥሮ ሳይንስ' : 'የማኅበራዊ ሳይንስ'}">${STREAM_LABEL[r.stream]}</span>` : ''}<span class="tag hot" data-en="${esc(r.type)}" data-am="${esc(_RES_TYPES_AM[r.type] || r.type)}">${esc(r.type)}</span>${r.year ? `<span class="tag date">${esc(r.year)}</span>` : ''}</div>
        <h3>${biField(r, 'title')}</h3>${r.desc ? `<p>${biField(r, 'desc')}</p>` : ''}
        ${r.url ? (r.isFile
          ? `<div class="res-actions"><a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="pdf-ic">PDF</span>${bi('Open','ክፈት')}</a><a class="btn alt" href="${esc(r.url)}?download=1">${bi('Download','አውርድ')}${r.size ? ' (' + fmtSize(r.size) + ')' : ''}</a></div>`
          : `<div class="res-actions"><a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-en="Open source" data-am="ምንጩን ክፈት">Open source</a><span class="host">${esc(hostOf(r.url))}</span></div>`)
          : `<span class="pending" data-en="Link not added yet" data-am="አገናኝ ገና አልተጨመረም">Link not added yet</span>`}
      </article>`;
    function draw() {
      chips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === subject));
      sChips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === stream));
      const t = term.trim().toLowerCase();
      const rows = items.filter(r => (subject === 'All' || r.subject === 'All subjects' || r.subject === subject) && (stream === 'All' || r.stream === 'both' || r.stream === stream) &&
        (type === 'All' || r.type === type) && (!t || (r.title + ' ' + (r.desc || '') + ' ' + r.type + ' ' + r.subject + ' ' + (r.year || '')).toLowerCase().includes(t)));
      $('#list').innerHTML = rows.map(card).join('');
      $('#empty').innerHTML = items.length ? bi('Nothing matches. Try another subject, stream or word.', 'ምንም ውጤት አልተገኘም። ሌላ ትምህርት ዓይነት፣ ዘርፍ ወይም ቃል ይሞክሩ።') : bi('No question sources have been added yet. Check back soon.', 'የጥያቄ ምንጮች ገና አልተጨመሩም። በቅርቡ እንደገና ይመልከቱ።');
      $('#empty').hidden = rows.length > 0;
      $('#count').innerHTML = bi(rows.length + (rows.length === 1 ? ' source' : ' sources'), rows.length + ' ምንጮች');
    }
    chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { subject = b.dataset.s; draw(); } });
    sChips.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { stream = b.dataset.k; draw(); } });
    sel.addEventListener('change', () => { type = sel.value; draw(); });
    $('#q').addEventListener('input', e => { term = e.target.value; draw(); });
    $('#tutor-form').addEventListener('submit', async e => {
      e.preventDefault();
      const input = $('#tutor-question'), button = e.currentTarget.querySelector('button[type="submit"]');
      const status = $('#tutor-status'), responseBox = $('#tutor-response');
      const responseTitle = $('#tutor-response-title'), answer = $('#tutor-answer');
      const am = document.documentElement.lang === 'am' || localStorage.getItem('site_lang') === 'am';
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
        const response = await fetch('/api/tutor/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            grade: '12',
            subject: subject === 'All' ? '' : subject,
            language: am ? 'am' : 'en'
          })
        });
        const data = await response.json();
        if (!response.ok) {
          const title = response.status === 503
            ? (am ? 'የAI አጋዡን ማዋቀር ያስፈልጋል' : 'AI helper setup required')
            : null;
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
    draw();
  },

  async news() {
    const list = [...(await newsData())].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byDate(a, b));
    $('#list').innerHTML = list.map(newsCard).join('');
    $('#empty').hidden = list.length > 0;
  },

  async topics() {
    const [files, details] = await Promise.all([
      getJSON('/api/content-assets?target_type=topic-file'),
      getJSON('/api/topic-card-details')
    ]);
    const fileByTopic = new Map((files || []).map(file => [file.target_key, file]));
    const detailByTopic = new Map((details || []).map(detail => [`${detail.subject}::${detail.topic}`, detail.location_text]));
    const topics = [...TOPICS];
    const knownTopics = new Set(topics.map(topic => `${topic.subject}::${topic.topic}`));
    (files || []).forEach(file => {
      const separator = file.target_key.indexOf('::');
      if (separator < 1) return;
      const subject = file.target_key.slice(0, separator), topic = file.target_key.slice(separator + 2);
      const key = `${subject}::${topic}`;
      if (!SUBJECTS.includes(subject) || !topic || knownTopics.has(key)) return;
      knownTopics.add(key);
      topics.push({subject, topic, unit: '', page: '', tip: 'Open the attached topic file.'});
    });
    listPage({data: topics, fields: ['topic','tip','subject','unit'], card: t => {
      const locationText = detailByTopic.get(`${t.subject}::${t.topic}`);
      const where = (t.unit || t.page)
        ? `<div class="where"><span data-en="Textbook:" data-am="የመማሪያ መጽሐፍ፦">Textbook:</span> ${esc([t.unit, t.page].filter(Boolean).join(', '))}</div>`
        : locationText
          ? `<div class="where">${esc(locationText)}</div>`
          : `<div class="where todo" data-en="Unit and page not added yet" data-am="ክፍልና ገጽ ገና አልተጨመሩም">Unit and page not added yet</div>`;
      const file = fileByTopic.get(`${t.subject}::${t.topic}`);
      const attachment = file ? (file.mime === 'application/pdf'
        ? `<a class="btn" href="${esc(file.url)}" target="_blank" rel="noopener" data-en="Open topic file" data-am="የርዕስ ፋይሉን ክፈት">Open topic file</a>`
        : `<a href="${esc(file.url)}" target="_blank" rel="noopener"><img class="topic-image" src="${esc(file.url)}" alt="${esc(t.topic)}"></a>`) : '';
      return `<article class="card"><div class="meta"><span class="tag">${esc(t.subject)}</span></div>
        <h3>${biField(t, 'topic')}</h3>${where}<p>${biField(t, 'tip')}</p>${attachment}</article>`;
    }});
  },
  notes() {
    listPage({data: NOTES, fields: ['title','points','subject'], card: n => `
      <article class="card"><div class="meta"><span class="tag">${esc(n.subject)}</span></div>
        <h3>${biField(n, 'title')}</h3><ul>${n.points.map((p, i) => bi(p, (n.pointsAm || n.amPoints || [])[i] || p)).map(p => `<li>${p}</li>`).join('')}</ul></article>`});
  },
  async stories() {
    const KEY = 'portal_stories', note = $('#story-note');
    const saved = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    $('#f-subject').innerHTML = ['General', ...SUBJECTS].map(s => `<option>${esc(s)}</option>`).join('');
    let server = await getJSON('/api/portal/stories');            // null when the school server part is not installed
    const card = s => `
      <article class="card"><div class="meta"><span class="tag">${esc(s.subject)}</span><span class="tag date">${esc(fmtDate(s.date))}</span></div>
        <h3>${biField(s, 'title')}</h3><p style="white-space:pre-wrap">${biField(s, 'text')}</p><p class="note"><span data-en="Shared by" data-am="ያጋራው">Shared by</span> ${esc(s.name || 'a student')}</p></article>`;
    function show() {
      const all = server ? server : [...saved(), ...STORIES].sort(byDate);
      $('#list').innerHTML = all.length ? all.map(card).join('') : '<div class="empty" style="grid-column:1/-1" data-en="No stories yet. Be the first to share yours." data-am="እስካሁን ተሞክሮዎች የሉም። የመጀመሪያው እርስዎ ይሁኑ።">No stories yet. Be the first to share yours.</div>';
    }
    if (server && note) note.innerHTML = bi('Stories you share here can be seen by all students. Please be kind and helpful.', 'እዚህ የሚያጋሯቸውን ተሞክሮዎች ሁሉም ተማሪዎች ማየት ይችላሉ። እባክዎ ደግና አጋዥ ይሁኑ።');
    $('#story-form').addEventListener('submit', async e => {
      e.preventDefault();
      const entry = {name: $('#f-name').value.trim(), subject: $('#f-subject').value, title: $('#f-title').value.trim(), text: $('#f-text').value.trim(),
                     website: ($('#f-website') || {}).value || '', date: new Date().toISOString().slice(0, 10)};
      if (!entry.title || !entry.text) return;
      const msg = $('#story-msg'); msg.className = 'ok'; msg.textContent = '';
      if (server) {
        try {
          const r = await fetch('/api/portal/stories', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(entry)});
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
          e.target.reset();
          msg.innerHTML = d.status === 'approved'
            ? bi('Thank you! Your story is now visible to all students.', 'እናመሰግናለን! ተሞክሮዎ አሁን ለሁሉም ተማሪዎች ይታያል።')
            : bi('Thank you! Your story will appear after a teacher approves it.', 'እናመሰግናለን! ተሞክሮዎ መምህር ካጸደቀው በኋላ ይታያል።');
          server = await getJSON('/api/portal/stories') || server; show();
        } catch (err) { msg.className = 'err'; msg.textContent = err.message; }
        return;
      }
      try { localStorage.setItem(KEY, JSON.stringify([entry, ...saved()])); } catch (err) {}
      e.target.reset(); show(); msg.innerHTML = bi('Story saved on this device.', 'ተሞክሮው በዚህ መሣሪያ ላይ ተቀምጧል።');
    });
    show();
  }
};

layout();
const run = PAGES[document.body.dataset.page];
if (run) run();
