const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
const language = () => { try { return localStorage.getItem('site_lang') === 'am' ? 'am' : 'en'; } catch { return 'en'; } };
const text = (en, am) => `<span data-en="${esc(en)}" data-am="${esc(am || en)}">${esc(language() === 'am' ? am || en : en)}</span>`;
const value = (item, key) => item[key + (language() === 'am' ? 'Am' : '')] || item[key];
const initials = n => String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
const hue = n => [...String(n)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

function pic(it) {
  return it.photo ? `<img src="${esc(it.photo)}" alt="${esc(it.name)}" loading="lazy" data-fb="1">`
                  : `<div class="avatar" style="--h:${hue(it.name)}">${esc(initials(it.name))}</div>`;
}
function fixBrokenPhotos(root) {
  root.querySelectorAll('img[data-fb]').forEach(img => img.addEventListener('error', () => {
    const d = document.createElement('div'); d.className = 'avatar'; d.style.setProperty('--h', hue(img.alt)); d.textContent = initials(img.alt); img.replaceWith(d);
  }, {once: true}));
}
function ring(score, outOf) {
  const pct = Math.max(0, Math.min(100, score / outOf * 100)), r = 26, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 64 64" role="img" aria-label="${language() === 'am' ? esc(outOf) + ' ውስጥ ' + esc(score) : esc(score) + ' out of ' + esc(outOf)}">
    <circle class="bg" cx="32" cy="32" r="${r}"/><circle class="fg" cx="32" cy="32" r="${r}" stroke-dasharray="${(pct / 100 * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>
    <text x="32" y="37" text-anchor="middle">${Math.round(pct)}%</text></svg>`;
}

async function detailPage() {
  const key = params.get('type'), C = ACHIEVEMENTS[key], page = $('#page');
  if (!C) { 
    page.innerHTML = `<div class="wrap"><div class="empty" style="margin-top:40px">${text('We could not find that group.', 'ይህን ምድብ ማግኘት አልተቻለም።')} <a href="achievement.html" style="color:var(--gold)">${text('Back to Achievements', 'ወደ ስኬቶች ተመለስ')}</a></div></div>`; 
    return; 
  }
  document.title = `${value(C, 'title')} | አለታ-ህዳሴ`;
  const outOf = it => it.outOf || C.outOf;
  
  let uploadedPhotos = [], records = [];
  try {
    const response = await fetch('/api/content-assets?target_type=achievement-photo');
    if (response.ok) uploadedPhotos = await response.json();
  } catch (error) {
    console.error('Could not load achievement photos:', error);
  }
  try {
    const response = await fetch(`/api/achievements?group=${encodeURIComponent(key)}`);
    if (response.ok) records = await response.json();
  } catch (error) {
    console.error('Could not load achievement records:', error);
  }

  const uploadedPhotoByKey = new Map(uploadedPhotos.map(file => [file.target_key, file.url]));
  
  const items = C.items.map((it, index) => ({...it, photo: uploadedPhotoByKey.get(`${key}:${index}`) || it.photo}));
  
  records.forEach(record => items.push({
    name: record.name,
    nameAm: record.name_am,
    photo: record.photo,
    year: record.year,
    subtitle: record.subtitle || (record.stream === 'natural' ? 'Natural Science' : record.stream === 'social' ? 'Social Science' : ''),
    subtitleAm: record.subtitle_am || (record.stream === 'natural' ? 'ተፈጥሮ ሳይንስ' : record.stream === 'social' ? 'ማህበራዊ ሳይንስ' : ''),
    stream: record.stream,
    score: record.score,
    outOf: record.out_of,
    result: record.result,
    resultAm: record.result_am,
    note: record.note,
    noteAm: record.note_am
  }));

  // Handle orphan images (uploaded directly without a text record)
  const usedPhotos = new Set(items.map(i => i.photo).filter(Boolean));
  uploadedPhotos
    .filter(file => file.target_key.startsWith(`${key}:`) && !usedPhotos.has(file.url))
    .forEach(file => {
      // Try to guess the year from the title or filename (e.g., "Abebe 2016")
      const title = file.display_title || file.file_name.replace(/\.[^.]+$/, '');
      const yearMatch = String(title).match(/\b(19\d{2}|20\d{2})\b/);
      
      items.push({
        name: title,
        photo: file.url,
        year: yearMatch ? yearMatch[0] : ''
      });
    });

  if (C.sort === 'score') items.sort((a, b) =>
    (b.score == null ? -Infinity : b.score / outOf(b)) - (a.score == null ? -Infinity : a.score / outOf(a)));
  else items.sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.name.localeCompare(b.name));
  
  let scoreRank = 0;
  items.forEach(it => { if (it.score != null) it.rank = ++scoreRank; });
  const scoredCount = items.filter(it => it.score != null).length;
  
  // Only show the year filter if there is at least one year
  const state = {year: 'All', stream: 'All', term: ''};
  const validYears = [...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const years = ['All', ...validYears];
  const streams = C.sort === 'score' ? ['All', 'natural', 'social'] : [];

  page.innerHTML = `
    <section class="hero"><div class="eyebrow">${text(C.label, C.labelAm)}</div><h1>${text(C.title, C.titleAm || C.am)}</h1><div class="am">${esc(C.am || '')}</div>
      <p>${text(C.desc, C.descAm)}</p><div class="hero-rule"></div></section>
    <div class="wrap"><div class="tools">
      ${validYears.length > 0 ? `<div class="chips" role="group" aria-label="${language() === 'am' ? 'ዓመት' : 'Year'}"><b>${text('Year', 'ዓመት')}</b>${years.map(y => `<button class="chip" data-y="${esc(y)}">${y === 'All' ? text('All', 'ሁሉም') : esc(y)}</button>`).join('')}</div>` : ''}
      ${streams.length ? `<div class="chips" role="group" aria-label="${language() === 'am' ? 'የተማሪ የትምህርት ክፍል' : 'Student stream'}"><b>${text('Stream', 'የትምህርት ክፍል')}</b>${streams.map(stream => `<button class="chip" data-stream="${stream}">${stream === 'All' ? text('All', 'ሁሉም') : text(stream === 'natural' ? 'Natural Science' : 'Social Science', stream === 'natural' ? 'ተፈጥሮ ሳይንስ' : 'ማህበራዊ ሳይንስ')}</button>`).join('')}</div>` : ''}
      <input id="q" type="search" placeholder="${language() === 'am' ? 'በስም ይፈልጉ' : 'Search by name'}" aria-label="${language() === 'am' ? 'በስም ይፈልጉ' : 'Search by name'}"></div>
      <div class="count" id="count"></div><div class="grid" id="grid"></div></div>
    <dialog class="modal" id="modal" aria-label="${language() === 'am' ? 'ዝርዝሮች' : 'Details'}"></dialog>`;

  const grid = $('#grid'), modal = $('#modal'), tools = $('.tools');
  let shown = [];
  
  function draw() {
    tools.querySelectorAll('.chip[data-y]').forEach(b => b.setAttribute('aria-pressed', b.dataset.y === state.year));
    tools.querySelectorAll('.chip[data-stream]').forEach(b => b.setAttribute('aria-pressed', b.dataset.stream === state.stream));
    const t = state.term.trim().toLowerCase();
    shown = items.filter(it =>
      (state.year === 'All' || it.year === state.year) &&
      (state.stream === 'All' || it.stream === state.stream) &&
      (!t || (it.name + ' ' + (it.nameAm || '') + ' ' + (it.subtitle || '') + ' ' + (it.subtitleAm || '')).toLowerCase().includes(t))
    );
    $('#count').innerHTML = `${shown.length} ${shown.length === 1 ? text('entry', 'ውጤት') : text('entries', 'ውጤቶች')}`;
    grid.innerHTML = shown.length ? shown.map((it, i) => `
      <button class="scard" data-i="${i}" aria-label="${esc(it.name)}, ${language() === 'am' ? 'ዝርዝሮችን ይክፈቱ' : 'open details'}">
        <div class="photo">${pic(it)}
          ${C.sort === 'score' && it.score != null ? `<span class="rank ${it.rank <= 3 ? 'r' + it.rank : ''}">${it.rank <= 3 ? ['🥇','🥈','🥉'][it.rank - 1] : '#' + it.rank}</span>` : ''}
          </div>
        <div class="sbody"><h3>${text(it.name, it.nameAm)}</h3>
          ${it.subtitle ? `<div class="sub">${text(it.subtitle, it.subtitleAm)}</div>` : ''}
          ${it.year ? `<div class="yr">${esc(it.year)}</div>` : ''}
          ${it.result ? `<div class="result">${text(it.result, it.resultAm)}</div>` : ''}
          ${it.score != null ? `<div class="score">${ring(it.score, outOf(it))}<div><b>${esc(it.score)}</b><span> / ${outOf(it)}</span></div></div>` : ''}</div></button>`).join('')
      : `<div class="empty">${text('Nothing matches. Try another year or name.', 'ምንም ውጤት አልተገኘም። ሌላ ዓመት ወይም ስም ይሞክሩ።')}</div>`;
    fixBrokenPhotos(grid);
  }
  
  tools.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    if (b.dataset.y) state.year = b.dataset.y;
    if (b.dataset.stream) state.stream = b.dataset.stream;
    draw();
  });
  $('#q').addEventListener('input', e => { state.term = e.target.value; draw(); });

  grid.addEventListener('click', e => {
    const c = e.target.closest('.scard'); if (!c) return;
    const it = shown[Number(c.dataset.i)], row = (k, kam, v, vam) => v ? `<dt>${text(k, kam)}</dt><dd>${text(v, vam)}</dd>` : '';
    modal.innerHTML = `<button class="close" aria-label="${language() === 'am' ? 'ዝጋ' : 'Close'}" data-close>✕</button><div class="m">
      <div class="photo">${pic(it)}</div>
      <div class="info"><h2>${text(it.name, it.nameAm)}</h2>
        ${it.score != null ? `<div class="big">${esc(it.score)} <small>/ ${outOf(it)}</small></div>${ring(it.score, outOf(it))}` : ''}
        ${it.result ? `<div class="result">${text(it.result, it.resultAm)}</div>` : ''}
        <dl>${row(C.subLabel || 'Details', C.subLabelAm || 'ዝርዝሮች', it.subtitle, it.subtitleAm)}${row('Year', 'ዓመት', it.year)}${C.sort === 'score' && it.score != null ? row('Rank', 'ደረጃ', `#${it.rank} of ${scoredCount}`, `ከ${scoredCount} ውስጥ #${it.rank}`) : ''}</dl>
        ${it.note ? `<p>${text(it.note, it.noteAm)}</p>` : ''}</div></div>`;
    fixBrokenPhotos(modal);
    modal.showModal();
  });
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) modal.close(); });
  draw();
}
detailPage();