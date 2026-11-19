/* Portal API: exam news + question sources (PDF uploads or links).
   Managed from admin.html by the same staff accounts that manage announcements.
   Uses Node's built-in node:sqlite and express (Node 22.13 or newer).
   In server.js add:   app.use('/api/portal', require('./portal-routes'));          */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const STARTER_SOURCES = [
  {
    "title": "Natural Science entrance exam, 2017 E.C. (2024/2025)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2017 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2017"
  },
  {
    "title": "Natural Science entrance exam, 2016 E.C. (2023/2024)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2016 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2016"
  },
  {
    "title": "Natural Science entrance exam, 2015 E.C. (2022/2023)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2015 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2015"
  },
  {
    "title": "Natural Science entrance exam, 2014 E.C. (2021/2022)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2014 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2014"
  },
  {
    "title": "Natural Science entrance exam, 2013 E.C. (2020/2021)",
    "desc": "Past national entrance exam (EUEE) papers for the Natural Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "natural",
    "type": "Past exam",
    "year": "2013 E.C",
    "url": "https://kehulum.com/entrance-exam/natural-science/2013"
  },
  {
    "title": "Social Science entrance exam, 2018 E.C. (2025/2026)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2018 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2018"
  },
  {
    "title": "Social Science entrance exam, 2017 E.C. (2024/2025)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2017 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2017"
  },
  {
    "title": "Social Science entrance exam, 2016 E.C. (2023/2024)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2016 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2016"
  },
  {
    "title": "Social Science entrance exam, 2015 E.C. (2022/2023)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2015 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2015"
  },
  {
    "title": "Social Science entrance exam, 2014 E.C. (2021/2022)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2014 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2014"
  },
  {
    "title": "Social Science entrance exam, 2013 E.C. (2020/2021)",
    "desc": "Past national entrance exam (EUEE) papers for the Social Science stream. Opens an external website.",
    "subject": "All subjects",
    "stream": "social",
    "type": "Past exam",
    "year": "2013 E.C",
    "url": "https://kehulum.com/entrance-exam/social-science/2013"
  },
  {
    "title": "Grade 12 entrance model exams",
    "desc": "Practice exams from different schools to prepare for the entrance exam. Opens an external website.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Practice",
    "year": "",
    "url": "https://kehulum.com/ethio-exam/entrance-model-exams"
  },
  {
    "title": "Grade 12 national exam information (Ministry of Education)",
    "desc": "Official exam schedules, model exam dates and instructions for the Grade 12 national exam.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Reference",
    "year": "",
    "url": "https://examinfo.moe.gov.et/"
  },
  {
    "title": "Grade 12 textbooks, new and old curriculum",
    "desc": "Student textbooks and teacher's guides to download. Opens an external website.",
    "subject": "All subjects",
    "stream": "both",
    "type": "Textbook",
    "year": "",
    "url": "https://kehulum.com/textbook/grade-12"
  }
];
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Aptitude","Geography","History","Economics","Civics"];
const STREAMS = ['natural', 'social', 'both'];
const GRADES = ['9', '10', '11', '12', 'all'];
const TYPES = ['Past exam', 'Textbook', 'Practice', 'Video', 'Reference', 'Notes'];
const NEWS_TAGS = ['General', 'Exam date', 'Registration', 'Rules', 'Results', 'Study tip'];
/* Student stories: true = a story is visible to all students as soon as it is sent (staff can still hide or delete it in admin.html) */
const AUTO_PUBLISH_STORIES = true;

