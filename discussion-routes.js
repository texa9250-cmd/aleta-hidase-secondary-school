/* Discussion board API for the school server.
   Uses the same school.db file. Uses Node's built-in node:sqlite (no extra install).
   In server.js add:   app.use('/api/discuss', require('./discussion-routes'));
  In .env add:        TEACHER_MATHEMATICS=choose-a-long-secret-code     */
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Aptitude","Geography","History","Economics","Civics"];
const LEVELS = ["foundation","growth","excellence"];

const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'school.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS discuss_questions(
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, subject TEXT NOT NULL, level TEXT NOT NULL,
  name TEXT, anon INTEGER DEFAULT 0, reports INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS discuss_answers(
  id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER NOT NULL REFERENCES discuss_questions(id) ON DELETE CASCADE,
  body TEXT NOT NULL, name TEXT, is_teacher INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, votes INTEGER DEFAULT 0,
  reports INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);

db.exec(`CREATE TABLE IF NOT EXISTS discuss_settings(key TEXT PRIMARY KEY, value TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS discuss_teachers(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT DEFAULT '', subject TEXT NOT NULL, hash TEXT NOT NULL,
  version INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

/* migrations: owner token for students, media for teacher answers */
function addColumn(table, column, type) {
  const has = db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
  if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}
addColumn('discuss_questions', 'owner_hash', 'TEXT');
addColumn('discuss_answers', 'media_url', 'TEXT');
addColumn('discuss_answers', 'media_type', 'TEXT');

const MEDIA_DIR = path.join(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'), 'discuss');
fs.mkdirSync(MEDIA_DIR, {recursive: true});
const MEDIA_TYPES = {'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav',
  'audio/x-m4a':'m4a','audio/m4a':'m4a','audio/mp3':'mp3','audio/aac':'aac','audio/3gpp':'3gp'};

const router = express.Router();
router.use(express.json({limit: '20kb'}));

/* ---- helpers ---- */
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const teacherEnvKey = subject => `TEACHER_${subject.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
const fails = new Map();                                    // stop people guessing the code: 10 wrong tries per 15 minutes
function getTeacherSubject(req) {
  const given = String(req.get('x-teacher-code') || '').trim();
  if (!given) return null;
  const now = Date.now(), failure = fails.get(req.ip);
  if (failure && failure.until > now && failure.count >= 10) return null;
  for (const subject of SUBJECTS) {
    const expected = String(process.env[teacherEnvKey(subject)] || '').trim();
    if (!expected) continue;
    const a = sha(given), b = sha(expected);
    if (crypto.timingSafeEqual(a, b)) { fails.delete(req.ip); return subject; }
  }
  const teacherRows = db.prepare('SELECT subject, hash FROM discuss_teachers ORDER BY id').all();
  const matchedSubjects = new Set();
  for (const teacher of teacherRows) {
    if (!SUBJECTS.includes(teacher.subject)) continue;
    const [saltHex, hashHex, ...extra] = String(teacher.hash || '').split(':');
    if (extra.length || !/^[a-f0-9]{32}$/i.test(saltHex || '') || !/^[a-f0-9]{64}$/i.test(hashHex || '')) continue;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(given, Buffer.from(saltHex, 'hex'), expected.length);
    if (crypto.timingSafeEqual(actual, expected)) matchedSubjects.add(teacher.subject);
  }
  if (matchedSubjects.size === 1) {
    fails.delete(req.ip);
    return matchedSubjects.values().next().value;
  }
  const current = failure && failure.until > now ? failure : {count: 0, until: now + 15 * 60 * 1000};
  current.count++;
  fails.set(req.ip, current);
  return null;
}
const hasTeacherCode = req => Boolean(String(req.get('x-teacher-code') || '').trim());
const teacherAuthError = (res, status = 401) => res.status(status).json({error: status === 401 ? 'Teacher code is not correct.' : 'This code is only authorized for its assigned subject.'});
function requireSubjectTeacher(subjectFor) {
  return (req, res, next) => {
    const subject = subjectFor(req);
    if (!subject) return res.status(404).json({error: 'Question or answer not found.'});
    const teacher = getTeacherSubject(req);
    if (!teacher) return teacherAuthError(res);
    if (teacher !== subject) return teacherAuthError(res, 403);
    next();
  };
}
const needQuestionTeacher = requireSubjectTeacher(req => db.prepare('SELECT subject FROM discuss_questions WHERE id = ?').get(req.params.id)?.subject);
const needAnswerTeacher = requireSubjectTeacher(req => db.prepare(`SELECT q.subject FROM discuss_answers a
  JOIN discuss_questions q ON q.id = a.question_id WHERE a.id = ?`).get(req.params.id)?.subject);
const hits = new Map();                                   // very small rate limit: 12 posts per minute per address
function tooMany(req) {
  const now = Date.now(), list = (hits.get(req.ip) || []).filter(t => now - t < 60000);
  list.push(now); hits.set(req.ip, list); return list.length > 12;
}
const clean = (v, max) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const bad = (res, msg) => res.status(400).json({error: msg});

/* ---- teacher check ---- */
router.get('/teacher/check', (req, res) => {
  const now = Date.now();
  const subject = getTeacherSubject(req);
  if (subject) { fails.delete(req.ip); return res.json({ok: true, subject}); }
  const failure = fails.get(req.ip);
  if (failure && failure.until > now && failure.count >= 10)
    return res.status(429).json({error: 'Too many tries. Please wait a few minutes.'});
  res.status(401).json({error: 'Teacher code is not correct.'});
});

/* ---- questions ---- */
router.get('/questions', (req, res) => {
  const teacher = getTeacherSubject(req);
  if (hasTeacherCode(req) && !teacher) return teacherAuthError(res);
  const requestedSubject = SUBJECTS.includes(req.query.subject) ? req.query.subject : '';
  const subject = teacher || requestedSubject;
  const level = LEVELS.includes(req.query.level) ? req.query.level : '';
  const T = Boolean(teacher);
  const rows = db.prepare(`
    SELECT q.*, (SELECT COUNT(*) FROM discuss_answers a WHERE a.question_id = q.id) AS answers,
           (SELECT COUNT(*) FROM discuss_answers a WHERE a.question_id = q.id AND a.verified = 1) AS solved
    FROM discuss_questions q WHERE (? = '' OR q.subject = ?) AND (? = '' OR q.level = ?) ORDER BY q.id DESC LIMIT 100`)
    .all(subject, subject, level, level);
  res.json(rows.map(q => ({id: q.id, title: q.title, body: q.body, subject: q.subject, level: q.level,
    author: q.anon ? 'Anonymous' : (q.name || 'Student'), createdAt: q.created_at, answers: q.answers, solved: q.solved > 0,
    ...(T && q.subject === teacher ? {reports: q.reports} : {})})));
});

router.post('/questions', (req, res) => {
  if (tooMany(req)) return res.status(429).json({error: 'Please wait a minute before posting again.'});
  const title = clean(req.body.title, 120), body = clean(req.body.body, 2000), name = clean(req.body.name, 40);
  if (title.length < 5 || body.length < 10) return bad(res, 'Please write a clear title and some detail.');
  if (!SUBJECTS.includes(req.body.subject) || !LEVELS.includes(req.body.level)) return bad(res, 'Choose a subject and a path.');
  const teacher = getTeacherSubject(req);
  if (hasTeacherCode(req) && !teacher) return teacherAuthError(res);
  if (teacher && teacher !== req.body.subject) return teacherAuthError(res, 403);
  const deleteToken = crypto.randomBytes(24).toString('hex');   // the browser keeps this so the student can delete their own question
  const info = db.prepare('INSERT INTO discuss_questions(title, body, subject, level, name, anon, owner_hash) VALUES (?,?,?,?,?,?,?)')
    .run(title, body, req.body.subject, req.body.level, name, req.body.anon ? 1 : 0, sha(deleteToken).toString('hex'));
  res.status(201).json({id: Number(info.lastInsertRowid), deleteToken});
});

router.get('/questions/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM discuss_questions WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({error: 'Question not found.'});
  const teacher = getTeacherSubject(req);
  if (hasTeacherCode(req) && !teacher) return teacherAuthError(res);
  if (teacher && teacher !== q.subject) return teacherAuthError(res, 403);
  const T = teacher === q.subject;
  const answers = db.prepare('SELECT * FROM discuss_answers WHERE question_id = ? ORDER BY verified DESC, is_teacher DESC, votes DESC, id').all(q.id);
  res.json({id: q.id, title: q.title, body: q.body, subject: q.subject, level: q.level, author: q.anon ? 'Anonymous' : (q.name || 'Student'),
    createdAt: q.created_at, ...(T && q.anon ? {realName: q.name || '(no name given)'} : {}),
    answerList: answers.map(a => ({id: a.id, body: a.body, author: a.is_teacher ? (a.name || 'Teacher') : (a.name || 'Student'),
      isTeacher: !!a.is_teacher, verified: !!a.verified, votes: a.votes, mediaUrl: a.media_url || null, mediaType: a.media_type || null, createdAt: a.created_at}))});
});

router.post('/questions/:id/answers', (req, res) => {
  if (tooMany(req)) return res.status(429).json({error: 'Please wait a minute before posting again.'});
  const body = clean(req.body.body, 2000), name = clean(req.body.name, 40);
  if (body.length < 2 && !req.body.mediaUrl) return bad(res, 'Please write your answer.');
  const question = db.prepare('SELECT subject FROM discuss_questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({error: 'Question not found.'});
  const teacher = getTeacherSubject(req);
  if (hasTeacherCode(req) && !teacher) return teacherAuthError(res);
  if (teacher && teacher !== question.subject) return teacherAuthError(res, 403);
  let mediaUrl = null, mediaType = null;
  if (req.body.mediaUrl) {                                   // photos / voice: teachers only
    if (!teacher) return teacherAuthError(res);
    const m = /^\/api\/discuss\/media\/([a-f0-9]{32}\.(webm|ogg|m4a|mp3|wav|aac|3gp))$/.exec(String(req.body.mediaUrl));
    if (!m || !fs.existsSync(path.join(MEDIA_DIR, m[1]))) return bad(res, 'Attachment not found. Please upload it again.');
    mediaUrl = m[0]; mediaType = 'audio';
  }
  try {
    db.prepare('INSERT INTO discuss_answers(question_id, body, name, is_teacher, media_url, media_type) VALUES (?,?,?,?,?,?)')
      .run(Number(req.params.id), body, name, teacher === question.subject ? 1 : 0, mediaUrl, mediaType);
  } catch (e) {
    console.error('could not save answer:', e);
    return res.status(500).json({error: 'The server could not save the answer. Restart the server so it can update the database.'});
  }
  res.status(201).json({ok: true});
});

/* ---- teacher photo / voice upload ---- */
router.use('/media', express.static(MEDIA_DIR, {index: false, dotfiles: 'deny', maxAge: '7d',
  setHeaders: r => r.setHeader('X-Content-Type-Options', 'nosniff')}));
router.post('/media', express.raw({type: () => true, limit: '8mb'}), (req, res) => {
  if (tooMany(req)) return res.status(429).json({error: 'Please wait a minute before uploading again.'});
  if (!getTeacherSubject(req)) return teacherAuthError(res);
  const type = String(req.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = MEDIA_TYPES[type];
  if (!ext) return bad(res, 'Only voice recordings are allowed (webm, ogg, m4a, mp3, wav).');
  if (!Buffer.isBuffer(req.body) || req.body.length < 100) return bad(res, 'The file is empty.');
  const file = crypto.randomBytes(16).toString('hex') + '.' + ext;
  try { fs.mkdirSync(MEDIA_DIR, {recursive: true}); fs.writeFileSync(path.join(MEDIA_DIR, file), req.body); }
  catch (e) { console.error('voice upload failed:', e); return res.status(500).json({error: 'The server cannot save files. Check write permission for the uploads folder.'}); }
  res.status(201).json({url: '/api/discuss/media/' + file, type: 'audio'});
});

/* ---- votes and reports (anyone) ---- */
router.post('/answers/:id/vote', (req, res) => { db.prepare('UPDATE discuss_answers SET votes = votes + 1 WHERE id = ?').run(req.params.id); res.json({ok: true}); });
router.post('/questions/:id/report', (req, res) => { db.prepare('UPDATE discuss_questions SET reports = reports + 1 WHERE id = ?').run(req.params.id); res.json({ok: true}); });
router.post('/answers/:id/report', (req, res) => { db.prepare('UPDATE discuss_answers SET reports = reports + 1 WHERE id = ?').run(req.params.id); res.json({ok: true}); });

/* ---- teacher only ---- */
router.post('/answers/:id/verify', needAnswerTeacher, (req, res) => {
  db.prepare('UPDATE discuss_answers SET verified = 1 - verified WHERE id = ?').run(req.params.id); res.json({ok: true});
});
router.delete('/answers/:id', needAnswerTeacher, (req, res) => { db.prepare('DELETE FROM discuss_answers WHERE id = ?').run(req.params.id); res.json({ok: true}); });
/* a student who posted the question (has its token) or the subject's teacher can delete it */
router.delete('/questions/:id', (req, res, next) => {
  const q = db.prepare('SELECT owner_hash FROM discuss_questions WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({error: 'Question or answer not found.'});
  const token = String(req.get('x-owner-token') || '').trim();
  if (token && q.owner_hash) {
    const a = sha(token), b = Buffer.from(q.owner_hash, 'hex');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      db.prepare('DELETE FROM discuss_questions WHERE id = ?').run(req.params.id);
      return res.json({ok: true});
    }
  }
  if (!hasTeacherCode(req)) return res.status(403).json({error: 'You can only delete questions you posted.'});
  needQuestionTeacher(req, res, () => { db.prepare('DELETE FROM discuss_questions WHERE id = ?').run(req.params.id); res.json({ok: true}); });
});

/* ---- health check ---- */
router.get('/health', (req, res) => {
  const q = db.prepare('SELECT COUNT(*) AS c FROM discuss_questions').get().c;
  const a = db.prepare('SELECT COUNT(*) AS c FROM discuss_answers').get().c;
  res.json({ ok: true, questions: q, answers: a });
});

router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

module.exports = router;