const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'school.db'));
db.exec('PRAGMA journal_mode = WAL');
const DDL = {
  portal_news: `CREATE TABLE IF NOT EXISTS portal_news(
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, tag TEXT NOT NULL DEFAULT 'General', date TEXT NOT NULL,
    pinned INTEGER DEFAULT 0, published INTEGER DEFAULT 1, author_id INTEGER, author TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
  portal_resources: `CREATE TABLE IF NOT EXISTS portal_resources(
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '', subject TEXT NOT NULL, stream TEXT NOT NULL DEFAULT 'both',
    type TEXT NOT NULL, year TEXT DEFAULT '', url TEXT DEFAULT '', file_stored TEXT DEFAULT '', file_name TEXT DEFAULT '', file_size INTEGER DEFAULT 0,
    grade TEXT NOT NULL DEFAULT '12',
    published INTEGER DEFAULT 1, author_id INTEGER, author TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
  portal_stories: `CREATE TABLE IF NOT EXISTS portal_stories(
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT DEFAULT '', subject TEXT NOT NULL, title TEXT NOT NULL, text TEXT NOT NULL,
    date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`
};
Object.values(DDL).forEach(sql => db.exec(sql));

/* Older versions of these tables may already exist in school.db with fewer columns. Add what is missing so nothing crashes. */
function migrate(table, required, optional) {
  const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
  if (required.some(c => !have.has(c))) {                       // too different to repair: keep the old table under another name and start a fresh one
    db.exec(`DROP TABLE IF EXISTS ${table}_old`); db.exec(`ALTER TABLE ${table} RENAME TO ${table}_old`); db.exec(DDL[table]);
    return;
  }
  for (const [col, def] of Object.entries(optional)) if (!have.has(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
migrate('portal_news', ['title', 'body', 'date'], {tag: "TEXT NOT NULL DEFAULT 'General'", pinned: 'INTEGER DEFAULT 0', published: 'INTEGER DEFAULT 1', author_id: 'INTEGER', author: 'TEXT', created_at: 'TEXT'});
migrate('portal_resources', ['title', 'subject', 'type'], {description: "TEXT DEFAULT ''", stream: "TEXT NOT NULL DEFAULT 'both'", year: "TEXT DEFAULT ''", url: "TEXT DEFAULT ''",
  file_stored: "TEXT DEFAULT ''", file_name: "TEXT DEFAULT ''", file_size: 'INTEGER DEFAULT 0', grade: "TEXT NOT NULL DEFAULT '12'", published: 'INTEGER DEFAULT 1', author_id: 'INTEGER', author: 'TEXT', created_at: 'TEXT'});
migrate('portal_stories', ['subject', 'title', 'text', 'date'], {name: "TEXT DEFAULT ''", status: "TEXT NOT NULL DEFAULT 'approved'", created_at: 'TEXT'});


/* One-time starter list of past entrance exams (external links). Staff can edit or delete them in admin.html. */
db.exec('CREATE TABLE IF NOT EXISTS portal_meta(key TEXT PRIMARY KEY, value TEXT)');
if (!db.prepare("SELECT 1 FROM portal_meta WHERE key = 'seed_sources_v1'").get()) {
  const ins = db.prepare("INSERT INTO portal_resources(title, description, subject, stream, type, year, url, published, author) VALUES (?,?,?,?,?,?,?,1,'Starter list')");
  [...STARTER_SOURCES].reverse().forEach(s => ins.run(s.title, s.desc, s.subject, s.stream, s.type, s.year, s.url));
  db.prepare("INSERT INTO portal_meta(key, value) VALUES ('seed_sources_v1', '1')").run();
}

db.exec(`CREATE TABLE IF NOT EXISTS discuss_teachers(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT DEFAULT '', subject TEXT NOT NULL, hash TEXT NOT NULL, version INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

const UPLOADS = path.join(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'), 'portal');
fs.mkdirSync(UPLOADS, {recursive: true});
const rmFile = name => { if (name) fs.unlink(path.join(UPLOADS, path.basename(name)), () => {}); };

const router = express.Router();
router.use(express.json({limit: '50kb'}));

/* ---------- helpers ---------- */
const clean = (v, max) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const httpUrl = u => { try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch (e) { return false; } };
const bad = (res, msg) => res.status(400).json({error: msg});
const buckets = new Map();                                    // tiny in-memory rate limit
function limited(key, max, windowMs) {
  const now = Date.now(), list = (buckets.get(key) || []).filter(t => now - t < windowMs);
  list.push(now); buckets.set(key, list); return list.length > max;
}

/* Staff check: asks your own /api/me route who the logged-in person is, so it uses exactly the same login as admin.html. */
async function staff(req, res, next) {
  try {
    const auth = req.get('authorization');
    if (!auth) return res.status(401).json({error: 'Please log in.'});
    const port = req.socket.localPort;
    let r = null;
    for (const host of ['127.0.0.1', 'localhost']) {
      try { r = await fetch(`http://${host}:${port}/api/me`, {headers: {Authorization: auth}}); break; } catch (e) { /* try next */ }
    }
    if (!r) return res.status(500).json({error: 'Could not check your login.'});
    if (!r.ok) return res.status(401).json({error: 'Please log in again.'});
    const u = await r.json().catch(() => null);
    if (!u || !['admin', 'publisher'].includes(u.role)) return res.status(403).json({error: 'You are not allowed to do this.'});
    req.user = {...u, id: u.id ?? u.user_id ?? u.userId ?? null};        // some logins have no id: use null instead of undefined
    next();
  } catch (e) { next(e); }
}
const canEdit = (u, row) => u.role === 'admin' || (u.id != null && row.author_id === u.id);
const name = u => String(u.full_name || u.username || '');

/* ================= PUBLIC (students) ================= */
router.get('/news', (req, res) => {
  const rows = db.prepare(`SELECT id, title, body, tag, date, pinned FROM portal_news WHERE published = 1 ORDER BY pinned DESC, date DESC, id DESC LIMIT 200`).all();
  res.json(rows.map(r => ({...r, pinned: !!r.pinned})));
});

router.get('/resources', (req, res) => {
  const rows = db.prepare(`SELECT * FROM portal_resources WHERE published = 1 AND grade IN ('12','all') AND (url <> '' OR file_stored <> '') ORDER BY id DESC LIMIT 500`).all();
  res.json(rows.map(r => ({id: r.id, title: r.title, desc: r.description, subject: r.subject, stream: r.stream, type: r.type, year: r.year,
    isFile: !!r.file_stored, size: r.file_size, url: r.file_stored ? `/api/portal/files/${r.id}` : r.url})));
});

router.get('/files/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM portal_resources WHERE id = ? AND published = 1').get(req.params.id);
  if (!r || !r.file_stored) return res.status(404).end();
  const fp = path.join(UPLOADS, path.basename(r.file_stored));
  if (!fs.existsSync(fp)) return res.status(404).end();
  const fname = r.file_name || 'file.pdf';
  res.removeHeader('Content-Security-Policy');           // lets the browser's PDF viewer open the file
  res.set({'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=600',
    'Content-Disposition': `${req.query.download ? 'attachment' : 'inline'}; filename="${fname.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(fname)}`});
  fs.createReadStream(fp).pipe(res);
});

/* ================= STAFF: exam news ================= */
function readNews(b) {
  const title = clean(b.title, 150), body = clean(b.body, 5000), date = clean(b.date, 10);
  if (title.length < 3 || body.length < 3) return {error: 'Please fill in the title and the message.'};
  if (!isDate(date)) return {error: 'Please choose a date.'};
  return {v: {title, body, date, tag: NEWS_TAGS.includes(b.tag) ? b.tag : 'General', pinned: b.pinned ? 1 : 0, published: b.published ? 1 : 0}};
}
router.get('/admin/news', staff, (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_news ORDER BY date DESC, id DESC LIMIT 300').all().map(r => ({...r, pinned: !!r.pinned, published: !!r.published})));
});
router.post('/admin/news', staff, (req, res) => {
  const {v, error} = readNews(req.body); if (error) return bad(res, error);
  const info = db.prepare('INSERT INTO portal_news(title, body, tag, date, pinned, published, author_id, author) VALUES (?,?,?,?,?,?,?,?)')
    .run(v.title, v.body, v.tag, v.date, v.pinned, v.published, req.user.id, name(req.user));
  res.status(201).json({id: Number(info.lastInsertRowid)});
});
router.put('/admin/news/:id', staff, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_news WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Not found.'});
  if (!canEdit(req.user, row)) return res.status(403).json({error: 'You can only edit your own news.'});
  const {v, error} = readNews(req.body); if (error) return bad(res, error);
  db.prepare('UPDATE portal_news SET title=?, body=?, tag=?, date=?, pinned=?, published=? WHERE id=?').run(v.title, v.body, v.tag, v.date, v.pinned, v.published, row.id);
  res.json({ok: true});
});
router.delete('/admin/news/:id', staff, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_news WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Not found.'});
  if (!canEdit(req.user, row)) return res.status(403).json({error: 'You can only delete your own news.'});
  db.prepare('DELETE FROM portal_news WHERE id = ?').run(row.id); res.json({ok: true});
});

/* ================= STAFF: question sources ================= */
function readRes(b) {
  const title = clean(b.title, 150), description = clean(b.description, 500), year = clean(b.year, 20);
  const grade = String(b.grade ?? '12');
  if (title.length < 3) return {error: 'Please write a title.'};
  if (!['All subjects', ...SUBJECTS].includes(b.subject)) return {error: 'Choose a subject.'};
  if (!STREAMS.includes(b.stream)) return {error: 'Choose a stream.'};
  if (!TYPES.includes(b.type)) return {error: 'Choose a type.'};
  if (!GRADES.includes(grade)) return {error: 'Choose a grade.'};
  const kind = b.kind === 'link' ? 'link' : 'file';
  let url = '';
  if (kind === 'link') { url = clean(b.url, 500); if (!httpUrl(url)) return {error: 'Please enter a full link that starts with https://'}; }
  return {v: {title, description, year, subject: b.subject, stream: b.stream, type: b.type, grade, kind, url, published: b.published ? 1 : 0}};
}
router.get('/admin/resources', staff, (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_resources ORDER BY id DESC LIMIT 500').all().map(r => ({
    id: r.id, title: r.title, description: r.description, subject: r.subject, stream: r.stream, type: r.type, year: r.year, url: r.url,
    grade: r.grade || '12',
    file_name: r.file_stored ? r.file_name : '', file_size: r.file_stored ? r.file_size : 0, published: !!r.published, author: r.author, author_id: r.author_id})));
});
router.post('/admin/resources', staff, (req, res) => {
  const {v, error} = readRes(req.body); if (error) return bad(res, error);
  const info = db.prepare('INSERT INTO portal_resources(title, description, subject, stream, type, year, url, published, author_id, author, grade) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(v.title, v.description, v.subject, v.stream, v.type, v.year, v.url, v.published, req.user.id, name(req.user), v.grade);
  res.status(201).json({id: Number(info.lastInsertRowid)});
});
router.put('/admin/resources/:id', staff, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_resources WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Not found.'});
  if (!canEdit(req.user, row)) return res.status(403).json({error: 'You can only edit your own sources.'});
  const {v, error} = readRes(req.body); if (error) return bad(res, error);
  db.prepare('UPDATE portal_resources SET title=?, description=?, subject=?, stream=?, type=?, year=?, url=?, published=?, grade=? WHERE id=?')
    .run(v.title, v.description, v.subject, v.stream, v.type, v.year, v.url, v.published, v.grade, row.id);
  if (v.kind === 'link' && row.file_stored) {                              // switched from a PDF to a link
    rmFile(row.file_stored); db.prepare("UPDATE portal_resources SET file_stored='', file_name='', file_size=0 WHERE id=?").run(row.id);
  }
  res.json({ok: true});
});
router.delete('/admin/resources/:id', staff, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_resources WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Not found.'});
  if (!canEdit(req.user, row)) return res.status(403).json({error: 'You can only delete your own sources.'});
  rmFile(row.file_stored); db.prepare('DELETE FROM portal_resources WHERE id = ?').run(row.id); res.json({ok: true});
});
/* PDF upload: the browser sends the raw file with  Content-Type: application/pdf  (25 MB max) */
router.post('/admin/resources/:id/file', staff, express.raw({type: 'application/pdf', limit: '30mb'}), (req, res) => {
  const row = db.prepare('SELECT * FROM portal_resources WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Not found.'});
  if (!canEdit(req.user, row)) return res.status(403).json({error: 'You can only change your own sources.'});
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length < 5 || buf.subarray(0, 5).toString('latin1') !== '%PDF-') return bad(res, 'Only PDF files are allowed.');
  if (buf.length > 25 * 1024 * 1024) return res.status(413).json({error: 'File is too large (25 MB max).'});
  let shown = 'file.pdf';
  try { shown = decodeURIComponent(req.get('x-file-name') || shown); } catch (e) { /* keep default */ }
  shown = clean(shown, 120).replace(/[^\w .()\-\u1200-\u137F]/g, '_') || 'file.pdf';
  const stored = crypto.randomUUID() + '.pdf';
  fs.writeFileSync(path.join(UPLOADS, stored), buf);
  rmFile(row.file_stored);
  db.prepare("UPDATE portal_resources SET file_stored=?, file_name=?, file_size=?, url='' WHERE id=?").run(stored, shown, buf.length, row.id);
  res.json({ok: true});
});


/* ================= STUDENT STORIES ================= */
router.get('/stories', (req, res) => {
  res.json(db.prepare(`SELECT id, name, subject, title, text, date FROM portal_stories WHERE status = 'approved' ORDER BY date DESC, id DESC LIMIT 200`).all());
});
router.post('/stories', (req, res) => {
  if (req.body.website) return res.status(201).json({ok: true, status: 'pending'});        // hidden field that only bots fill in
  if (limited('story:' + req.ip, 3, 10 * 60 * 1000)) return res.status(429).json({error: 'Please wait a few minutes before sharing another story.'});
  const name = clean(req.body.name, 40), title = clean(req.body.title, 80), text = clean(req.body.text, 800);
  const subject = ['General', ...SUBJECTS].includes(req.body.subject) ? req.body.subject : 'General';
  if (title.length < 3 || text.length < 10) return bad(res, 'Please write a title and a few sentences.');
  const status = AUTO_PUBLISH_STORIES ? 'approved' : 'pending';
  db.prepare('INSERT INTO portal_stories(name, subject, title, text, date, status) VALUES (?,?,?,?,?,?)')
    .run(name, subject, title, text, new Date().toISOString().slice(0, 10), status);
  res.status(201).json({ok: true, status});
});
router.get('/admin/stories', staff, (req, res) => {
  res.json(db.prepare(`SELECT * FROM portal_stories ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, id DESC LIMIT 300`).all());
});
router.put('/admin/stories/:id', staff, (req, res) => {
  if (!['approved', 'hidden', 'pending'].includes(req.body.status)) return bad(res, 'Choose approve or hide.');
  const info = db.prepare('UPDATE portal_stories SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  if (!info.changes) return res.status(404).json({error: 'Not found.'});
  res.json({ok: true});
});
router.delete('/admin/stories/:id', staff, (req, res) => {
  db.prepare('DELETE FROM portal_stories WHERE id = ?').run(req.params.id); res.json({ok: true});
});


/* ================= ADMIN ONLY: teachers for the discussion board (one account per teacher, tied to a subject) ================= */
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({error: 'Only an administrator can change this.'});
const hashPw = pw => { const salt = crypto.randomBytes(16); return salt.toString('hex') + ':' + crypto.scryptSync(pw, salt, 32).toString('hex'); };
router.get('/admin/teachers', staff, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT id, name, subject, created_at FROM discuss_teachers ORDER BY subject, name').all());
});
router.post('/admin/teachers', staff, adminOnly, (req, res) => {
  const name = clean(req.body.name, 60), pw = String(req.body.password ?? '').trim().slice(0, 100);
  if (!SUBJECTS.includes(req.body.subject)) return bad(res, "Choose the teacher's subject.");
  if (pw.length < 8) return bad(res, 'Please use a password of at least 8 characters.');
  const info = db.prepare('INSERT INTO discuss_teachers(name, subject, hash) VALUES (?,?,?)').run(name, req.body.subject, hashPw(pw));
  res.status(201).json({id: Number(info.lastInsertRowid)});
});
router.put('/admin/teachers/:id', staff, adminOnly, (req, res) => {
  const t = db.prepare('SELECT * FROM discuss_teachers WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({error: 'Teacher not found.'});
  const name = req.body.name === undefined ? t.name : clean(req.body.name, 60);
  const subject = req.body.subject === undefined ? t.subject : req.body.subject;
  if (!SUBJECTS.includes(subject)) return bad(res, "Choose the teacher's subject.");
  let hash = t.hash, version = t.version;
  if (req.body.password !== undefined) {                          // a new password also logs the teacher out everywhere
    const pw = String(req.body.password).trim().slice(0, 100);
    if (pw.length < 8) return bad(res, 'Please use a password of at least 8 characters.');
    hash = hashPw(pw); version = t.version + 1;
  }
  db.prepare('UPDATE discuss_teachers SET name = ?, subject = ?, hash = ?, version = ? WHERE id = ?').run(name, subject, hash, version, t.id);
  res.json({ok: true});
});
router.delete('/admin/teachers/:id', staff, adminOnly, (req, res) => {
  db.prepare('DELETE FROM discuss_teachers WHERE id = ?').run(req.params.id); res.json({ok: true});
});

router.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({error: 'File is too large (25 MB max).'});
  console.error(err);
  res.status(500).json({error: req.user ? 'Server error: ' + (err && err.message ? err.message : 'unknown') : 'Server error. Please try again.'});
});
module.exports = router;
