try { process.loadEnvFile(); } catch {} // loads .env if present; host-panel variables also work
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || (
  console.warn('WARNING: JWT_SECRET is not set. Using a temporary one; everyone is logged out on restart.'),
  crypto.randomBytes(32).toString('hex')
);

const CATEGORIES = ['Academic', 'Events', 'Sports', 'General'];
const ROLES = ['admin', 'publisher'];
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Aptitude','Geography','History','Economics','Civics','Information Technology'];
const GRADES = ['9','10','11','12','all'];
const NEWS_TAGS = ['General','Exam date','Registration','Rules','Results','Study tip'];
const SRC_TYPES = ['Past exam','Textbook','Practice','Video','Reference','Notes'];
const STREAMS = ['natural','social','both'];
const bool = r => ({ ...r, pinned: !!r.pinned, published: !!r.published });

/* ---------- Database ---------- */
const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'school.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','publisher')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

const announcementColumns = new Set(
  db.prepare('PRAGMA table_info(announcements)').all().map(column => column.name)
);
if (!announcementColumns.has('title_am')) db.exec("ALTER TABLE announcements ADD COLUMN title_am TEXT NOT NULL DEFAULT ''");
if (!announcementColumns.has('body_am')) db.exec("ALTER TABLE announcements ADD COLUMN body_am TEXT NOT NULL DEFAULT ''");

if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  const u = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const p = process.env.ADMIN_PASSWORD || '';
  if (!u || p.length < 10) {
    console.error('\n❌ ERROR: First run requires an admin account.');
    console.error('Please create a .env file with ADMIN_USERNAME and ADMIN_PASSWORD (at least 10 chars).\n');
    process.exit(1);
  }
  db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)')
    .run(u, bcrypt.hashSync(p, 12), 'Administrator', 'admin');
  console.log(`✅ Created first admin account "${u}".`);
}

/* ---------- App setup ---------- */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
    'Access-Control-Expose-Headers': '*',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api', (req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
});

app.use(express.json({ limit: '50kb' }));

app.use('/api/portal', require('./portal-routes'));
app.use('/api/discuss', require('./discussion-routes'));
app.use('/api/campus', require('./facilities-routes'));

/* ---------- Helpers ---------- */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const attempts = new Map();
const tutorAttempts = new Map();

function tutorLimited(ip) {
  const now = Date.now();
  const attempt = tutorAttempts.get(ip);
  if (!attempt || attempt.resetAt <= now) {
    tutorAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    if (attempt.count >= 30) return true;
    attempt.count += 1;
  }
  if (tutorAttempts.size > 1000) {
    for (const [address, entry] of tutorAttempts) {
      if (entry.resetAt <= now) tutorAttempts.delete(address);
    }
  }
  return false;
}

function loginLimited(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.resetAt < now) { attempts.set(ip, { count: 0, resetAt: now + 15 * 60 * 1000 }); return false; }
  return a.count >= 10;
}

function auth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('Authorization') || '');
  if (!m) return res.status(401).json({ error: 'Please log in.' });
  try {
    const { id } = jwt.verify(m[1], SECRET);
    const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(id);
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only.' });

function cleanAnnouncement(b) {
  const title = String(b.title ?? '').trim();
  const titleAm = String(b.title_am ?? '').trim();
  const body = String(b.body ?? '').trim();
  const bodyAm = String(b.body_am ?? '').trim();
  const category = String(b.category ?? '');
  const date = String(b.date ?? '');
  if (!title || title.length > 120) return { error: 'Title is required (max 120 characters).' };
  if (titleAm.length > 120) return { error: 'Amharic title must be at most 120 characters.' };
  if (!body || body.length > 5000) return { error: 'Message is required (max 5000 characters).' };
  if (bodyAm.length > 5000) return { error: 'Amharic message must be at most 5000 characters.' };
  if (!CATEGORIES.includes(category)) return { error: 'Choose a valid category.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Choose a valid date.' };
  return { value: { title, titleAm, body, bodyAm, category, date, pinned: b.pinned ? 1 : 0, published: b.published === false ? 0 : 1 } };
}

const canEdit = (user, row) => user.role === 'admin' || row.author_id === user.id;
const validPassword = p => typeof p === 'string' && p.length >= 10 && p.length <= 200;

/* ---------- Public API ---------- */
app.get('/api/announcements', (req, res) => {
  const rows = db.prepare(
    'SELECT id, title, title_am, body, body_am, category, date, pinned FROM announcements WHERE published = 1 ORDER BY date DESC, id DESC'
  ).all();
  res.json(rows.map(r => ({ ...r, pinned: !!r.pinned })));
});

app.get('/api/health', (req, res) => {
  let tables = [];
  try { tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name); } catch {}
  res.json({
    ok: true,
    now: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    node_version: process.version,
    db_file: process.env.DB_FILE || 'school.db',
    tables
  });
});

/* ---------- Login ---------- */
app.post('/api/login', (req, res) => {
  const ip = req.ip;
  if (loginLimited(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const username = String(req.body.username ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    attempts.get(ip).count++;
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  attempts.delete(ip);
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
});

app.get('/api/me', auth, (req, res) => res.json(req.user));

app.patch('/api/me/password', auth, (req, res) => {
  const { current, next } = req.body;
  if (!validPassword(next)) return res.status(400).json({ error: 'New password must be at least 10 characters.' });
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(String(current ?? ''), row.password_hash))
    return res.status(400).json({ error: 'Current password is wrong.' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 12), req.user.id);
  res.json({ ok: true });
});

/* ---------- Staff: manage announcements ---------- */
app.get('/api/admin/announcements', auth, (req, res) => {
  const base = `SELECT a.*, u.full_name AS author FROM announcements a LEFT JOIN users u ON u.id = a.author_id`;
  const rows = req.user.role === 'admin'
    ? db.prepare(base + ' ORDER BY a.date DESC, a.id DESC').all()
    : db.prepare(base + ' WHERE a.author_id = ? ORDER BY a.date DESC, a.id DESC').all(req.user.id);
  res.json(rows.map(r => ({ ...r, pinned: !!r.pinned, published: !!r.published })));
});

app.post('/api/admin/announcements', auth, (req, res) => {
  const { value, error } = cleanAnnouncement(req.body);
  if (error) return res.status(400).json({ error });
  const result = tx(() => {
    if (value.pinned) db.prepare('UPDATE announcements SET pinned = 0').run();
    return db.prepare(
      'INSERT INTO announcements (title, title_am, body, body_am, category, date, pinned, published, author_id) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(value.title, value.titleAm, value.body, value.bodyAm, value.category, value.date, value.pinned, value.published, req.user.id);
  });
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.put('/api/admin/announcements/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Announcement not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only edit your own announcements.' });
  const { value, error } = cleanAnnouncement(req.body);
  if (error) return res.status(400).json({ error });
  tx(() => {
    if (value.pinned) db.prepare('UPDATE announcements SET pinned = 0').run();
    db.prepare(
      `UPDATE announcements SET title=?, title_am=?, body=?, body_am=?, category=?, date=?, pinned=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(value.title, value.titleAm, value.body, value.bodyAm, value.category, value.date, value.pinned, value.published, row.id);
  });
  res.json({ ok: true });
});

app.delete('/api/admin/announcements/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Announcement not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only delete your own announcements.' });
  db.prepare('DELETE FROM announcements WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

/* ---------- Admin: manage staff accounts ---------- */
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT id, username, full_name, role FROM users ORDER BY full_name').all());
});

app.post('/api/admin/users', auth, adminOnly, (req, res) => {
  const username = String(req.body.username ?? '').trim().toLowerCase();
  const full_name = String(req.body.full_name ?? '').trim();
  const { password, role } = req.body;
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return res.status(400).json({ error: 'Username: 3-30 letters, numbers, . _ -' });
  if (!full_name || full_name.length > 80) return res.status(400).json({ error: 'Full name is required.' });
  if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 10 characters.' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Choose a valid role.' });
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username))
    return res.status(409).json({ error: 'That username is taken.' });
  const r = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)')
    .run(username, bcrypt.hashSync(password, 12), full_name, role);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

app.put('/api/admin/users/:id/password', auth, adminOnly, (req, res) => {
  if (!validPassword(req.body.password)) return res.status(400).json({ error: 'Password must be at least 10 characters.' });
  const r = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(req.body.password, 12), req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'User not found.' });
});

app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You can't delete your own account." });
  const r = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'User not found.' });
});

/* ---------- Grade 12 portal: uploads & content ---------- */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const CONTENT_UPLOAD_DIR = path.join(UPLOAD_DIR, 'content');
fs.mkdirSync(CONTENT_UPLOAD_DIR, { recursive: true });
console.log(`📁 Upload directory: ${CONTENT_UPLOAD_DIR}`);

const CONTENT_UPLOAD_TYPES = {
  'image/jpeg': { ext: '.jpg', valid: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: '.png', valid: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: '.webp', valid: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  'application/pdf': { ext: '.pdf', valid: b => b.subarray(0, 5).toString('latin1') === '%PDF-' }
};
const CONTENT_TARGET_TYPES = ['achievement-photo', 'achievement-cover', 'topic-file', 'event-image', 'facility-photo', 'hero-slider', 'about-page-image'];
const EVENT_TARGETS = ['term1-registration', 'semester-exams', 'sports-day', 'parents-day', 'grade12-graduation'];

db.exec(`
CREATE TABLE IF NOT EXISTS home_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS topic_card_details (
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  location_text TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(subject, topic)
);
CREATE TABLE IF NOT EXISTS media_library (
  id INTEGER PRIMARY KEY,
  display_title TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_area TEXT NOT NULL DEFAULT 'content',
  mime TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS content_assets (
  id INTEGER PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_key TEXT NOT NULL,
  display_title TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(target_type, target_key)
);
CREATE TABLE IF NOT EXISTS achievement_entries (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL CHECK (group_name IN ('exam','awards','competitions','community')),
  year TEXT NOT NULL,
  name TEXT NOT NULL,
  name_am TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  subtitle_am TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  result_am TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  note_am TEXT NOT NULL DEFAULT '',
  stream TEXT NOT NULL DEFAULT '',
  score INTEGER,
  out_of INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS portal_stories (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

const contentAssetColumns = new Set(db.prepare('PRAGMA table_info(content_assets)').all().map(column => column.name));
if (!contentAssetColumns.has('display_title')) db.exec("ALTER TABLE content_assets ADD COLUMN display_title TEXT NOT NULL DEFAULT ''");
if (!contentAssetColumns.has('media_id')) db.exec('ALTER TABLE content_assets ADD COLUMN media_id INTEGER REFERENCES media_library(id) ON DELETE CASCADE');

const mediaColumns = new Set(db.prepare('PRAGMA table_info(media_library)').all().map(column => column.name));
if (!mediaColumns.has('storage_area')) db.exec("ALTER TABLE media_library ADD COLUMN storage_area TEXT NOT NULL DEFAULT 'content'");

try {
  const migrateContentAssets = db.prepare('SELECT id,display_title,file_name,file_path,mime,file_size,author_id FROM content_assets WHERE media_id IS NULL');
  const createMediaAsset = db.prepare('INSERT INTO media_library(display_title,file_name,file_path,mime,file_size,author_id) VALUES (?,?,?,?,?,?)');
  const connectMediaAsset = db.prepare('UPDATE content_assets SET media_id=? WHERE id=?');
  for (const asset of migrateContentAssets.all()) {
    const media = createMediaAsset.run(asset.display_title, asset.file_name, asset.file_path, asset.mime, asset.file_size, asset.author_id);
    connectMediaAsset.run(Number(media.lastInsertRowid), asset.id);
  }
} catch (e) {
  console.warn('[migration] content_assets migration skipped:', e.message);
}

try {
  const campusPhotoColumns = new Set(db.prepare('PRAGMA table_info(campus_photos)').all().map(column => column.name));
  if (!campusPhotoColumns.has('media_id')) db.exec('ALTER TABLE campus_photos ADD COLUMN media_id INTEGER REFERENCES media_library(id) ON DELETE CASCADE');
  const migrateCampusPhotos = db.prepare('SELECT id,facility_id,file,name,caption,mime,size FROM campus_photos WHERE media_id IS NULL');
  const createCampusMedia = db.prepare("INSERT INTO media_library(display_title,file_name,file_path,storage_area,mime,file_size,author_id) VALUES (?,?,?,'campus',?,?,NULL)");
  const createCampusAssignment = db.prepare('INSERT INTO content_assets(target_type,target_key,display_title,file_name,file_path,mime,file_size,author_id,media_id) VALUES (?,?,?,?,?,?,?,NULL,?)');
  const connectCampusMedia = db.prepare('UPDATE campus_photos SET media_id=? WHERE id=?');
  for (const photo of migrateCampusPhotos.all()) {
    tx(() => {
      const media = createCampusMedia.run(photo.caption, photo.name, photo.file, photo.mime, photo.size);
      const mediaId = Number(media.lastInsertRowid);
      createCampusAssignment.run('facility-photo', `${photo.facility_id}:${crypto.randomUUID()}`, photo.caption, photo.name, photo.file, photo.mime, photo.size, mediaId);
      connectCampusMedia.run(mediaId, photo.id);
    });
  }
} catch (e) {
  console.warn('[migration] campus_photos migration skipped:', e.message);
}

function mediaDirectory(asset) {
  return asset.storage_area === 'campus' ? path.join(UPLOAD_DIR, 'campus') : CONTENT_UPLOAD_DIR;
}

function validContentTarget(type, key) {
  if (!CONTENT_TARGET_TYPES.includes(type) || !key || key.length > 240) return false;
  if (type === 'achievement-cover') return key === 'achievement-main';
  if (type === 'about-page-image') return key === 'about-main';
  if (type === 'hero-slider') return /^hero-[1-5]$/.test(key);
  if (type === 'achievement-photo') {
    const record = key.match(/^(exam|awards|competitions|community):record:([0-9a-f-]{36})$/);
    if (record) return true;
    return /^(exam|awards|competitions|community):(?:\d{1,3}|new(?::[0-9a-f-]{36})?)$/.test(key);
  }
  if (type === 'event-image') return EVENT_TARGETS.includes(key) || !!db.prepare('SELECT 1 FROM home_events WHERE id=?').get(key);
  if (type === 'facility-photo') {
    return /^\d+(?::(?:[0-9a-f-]{36}|card:[a-z0-9-]{1,60}|cover))?$/.test(key);
  }
  const [subject, ...topicParts] = key.split('::');
  return SUBJECTS.includes(subject) && topicParts.join('::').trim().length > 0;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

app.get('/api/home-events', (req, res) => {
  res.json(db.prepare(
    "SELECT id,title,event_date,description,location FROM home_events WHERE event_date >= date('now') ORDER BY event_date,id"
  ).all());
});
app.get('/api/admin/home-events', auth, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT id,title,event_date,description,location FROM home_events ORDER BY event_date,id').all());
});
app.post('/api/admin/home-events', auth, adminOnly, (req, res) => {
  const title = String(req.body.title ?? '').trim();
  const eventDate = String(req.body.event_date ?? '');
  const description = String(req.body.description ?? '').trim();
  const location = String(req.body.location ?? '').trim();
  if (!title || title.length > 120) return res.status(400).json({error: 'Enter an event title (up to 120 characters).'});
  if (!validDate(eventDate)) return res.status(400).json({error: 'Choose a valid event date.'});
  if (description.length > 500) return res.status(400).json({error: 'Event details must be at most 500 characters.'});
  if (location.length > 120) return res.status(400).json({error: 'Event location must be at most 120 characters.'});
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO home_events(id,title,event_date,description,location) VALUES (?,?,?,?,?)')
    .run(id, title, eventDate, description, location);
  res.status(201).json({id});
});
app.put('/api/admin/home-events/:id', auth, adminOnly, (req, res) => {
  const title = String(req.body.title ?? '').trim();
  const eventDate = String(req.body.event_date ?? '');
  const description = String(req.body.description ?? '').trim();
  const location = String(req.body.location ?? '').trim();
  if (!title || title.length > 120) return res.status(400).json({error: 'Enter an event title (up to 120 characters).'});
  if (!validDate(eventDate)) return res.status(400).json({error: 'Choose a valid event date.'});
  if (description.length > 500) return res.status(400).json({error: 'Event details must be at most 500 characters.'});
  if (location.length > 120) return res.status(400).json({error: 'Event location must be at most 120 characters.'});
  const result = db.prepare('UPDATE home_events SET title=?,event_date=?,description=?,location=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(title, eventDate, description, location, req.params.id);
  result.changes ? res.json({ok: true}) : res.status(404).json({error: 'Event not found.'});
});
app.delete('/api/admin/home-events/:id', auth, adminOnly, (req, res) => {
  const event = db.prepare('SELECT id FROM home_events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({error: 'Event not found.'});
  tx(() => {
    const assets = db.prepare("SELECT id FROM content_assets WHERE target_type='event-image' AND target_key=?").all(event.id);
    for (const asset of assets) db.prepare('DELETE FROM content_assets WHERE id=?').run(asset.id);
    db.prepare('DELETE FROM home_events WHERE id=?').run(event.id);
  });
  res.json({ok: true});
});
db.exec(`
CREATE TABLE IF NOT EXISTS custom_topics (
  id INTEGER PRIMARY KEY,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '12',
  topic TEXT NOT NULL,
  topic_am TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);
app.get('/api/topics-custom', (req, res) => {
  res.json(db.prepare('SELECT id,subject,grade,topic,topic_am,unit,page FROM custom_topics ORDER BY subject,topic,id').all());
});
app.post('/api/admin/topics', auth, adminOnly, (req, res) => {
  const b = req.body || {};
  const subject = String(b.subject ?? '').trim(), grade = String(b.grade ?? '12').trim();
  const topic = String(b.topic ?? '').trim(), topicAm = String(b.topic_am ?? '').trim();
  const unit = String(b.unit ?? '').trim(), page = String(b.page ?? '').trim();
  if (!SUBJECTS.includes(subject)) return res.status(400).json({error: 'Choose a valid subject.'});
  if (!['9', '10', '11', '12'].includes(grade)) return res.status(400).json({error: 'Choose Grade 9, 10, 11 or 12.'});
  if (!topic || topic.length > 200 || topicAm.length > 200) return res.status(400).json({error: 'Topic title is required (max 200 characters).'});
  if (unit.length > 120 || page.length > 40) return res.status(400).json({error: 'Unit (max 120) or page (max 40) is too long.'});
  const dup = db.prepare('SELECT 1 FROM custom_topics WHERE subject=? AND grade=? AND lower(topic)=lower(?)').get(subject, grade, topic);
  if (dup) return res.status(409).json({error: 'That topic already exists for this subject and grade.'});
  const r = db.prepare('INSERT INTO custom_topics(subject,grade,topic,topic_am,unit,page) VALUES (?,?,?,?,?,?)')
    .run(subject, grade, topic, topicAm, unit, page);
  res.status(201).json({id: Number(r.lastInsertRowid)});
});
app.delete('/api/admin/topics/:id', auth, adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM custom_topics WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({error: 'Topic not found.'});
  res.json({ok: true});
});
app.get('/api/topic-card-details', (req, res) => {
  res.json(db.prepare('SELECT subject,topic,location_text FROM topic_card_details ORDER BY subject,topic').all());
});
app.put('/api/admin/topic-card-details', auth, adminOnly, (req, res) => {
  const subject = String(req.body.subject ?? '').trim();
  const topic = String(req.body.topic ?? '').trim();
  const locationText = String(req.body.location_text ?? '').trim();
  if (!SUBJECTS.includes(subject)) return res.status(400).json({error: 'Choose a valid topic subject.'});
  if (!topic || topic.length > 200) return res.status(400).json({error: 'Choose a valid topic card.'});
  if (!locationText || locationText.length > 500) return res.status(400).json({error: 'Enter replacement text (up to 500 characters).'});
  db.prepare(
    `INSERT INTO topic_card_details(subject,topic,location_text) VALUES (?,?,?)
     ON CONFLICT(subject,topic) DO UPDATE SET location_text=excluded.location_text,updated_at=CURRENT_TIMESTAMP`
  ).run(subject, topic, locationText);
  res.json({ok: true});
});
app.delete('/api/admin/topic-card-details', auth, adminOnly, (req, res) => {
  const subject = String(req.body.subject ?? '').trim();
  const topic = String(req.body.topic ?? '').trim();
  if (!SUBJECTS.includes(subject) || !topic || topic.length > 200)
    return res.status(400).json({error: 'Choose a valid topic card.'});
  db.prepare('DELETE FROM topic_card_details WHERE subject=? AND topic=?').run(subject, topic);
  res.json({ok: true});
});

const ACHIEVEMENT_GROUPS = ['exam', 'awards', 'competitions', 'community'];

app.get('/api/achievements', (req, res) => {
  const group = String(req.query.group ?? '');
  if (group && group !== 'all' && !ACHIEVEMENT_GROUPS.includes(group))
    return res.status(400).json({error: 'Choose a valid achievement group.'});
  const rows = group && group !== 'all'
    ? db.prepare(`SELECT e.*,c.id AS asset_id FROM achievement_entries e
        LEFT JOIN content_assets c ON c.target_type='achievement-photo'
          AND c.target_key=e.group_name || ':record:' || e.id
        WHERE e.group_name=? ORDER BY e.year DESC,e.created_at DESC,e.name`).all(group)
    : db.prepare(`SELECT e.*,c.id AS asset_id FROM achievement_entries e
        LEFT JOIN content_assets c ON c.target_type='achievement-photo'
          AND c.target_key=e.group_name || ':record:' || e.id
        ORDER BY e.group_name,e.year DESC,e.created_at DESC,e.name`).all();
  res.json(rows.map(row => ({
    ...row,
    photo: row.asset_id ? `/api/content-assets/${row.asset_id}/file` : ''
  })));
});

app.post('/api/admin/achievements', auth, adminOnly, (req, res) => {
  const body = req.body || {};
  const group = String(body.group ?? '');
  const year = String(body.year ?? '').trim();
  const name = String(body.name ?? '').trim();
  const nameAm = String(body.name_am ?? '').trim();
  const subtitle = String(body.subtitle ?? '').trim();
  const subtitleAm = String(body.subtitle_am ?? '').trim();
  const result = String(body.result ?? '').trim();
  const resultAm = String(body.result_am ?? '').trim();
  const note = String(body.note ?? '').trim();
  const noteAm = String(body.note_am ?? '').trim();
  const stream = String(body.stream ?? '');
  const score = body.score === '' || body.score == null ? null : Number(body.score);
  const outOf = body.out_of === '' || body.out_of == null ? null : Number(body.out_of);

  if (!ACHIEVEMENT_GROUPS.includes(group)) return res.status(400).json({error: 'Choose a valid achievement group.'});
  if (!year || year.length > 20) return res.status(400).json({error: 'Year is required (max 20 characters).'});
  if (!name || name.length > 120 || nameAm.length > 120)
    return res.status(400).json({error: 'Name is required (max 120 characters).'});
  if (subtitle.length > 200 || subtitleAm.length > 200 || result.length > 120 || resultAm.length > 120 ||
      note.length > 1000 || noteAm.length > 1000)
    return res.status(400).json({error: 'Achievement details exceed the allowed length.'});
  if (group === 'exam') {
    if (!['natural', 'social'].includes(stream))
      return res.status(400).json({error: 'Choose Natural Science or Social Science.'});
    if (!Number.isInteger(score) || !Number.isInteger(outOf) || score < 0 || outOf < 1 || score > outOf || outOf > 9999)
      return res.status(400).json({error: 'Enter a valid score and maximum score.'});
  } else if (stream || score !== null || outOf !== null) {
    return res.status(400).json({error: 'Stream and score details are only valid for exam records.'});
  }

  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO achievement_entries
    (id,group_name,year,name,name_am,subtitle,subtitle_am,result,result_am,note,note_am,stream,score,out_of)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, group, year, name, nameAm, subtitle, subtitleAm, result, resultAm, note, noteAm, stream, score, outOf);
  res.status(201).json({id});
});

app.delete('/api/admin/achievements/:id', auth, adminOnly, (req, res) => {
  const row = db.prepare('SELECT id,group_name FROM achievement_entries WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({error: 'Achievement record not found.'});
  tx(() => {
    db.prepare("DELETE FROM content_assets WHERE target_type='achievement-photo' AND target_key=?")
      .run(`${row.group_name}:record:${row.id}`);
    db.prepare('DELETE FROM achievement_entries WHERE id=?').run(row.id);
  });
  res.json({ok: true});
});

app.get('/api/content-assets', (req, res) => {
  const type = String(req.query.target_type ?? '');
  if (type && ![...CONTENT_TARGET_TYPES, 'facility-photo'].includes(type)) return res.status(400).json({ error: 'Choose a valid upload destination.' });
  const rows = type
    ? db.prepare('SELECT c.id,c.target_type,c.target_key,c.display_title,m.file_name,m.mime,m.file_size FROM content_assets c JOIN media_library m ON m.id=c.media_id WHERE c.target_type=? ORDER BY c.id').all(type)
    : db.prepare('SELECT c.id,c.target_type,c.target_key,c.display_title,m.file_name,m.mime,m.file_size FROM content_assets c JOIN media_library m ON m.id=c.media_id ORDER BY c.id').all();
  res.json(rows.map(r => ({ ...r, url: `/api/content-assets/${r.id}/file` })));
});
app.get('/api/content-assets/:id/file', (req, res) => {
  const asset = db.prepare('SELECT m.file_path,m.storage_area,m.mime,m.file_name FROM content_assets c JOIN media_library m ON m.id=c.media_id WHERE c.id=?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'File not found.' });
  res.set({
    'Content-Type': asset.mime,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(asset.file_name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=86400'
  });
  res.sendFile(path.basename(asset.file_path), { root: mediaDirectory(asset), dotfiles: 'deny' }, err => {
    if (err && !res.headersSent) res.status(404).json({ error: 'File not found.' });
  });
});
app.get('/api/admin/media', auth, (req, res) => {
  const query = String(req.query.q ?? '').trim().slice(0, 100);
  const like = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
  const rows = db.prepare(
    `SELECT m.id,m.display_title,m.file_name,m.mime,m.file_size,m.created_at,
      (SELECT COUNT(*) FROM content_assets c WHERE c.media_id=m.id) AS usage_count
     FROM media_library m
     WHERE m.mime IN ('image/jpeg','image/png','image/webp')
       AND (?='' OR m.display_title LIKE ? ESCAPE '\\' OR m.file_name LIKE ? ESCAPE '\\')
     ORDER BY m.id DESC LIMIT 100`
  ).all(query, like, like);
  res.json(rows.map(r => ({ ...r, url: `/api/media/${r.id}/file` })));
});
app.get('/api/media/:id/file', (req, res) => {
  const asset = db.prepare('SELECT file_path,storage_area,mime,file_name FROM media_library WHERE id=?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'File not found.' });
  res.set({
    'Content-Type': asset.mime,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(asset.file_name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=86400'
  });
  res.sendFile(path.basename(asset.file_path), { root: mediaDirectory(asset), dotfiles: 'deny' }, err => {
    if (err && !res.headersSent) res.status(404).json({ error: 'File not found.' });
  });
});
app.post('/api/admin/media', auth, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '11mb' }), (req, res) => {
  const mime = String(req.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const spec = CONTENT_UPLOAD_TYPES[mime], buffer = req.body;
  if (!spec || !Buffer.isBuffer(buffer) || !buffer.length) return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image.' });
  if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({ error: 'Images may not exceed 10 MB.' });
  if (!spec.valid(buffer)) return res.status(400).json({ error: 'The file content does not match its selected image type.' });
  let fileName = 'image' + spec.ext;
  try { fileName = decodeURIComponent(req.get('x-file-name') || fileName); } catch { return res.status(400).json({ error: 'The file name is invalid.' }); }
  fileName = path.basename(fileName).replace(/[^\w .()\-\u1200-\u137f]/g, '_').slice(0, 120) || 'image' + spec.ext;
  let displayTitle = '';
  try { displayTitle = decodeURIComponent(req.get('x-display-title') || '').trim().slice(0, 120); } catch { return res.status(400).json({ error: 'The image title is invalid.' }); }
  const stored = crypto.randomUUID() + spec.ext;
  fs.writeFileSync(path.join(CONTENT_UPLOAD_DIR, stored), buffer, { flag: 'wx' });
  try {
    const result = db.prepare('INSERT INTO media_library(display_title,file_name,file_path,mime,file_size,author_id) VALUES (?,?,?,?,?,?)')
      .run(displayTitle, fileName, stored, mime, buffer.length, req.user.id);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (error) {
    fs.rmSync(path.join(CONTENT_UPLOAD_DIR, stored), { force: true });
    throw error;
  }
});

app.post('/api/admin/content-assets/assign', auth, (req, res) => {
  const mediaId = Number(req.body.media_id);
  const type = String(req.body.target_type ?? '');
  let key = String(req.body.target_key ?? '');
  const displayTitle = String(req.body.display_title ?? '').trim().slice(0, 120);

  if (!Number.isSafeInteger(mediaId) || !validContentTarget(type, key))
    return res.status(400).json({ error: 'Choose a valid image and page destination.' });
  const media = db.prepare("SELECT id,display_title,file_name,file_path,mime,file_size FROM media_library WHERE id=? AND mime IN ('image/jpeg','image/png','image/webp')").get(mediaId);
  if (!media) return res.status(404).json({ error: 'Image not found in the media library.' });
  if (type === 'achievement-photo' && /:new$/.test(key)) key += `:${crypto.randomUUID()}`;
  if (type === 'facility-photo') {
    const facilityId = key.match(/^(\d+)/)[1];
    let legacy = 0;
    try { legacy = db.prepare('SELECT COUNT(*) AS count FROM campus_photos WHERE facility_id=? AND media_id IS NULL').get(facilityId).count; } catch {}
    const replacing = db.prepare('SELECT 1 FROM content_assets WHERE target_type=? AND target_key=?').get(type, key);
    const assigned = db.prepare("SELECT COUNT(*) AS count FROM content_assets WHERE target_type=? AND target_key LIKE ?").get(type, `${facilityId}:%`).count;
    if (!replacing && assigned + legacy >= 60)
      return res.status(400).json({ error: 'This facility already has 60 photos. Remove one first.' });
    if (key === facilityId) key = `${facilityId}:${crypto.randomUUID()}`;
  }
  db.prepare(
    `INSERT INTO content_assets(target_type,target_key,display_title,file_name,file_path,mime,file_size,author_id,media_id)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(target_type,target_key) DO UPDATE SET
       display_title=excluded.display_title,file_name=excluded.file_name,file_path=excluded.file_path,
       mime=excluded.mime,file_size=excluded.file_size,author_id=excluded.author_id,media_id=excluded.media_id,
       created_at=CURRENT_TIMESTAMP`
  ).run(type, key, displayTitle, media.file_name, media.file_path, media.mime, media.file_size, req.user.id, media.id);
  res.json({ ok: true, target_key: key });
});

app.post('/api/admin/content-assets', auth, express.raw({ type: Object.keys(CONTENT_UPLOAD_TYPES), limit: '25mb' }), (req, res) => {
  const type = String(req.get('x-target-type') || '');
  let key = String(req.get('x-target-key') || '');
  try { key = decodeURIComponent(key); } catch { return res.status(400).json({ error: 'The upload destination is invalid.' }); }
  const mime = String(req.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const spec = CONTENT_UPLOAD_TYPES[mime], buffer = req.body;

  console.log('[content-assets upload] INCOMING', { type, key, mime, bytes: buffer?.length });

  if (!validContentTarget(type, key)) {
    console.error(`❌ UPLOAD REJECTED: Type = "${type}", Key = "${key}"`);
    return res.status(400).json({ error: 'Choose a valid page and item for this upload.' });
  }

  if (type === 'achievement-photo' && /:new$/.test(key)) key += `:${crypto.randomUUID()}`;
  if (!spec || !Buffer.isBuffer(buffer) || !buffer.length) return res.status(400).json({ error: 'Choose a supported image or PDF file.' });
  if (buffer.length > (mime === 'application/pdf' ? 25 : 10) * 1024 * 1024)
    return res.status(413).json({ error: mime === 'application/pdf' ? 'PDF files may not exceed 25 MB.' : 'Images may not exceed 10 MB.' });
  if (!spec.valid(buffer)) return res.status(400).json({ error: 'The file content does not match its selected file type.' });
  if (type === 'achievement-photo' && mime === 'application/pdf')
    return res.status(400).json({ error: 'This destination accepts images only.' });
  if (type === 'facility-photo' && mime === 'application/pdf') return res.status(400).json({ error: 'Facilities accept images only.' });
  const old = db.prepare('SELECT id FROM content_assets WHERE target_type=? AND target_key=?').get(type, key);
  const stored = crypto.randomUUID() + spec.ext;
  let fileName = 'upload' + spec.ext;
  try { fileName = decodeURIComponent(req.get('x-file-name') || fileName); } catch {}
  fileName = path.basename(fileName).replace(/[^\w .()\-\u1200-\u137f]/g, '_').slice(0, 120) || 'upload' + spec.ext;
  let displayTitle = '';
  try { displayTitle = decodeURIComponent(req.get('x-display-title') || '').trim().slice(0, 120); } catch {}

  if (type === 'achievement-photo' && key.includes(':new:') && !displayTitle)
    displayTitle = path.parse(fileName).name.slice(0, 120) || 'Achievement';
  if (type === 'facility-photo') {
    const facilityId = key.match(/^(\d+)/)[1];
    let legacy = 0;
    try { legacy = db.prepare('SELECT COUNT(*) AS count FROM campus_photos WHERE facility_id=? AND media_id IS NULL').get(facilityId).count; } catch {}
    const replacing = db.prepare('SELECT 1 FROM content_assets WHERE target_type=? AND target_key=?').get(type, key);
    const assigned = db.prepare("SELECT COUNT(*) AS count FROM content_assets WHERE target_type=? AND target_key LIKE ?").get(type, `${facilityId}:%`).count;
    if (!replacing && assigned + legacy >= 60)
      return res.status(400).json({ error: 'This facility already has 60 photos. Remove one first.' });
    if (key === facilityId) key = `${facilityId}:${crypto.randomUUID()}`;
  }
  fs.writeFileSync(path.join(CONTENT_UPLOAD_DIR, stored), buffer, { flag: 'wx' });
  try {
    tx(() => {
      const media = db.prepare('INSERT INTO media_library(display_title,file_name,file_path,mime,file_size,author_id) VALUES (?,?,?,?,?,?)')
        .run(displayTitle, fileName, stored, mime, buffer.length, req.user.id);
      db.prepare(
        `INSERT INTO content_assets(target_type,target_key,display_title,file_name,file_path,mime,file_size,author_id,media_id)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(target_type,target_key) DO UPDATE SET
           display_title=excluded.display_title,file_name=excluded.file_name,file_path=excluded.file_path,
           mime=excluded.mime,file_size=excluded.file_size,author_id=excluded.author_id,media_id=excluded.media_id,
           created_at=CURRENT_TIMESTAMP`
      ).run(type, key, displayTitle, fileName, stored, mime, buffer.length, req.user.id, Number(media.lastInsertRowid));
    });
  } catch (error) {
    fs.rmSync(path.join(CONTENT_UPLOAD_DIR, stored), { force: true });
    throw error;
  }

  console.log('[content-assets upload] SAVED', { type, key, fileName, bytes: buffer.length });

  res.status(old ? 200 : 201).json({ ok: true, target_key: key });
});

app.delete('/api/admin/content-assets/:id', auth, (req, res) => {
  const asset = db.prepare('SELECT id,target_type,target_key,media_id FROM content_assets WHERE id=?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'File not found.' });
  if (asset.target_type === 'facility-photo') {
    const facilityId = asset.target_key.match(/^(\d+)/)?.[1];
    if (facilityId) { try { db.prepare('DELETE FROM campus_photos WHERE facility_id=? AND media_id=?').run(facilityId, asset.media_id); } catch {} }
  }
  db.prepare('DELETE FROM content_assets WHERE id=?').run(asset.id);
  res.json({ ok: true });
});
app.delete('/api/admin/media/:id', auth, (req, res) => {
  const media = db.prepare('SELECT id,file_path,storage_area FROM media_library WHERE id=?').get(req.params.id);
  if (!media) return res.status(404).json({ error: 'Image not found.' });
  db.prepare('DELETE FROM media_library WHERE id=?').run(media.id);
  fs.rm(path.join(mediaDirectory(media), path.basename(media.file_path)), { force: true }, error => { if (error) console.error('Could not remove deleted media:', error); });
  res.json({ ok: true });
});

/* ---------- Student stories: public submit + admin moderation ---------- */
app.get('/api/portal/stories', (req, res) => {
  res.json(
    db.prepare(`SELECT id,title,text,name,subject,date FROM portal_stories
                WHERE status='approved' ORDER BY id DESC`).all()
  );
});

app.post('/api/portal/stories', (req, res) => {
  const title   = String(req.body?.title   ?? '').trim().slice(0, 80);
  const text    = String(req.body?.text    ?? '').trim().slice(0, 800);
  const name    = String(req.body?.name    ?? '').trim().slice(0, 40);
  const subject = String(req.body?.subject ?? '').trim().slice(0, 80);
  if (!title || !text) return res.status(400).json({ error: 'Title and story are required.' });
  const date = new Date().toISOString().slice(0, 10);
  const r = db.prepare(
    'INSERT INTO portal_stories (title,text,name,subject,date,status) VALUES (?,?,?,?,?,?)'
  ).run(title, text, name, subject, date, 'pending');
  res.status(201).json({ id: Number(r.lastInsertRowid), status: 'pending' });
});

app.get('/api/portal/admin/stories', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_stories ORDER BY id DESC').all());
});

app.put('/api/portal/admin/stories/:id', auth, (req, res) => {
  const status = String(req.body?.status ?? '');
  if (!['pending', 'approved', 'hidden'].includes(status))
    return res.status(400).json({ error: 'Choose a valid status.' });
  const r = db.prepare('UPDATE portal_stories SET status=? WHERE id=?').run(status, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Story not found.' });
});

app.delete('/api/portal/admin/stories/:id', auth, (req, res) => {
  const r = db.prepare('DELETE FROM portal_stories WHERE id=?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Story not found.' });
});

/* ---------- Portal news / resources ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS portal_news (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, tag TEXT NOT NULL,
  date TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_resources (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, subject TEXT NOT NULL, stream TEXT NOT NULL,
  type TEXT NOT NULL, year TEXT DEFAULT '', description TEXT DEFAULT '', url TEXT DEFAULT '',
  file_name TEXT, file_path TEXT, file_size INTEGER, published INTEGER NOT NULL DEFAULT 1,
  note_text TEXT DEFAULT '', /* Added note_text */
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

try { db.exec("ALTER TABLE portal_resources ADD COLUMN grade TEXT NOT NULL DEFAULT '12'"); } catch {}
try { db.exec("ALTER TABLE portal_resources ADD COLUMN note_text TEXT DEFAULT ''"); } catch {} /* Added note_text */

app.get('/api/portal/news', (req, res) => {
  res.json(db.prepare(`SELECT id,title,body,tag,date,pinned FROM portal_news WHERE published=1
    ORDER BY pinned DESC, date DESC, id DESC`).all().map(r => ({ ...r, pinned: !!r.pinned })));
});
app.get('/api/portal/resources', (req, res) => {
  res.json(db.prepare(`SELECT id,title,subject,stream,type,year,description,url,file_name,file_size,grade,note_text
    FROM portal_resources WHERE published=1 AND grade IN ('12','all') ORDER BY id DESC`).all()
    .map(r => ({ ...r, file_url: r.file_name ? `/api/portal/resources/${r.id}/file` : null })));
});
app.get('/api/grade/resources', (req, res) => {
  const g = String(req.query.grade ?? '');
  if (!GRADES.includes(g) || g === 'all') return res.status(400).json({ error: 'Choose a grade.' });
  res.json(db.prepare(`SELECT id,title,subject,stream,type,year,description,url,file_name,file_size,grade,note_text
    FROM portal_resources WHERE published=1 AND grade IN (?, 'all') ORDER BY id DESC`).all(g)
    .map(r => ({ ...r, file_url: r.file_name ? `/api/portal/resources/${r.id}/file` : null })));
});

/* ---------- DEDICATED SHORT NOTES ROUTES (Bypasses portal-routes.js) ---------- */

app.get('/api/admin/short-notes', auth, (req, res) => {
  res.json(db.prepare(`SELECT id, title, subject, grade, description, published, note_text
    FROM portal_resources WHERE type='Notes' ORDER BY id DESC`).all().map(r => ({ ...r, published: !!r.published })));
});

app.post('/api/admin/short-notes', auth, (req, res) => {
  const title = String(req.body.title ?? '').trim();
  const subject = String(req.body.subject ?? '').trim();
  const grade = String(req.body.grade ?? '12');
  const desc = String(req.body.description ?? '').trim();
  const pub = req.body.published ? 1 : 0;
  const noteText = String(req.body.note_text ?? '').trim();

  if (!title) return res.status(400).json({ error: 'Title is required.' });
  if (!SUBJECTS.includes(subject)) return res.status(400).json({ error: 'Choose a valid subject.' });

  try {
    const r = db.prepare(`INSERT INTO portal_resources (title, subject, stream, type, year, description, url, published, author_id, grade, note_text)
      VALUES (?, ?, 'both', 'Notes', '', ?, '', ?, ?, ?, ?)`)
      .run(title, subject, desc, pub, req.user.id, grade, noteText);
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (err) {
    console.error('DB Insert Error:', err);
    res.status(500).json({ error: 'Database error.', detail: err.message });
  }
});

app.put('/api/admin/short-notes/:id', auth, (req, res) => {
  // FIX: Changed double quotes to single quotes around 'Notes'
  const row = db.prepare("SELECT id FROM portal_resources WHERE id=? AND type='Notes'").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Note not found.' });
  const pub = req.body.published ? 1 : 0;
  db.prepare('UPDATE portal_resources SET published=? WHERE id=?').run(pub, row.id);
  res.json({ ok: true });
});

app.delete('/api/admin/short-notes/:id', auth, (req, res) => {
  // FIX: Changed double quotes to single quotes around 'Notes'
  const row = db.prepare("SELECT id FROM portal_resources WHERE id=? AND type='Notes'").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Note not found.' });
  db.prepare('DELETE FROM portal_resources WHERE id=?').run(row.id);
  res.json({ ok: true });
});

/* ---------- Standard resource routes ---------- */

app.get('/api/portal/resources/:id/file', (req, res) => {
  const r = db.prepare('SELECT * FROM portal_resources WHERE id=? AND published=1').get(req.params.id);
  if (!r || !r.file_path) return res.status(404).json({ error: 'Not found.' });

  const download = req.query.download === '1';
  res.type('application/pdf');
  res.set('Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(r.file_name)}`);
  res.sendFile(path.join(UPLOAD_DIR, r.file_path));
});

function cleanNews(b) {
  const title = String(b.title ?? '').trim(), body = String(b.body ?? '').trim();
  const tag = String(b.tag ?? ''), date = String(b.date ?? '');
  if (!title || title.length > 150) return { error: 'Title is required (max 150 characters).' };
  if (!body || body.length > 5000) return { error: 'Message is required (max 5000 characters).' };
  if (!NEWS_TAGS.includes(tag)) return { error: 'Choose a valid type.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Choose a valid date.' };
  return { value: { title, body, tag, date, pinned: b.pinned ? 1 : 0, published: b.published === false ? 0 : 1 } };
}
app.get('/api/portal/admin/news', auth, (req, res) => {
  const base = 'SELECT n.*, u.full_name AS author FROM portal_news n LEFT JOIN users u ON u.id=n.author_id';
  res.json(db.prepare(base + ' ORDER BY n.pinned DESC, n.date DESC, n.id DESC').all().map(bool));
});
app.post('/api/portal/admin/news', auth, (req, res) => {
  const { value: v, error } = cleanNews(req.body);
  if (error) return res.status(400).json({ error });
  const r = db.prepare('INSERT INTO portal_news (title,body,tag,date,pinned,published,author_id) VALUES (?,?,?,?,?,?,?)')
    .run(v.title, v.body, v.tag, v.date, v.pinned, v.published, req.user.id);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});
app.put('/api/portal/admin/news/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_news WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'News item not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only edit your own news.' });
  const { value: v, error } = cleanNews(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare('UPDATE portal_news SET title=?,body=?,tag=?,date=?,pinned=?,published=? WHERE id=?')
    .run(v.title, v.body, v.tag, v.date, v.pinned, v.published, row.id);
  res.json({ ok: true });
});
app.delete('/api/portal/admin/news/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_news WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'News item not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only delete your own news.' });
  db.prepare('DELETE FROM portal_news WHERE id=?').run(row.id);
  res.json({ ok: true });
});

function cleanSrc(b) {
  const title = String(b.title ?? '').trim();
  const v = {
    title, subject: String(b.subject ?? ''), stream: String(b.stream ?? ''), type: String(b.type ?? ''),
    year: String(b.year ?? '').trim().slice(0, 20), description: String(b.description ?? '').trim().slice(0, 500),
    url: b.kind === 'link' ? String(b.url ?? '').trim() : '', published: b.published === false ? 0 : 1,
    grade: String(b.grade ?? '12')
  };
  if (!title || title.length > 150) return { error: 'Title is required (max 150 characters).' };
  if (!SUBJECTS.includes(v.subject)) return { error: 'Choose a valid subject.' };
  if (!STREAMS.includes(v.stream)) return { error: 'Choose a valid stream.' };
  if (!GRADES.includes(v.grade)) return { error: 'Choose a valid grade.' };
  if (!SRC_TYPES.includes(v.type)) return { error: 'Choose a valid type.' };
  if (b.kind === 'link' && !/^https?:\/\/.{3,}/i.test(v.url)) return { error: 'Enter a valid link starting with http:// or https://.' };
  return { value: v };
}
const removeFile = r => { if (r.file_path) fs.rm(path.join(UPLOAD_DIR, r.file_path), { force: true }, () => {}); };

app.get('/api/portal/admin/resources', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_resources ORDER BY id DESC').all().map(r => ({ ...r, published: !!r.published, file_path: undefined })));
});
app.post('/api/portal/admin/resources', auth, (req, res) => {
  const { value: v, error } = cleanSrc(req.body);
  if (error) return res.status(400).json({ error });
  const r = db.prepare(`INSERT INTO portal_resources (title,subject,stream,type,year,description,url,published,author_id,grade)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(v.title, v.subject, v.stream, v.type, v.year, v.description, v.url, v.published, req.user.id, v.grade);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});
app.put('/api/portal/admin/resources/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_resources WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Source not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only edit your own sources.' });
  const { value: v, error } = cleanSrc(req.body);
  if (error) return res.status(400).json({ error });
  db.prepare(`UPDATE portal_resources SET title=?,subject=?,stream=?,type=?,year=?,description=?,url=?,published=?,grade=? WHERE id=?`)
    .run(v.title, v.subject, v.stream, v.type, v.year, v.description, v.url, v.published, v.grade, row.id);
  if (req.body.kind === 'link' && row.file_path) {
    removeFile(row);
    db.prepare('UPDATE portal_resources SET file_name=NULL,file_path=NULL,file_size=NULL WHERE id=?').run(row.id);
  }
  res.json({ ok: true });
});
app.delete('/api/portal/admin/resources/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM portal_resources WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Source not found.' });
  if (!canEdit(req.user, row)) return res.status(403).json({ error: 'You can only delete your own sources.' });
  db.prepare('DELETE FROM portal_resources WHERE id=?').run(row.id);
  removeFile(row);
  res.json({ ok: true });
});

/* ---------- AI tutor ---------- */
app.post('/api/tutor/ask', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const grade = String(req.body?.grade ?? '');
  const subject = String(req.body?.subject ?? '');
  const level = String(req.body?.level ?? '');
  const language = req.body?.language === 'am' ? 'Amharic' : 'English';
  const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History', 'Civics', 'Economics', 'Aptitude'];
  const levels = ['foundation', 'growth', 'excellence'];

  if (question.length < 3 || question.length > 1200)
    return res.status(400).json({ error: 'Enter a question between 3 and 1200 characters.', errorAm: 'ከ3 እስከ 1200 ቁምፊ ያለው ጥያቄ ያስገቡ።' });
  if (!['9', '10', '11', '12'].includes(grade) || (subject && !subjects.includes(subject)) || (level && !levels.includes(level)))
    return res.status(400).json({ error: 'The grade, subject, or learning path is invalid.', errorAm: 'ክፍሉ፣ የትምህርት ዓይነቱ ወይም የመማር መንገዱ ትክክል አይደለም።' });

  if (!process.env.OPENROUTER_API_KEY)
    return res.status(503).json({ error: 'The AI helper is not configured yet. Add OPENROUTER_API_KEY to the server .env file and restart the server.', errorAm: 'የAI አጋዡ ገና አልተዘጋጀም። OPENROUTER_API_KEYን በserver .env ፋይል ውስጥ ጨምረው ሰርቨሩን እንደገና ያስነሱ።' });

  if (tutorLimited(req.ip))
    return res.status(429).json({ error: 'Too many questions were sent from this network. Please try again in a few minutes.', errorAm: 'ከዚህ ኔትወርክ ብዙ ጥያቄዎች ተልከዋል። እባክዎ ከጥቂት ደቂቃዎች በኋላ ይሞክሩ።' });

  const levelNames = { foundation: 'Foundation', growth: 'Growth', excellence: 'Excellence' };
  const context = `Grade: ${grade}${subject ? `; subject: ${subject}` : ''}${level ? `; learning path: ${levelNames[level]}` : ''}.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `You are a kind, safe study tutor for school students. ${context} Answer in ${language}. Explain clearly at the student's level, using short steps and a brief example when useful. Keep the answer under 250 words.`
          },
          { role: 'user', content: question }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter API Error (Status ${response.status}):`, errorText);
      return res.status(502).json({ error: 'The AI helper could not answer right now. Please try again later.', errorAm: 'የAI አጋዡ አሁን መመለስ አልቻለም። እባክዎ በኋላ ይሞክሩ።' });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      console.error('OpenRouter returned no text answer:', data);
      return res.status(502).json({ error: 'The AI helper returned no answer. Please try again.', errorAm: 'የAI አጋዡ መልስ አልሰጠም። እባክዎ እንደገና ይሞክሩ።' });
    }

    res.set('Cache-Control', 'no-store');
    res.json({ answer });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      return res.status(504).json({ error: 'The AI helper took too long to respond. Please try again.', errorAm: 'የAI አጋዡ ለመመለስ ብዙ ጊዜ ወሰደ። እባክዎ እንደገና ይሞክሩ።' });

    console.error('AI tutor request failed:', error);
    return res.status(502).json({ error: 'The AI helper is unavailable right now. Please try again later.', errorAm: 'የAI አጋዡ አሁን አይገኝም። እባክዎ በኋላ ይሞክሩ።' });
  }
});

/* ---------- Static files ---------- */
/* ---------- School funding ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS funding_projects (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '🏫',
  title TEXT NOT NULL,
  title_am TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  description_am TEXT NOT NULL DEFAULT '',
  goal INTEGER NOT NULL DEFAULT 1,
  raised INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS funding_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS funding_donations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES funding_projects(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL DEFAULT '',
  anonymous INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL,
  donated_at TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS funding_updates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES funding_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  update_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);
{
  const have = new Set(db.prepare('PRAGMA table_info(funding_projects)').all().map(c => c.name));
  for (const col of ['beneficiaries', 'beneficiaries_am', 'purpose', 'purpose_am'])
    if (!have.has(col)) db.exec(`ALTER TABLE funding_projects ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
}

const fundDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const fundMoney = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : NaN; };
const fundText = (v, max) => String(v ?? '').trim().slice(0, max);

function cleanFundingProject(b) {
  const icon = fundText(b.icon, 8) || '🏫';
  const title = fundText(b.title, 200), titleAm = fundText(b.title_am, 200);
  const description = fundText(b.description, 301), descriptionAm = fundText(b.description_am, 301);
  const ben = fundText(b.beneficiaries, 301), benAm = fundText(b.beneficiaries_am, 301);
  const purpose = fundText(b.purpose, 301), purposeAm = fundText(b.purpose_am, 301);
  const goal = fundMoney(b.goal), raised = fundMoney(b.raised ?? 0);
  if (!title || title.length > 120) return { error: 'Enter a project name (up to 120 characters).' };
  if (titleAm.length > 120) return { error: 'Amharic name must be at most 120 characters.' };
  if ([description, descriptionAm, ben, benAm, purpose, purposeAm].some(t => t.length > 300)) return { error: 'Each description field must be at most 300 characters.' };
  if (!(goal >= 1)) return { error: 'Enter the money needed (at least 1 ETB).' };
  if (Number.isNaN(raised)) return { error: 'Amount raised must be 0 or more.' };
  return { value: { icon, title, titleAm, description, descriptionAm, ben, benAm, purpose, purposeAm, goal, raised, published: b.published === false ? 0 : 1 } };
}
const FUNDING_COLS = 'id,icon,title,title_am,description,description_am,beneficiaries,beneficiaries_am,purpose,purpose_am,goal,raised,published';
const fundingRow = r => ({ ...r, published: !!r.published });

/* Projects. The page calculates the percentage from goal and raised. */
app.get('/api/funding/projects', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(db.prepare(`SELECT ${FUNDING_COLS} FROM funding_projects WHERE published = 1 ORDER BY created_at, rowid`).all().map(fundingRow));
});
app.get('/api/admin/funding/projects', auth, adminOnly, (req, res) => {
  res.json(db.prepare(`SELECT ${FUNDING_COLS} FROM funding_projects ORDER BY created_at, rowid`).all().map(fundingRow));
});
app.post('/api/admin/funding/projects', auth, adminOnly, (req, res) => {
  const { value: v, error } = cleanFundingProject(req.body || {});
  if (error) return res.status(400).json({ error });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO funding_projects(id,icon,title,title_am,description,description_am,beneficiaries,beneficiaries_am,purpose,purpose_am,goal,raised,published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, v.icon, v.title, v.titleAm, v.description, v.descriptionAm, v.ben, v.benAm, v.purpose, v.purposeAm, v.goal, v.raised, v.published);
  res.status(201).json({ id });
});
app.put('/api/admin/funding/projects/:id', auth, adminOnly, (req, res) => {
  const { value: v, error } = cleanFundingProject(req.body || {});
  if (error) return res.status(400).json({ error });
  const r = db.prepare('UPDATE funding_projects SET icon=?,title=?,title_am=?,description=?,description_am=?,beneficiaries=?,beneficiaries_am=?,purpose=?,purpose_am=?,goal=?,raised=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(v.icon, v.title, v.titleAm, v.description, v.descriptionAm, v.ben, v.benAm, v.purpose, v.purposeAm, v.goal, v.raised, v.published, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Project not found.' });
});
app.delete('/api/admin/funding/projects/:id', auth, adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM funding_projects WHERE id=?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Project not found.' });
});

/* Who receives the money (shown to donors). */
const FUND_INFO_KEYS = ['legal_name', 'merchant_name', 'merchant_code', 'phone', 'email', 'statement', 'statement_am', 'surplus_rule', 'surplus_rule_am'];
const getFundInfo = () => {
  const out = Object.fromEntries(FUND_INFO_KEYS.map(k => [k, '']));
  for (const r of db.prepare('SELECT key,value FROM funding_settings').all()) if (r.key in out) out[r.key] = r.value;
  return out;
};
app.get('/api/funding/info', (req, res) => { res.set('Cache-Control', 'no-store'); res.json(getFundInfo()); });
app.get('/api/admin/funding/info', auth, adminOnly, (req, res) => res.json(getFundInfo()));
app.put('/api/admin/funding/info', auth, adminOnly, (req, res) => {
  const b = req.body || {}, up = db.prepare('INSERT INTO funding_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const vals = {};
  for (const k of FUND_INFO_KEYS) {
    const max = k.startsWith('statement') || k.startsWith('surplus') ? 600 : 120;
    const raw = String(b[k] ?? '').trim();
    if (raw.length > max) return res.status(400).json({ error: `“${k.replace(/_/g, ' ')}” is too long (max ${max} characters).` });
    vals[k] = raw;
  }
  tx(() => { for (const k of FUND_INFO_KEYS) up.run(k, vals[k]); });
  res.json({ ok: true });
});

/* Donations log. Recording a donation adds it to the project's raised total. */
app.get('/api/funding/donations', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(db.prepare(`SELECT d.project_id, CASE WHEN d.anonymous=1 THEN '' ELSE d.donor_name END AS donor, d.amount, d.donated_at, d.reference
    FROM funding_donations d JOIN funding_projects p ON p.id=d.project_id WHERE p.published=1
    ORDER BY d.donated_at DESC, d.created_at DESC, d.rowid DESC LIMIT 50`).all());
});
app.get('/api/admin/funding/donations', auth, adminOnly, (req, res) => {
  res.json(db.prepare(`SELECT d.id,d.project_id,p.title AS project_title,d.donor_name,d.anonymous,d.amount,d.donated_at,d.reference
    FROM funding_donations d JOIN funding_projects p ON p.id=d.project_id ORDER BY d.donated_at DESC, d.created_at DESC, d.rowid DESC LIMIT 200`).all()
    .map(r => ({ ...r, anonymous: !!r.anonymous })));
});
app.post('/api/admin/funding/donations', auth, adminOnly, (req, res) => {
  const b = req.body || {}, amount = fundMoney(b.amount), date = String(b.donated_at ?? '');
  const project = db.prepare('SELECT id FROM funding_projects WHERE id=?').get(String(b.project_id ?? ''));
  if (!project) return res.status(400).json({ error: 'Choose a project.' });
  if (!(amount >= 1)) return res.status(400).json({ error: 'Enter the amount received (at least 1 ETB).' });
  if (!fundDate(date)) return res.status(400).json({ error: 'Choose a valid date.' });
  const id = crypto.randomUUID();
  tx(() => {
    db.prepare('INSERT INTO funding_donations(id,project_id,donor_name,anonymous,amount,donated_at,reference) VALUES (?,?,?,?,?,?,?)')
      .run(id, project.id, fundText(b.donor_name, 80), b.anonymous ? 1 : 0, amount, date, fundText(b.reference, 60));
    db.prepare('UPDATE funding_projects SET raised=raised+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(amount, project.id);
  });
  res.status(201).json({ id });
});
app.delete('/api/admin/funding/donations/:id', auth, adminOnly, (req, res) => {
  const d = db.prepare('SELECT id,project_id,amount FROM funding_donations WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Donation not found.' });
  tx(() => {
    db.prepare('DELETE FROM funding_donations WHERE id=?').run(d.id);
    db.prepare('UPDATE funding_projects SET raised=MAX(0,raised-?),updated_at=CURRENT_TIMESTAMP WHERE id=?').run(d.amount, d.project_id);
  });
  res.json({ ok: true });
});

/* Project updates (what the money was used for). */
const safePhoto = u => u === '' || /^https:\/\//i.test(u) || /^\/(?!\/)/.test(u);
app.get('/api/funding/updates', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(db.prepare(`SELECT u.id,u.project_id,u.title,u.body,u.photo_url,u.update_date FROM funding_updates u
    JOIN funding_projects p ON p.id=u.project_id WHERE p.published=1 ORDER BY u.update_date DESC, u.created_at DESC, u.rowid DESC LIMIT 30`).all());
});
app.get('/api/admin/funding/updates', auth, adminOnly, (req, res) => {
  res.json(db.prepare(`SELECT u.id,u.project_id,p.title AS project_title,u.title,u.body,u.photo_url,u.update_date FROM funding_updates u
    JOIN funding_projects p ON p.id=u.project_id ORDER BY u.update_date DESC, u.created_at DESC, u.rowid DESC LIMIT 100`).all());
});
app.post('/api/admin/funding/updates', auth, adminOnly, (req, res) => {
  const b = req.body || {}, title = fundText(b.title, 121), body = fundText(b.body, 1001), photo = fundText(b.photo_url, 501), date = String(b.update_date ?? '');
  const project = db.prepare('SELECT id FROM funding_projects WHERE id=?').get(String(b.project_id ?? ''));
  if (!project) return res.status(400).json({ error: 'Choose a project.' });
  if (!title || title.length > 120) return res.status(400).json({ error: 'Enter an update title (up to 120 characters).' });
  if (body.length > 1000) return res.status(400).json({ error: 'The note must be at most 1000 characters.' });
  if (!safePhoto(photo) || photo.length > 500) return res.status(400).json({ error: 'Photo link must start with https:// (or be a path on this site).' });
  if (!fundDate(date)) return res.status(400).json({ error: 'Choose a valid date.' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO funding_updates(id,project_id,title,body,photo_url,update_date) VALUES (?,?,?,?,?,?)').run(id, project.id, title, body, photo, date);
  res.status(201).json({ id });
});
app.delete('/api/admin/funding/updates/:id', auth, adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM funding_updates WHERE id=?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Update not found.' });
});

/* ---------- Payment accounts shown to donors (Telebirr phone + bank accounts) ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS funding_accounts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'bank',
  bank_name TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);
function cleanFundingAccount(b) {
  const kind = b.kind === 'telebirr' ? 'telebirr' : 'bank';
  const bank = String(b.bank_name ?? '').trim().slice(0, 81);
  const number = String(b.account_number ?? '').trim().replace(/\s+/g, ' ');
  const owner = String(b.owner_name ?? '').trim().slice(0, 101);
  const note = String(b.note ?? '').trim().slice(0, 151);
  if (kind === 'bank' && (!bank || bank.length > 80)) return { error: 'Enter the bank name (up to 80 characters).' };
  if (!/^[A-Za-z0-9+\- ]{3,40}$/.test(number)) return { error: kind === 'telebirr' ? 'Enter a valid Telebirr phone number.' : 'Enter a valid account number (letters, digits, spaces or dashes).' };
  if (owner.length < 2 || owner.length > 100) return { error: 'Enter the account owner name (2 to 100 characters).' };
  if (note.length > 150) return { error: 'The note must be at most 150 characters.' };
  return { value: { kind, bank: kind === 'bank' ? bank : '', number, owner, note, published: b.published === false ? 0 : 1 } };
}
const ACC_COLS = 'id,kind,bank_name,account_number,owner_name,note,published';
const ACC_ORDER = "ORDER BY CASE kind WHEN 'telebirr' THEN 0 ELSE 1 END, created_at, rowid";
const accRow = r => ({ ...r, published: !!r.published });
app.get('/api/funding/accounts', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(db.prepare(`SELECT id,kind,bank_name,account_number,owner_name,note FROM funding_accounts WHERE published = 1 ${ACC_ORDER}`).all());
});
app.get('/api/admin/funding/accounts', auth, adminOnly, (req, res) => {
  res.json(db.prepare(`SELECT ${ACC_COLS} FROM funding_accounts ${ACC_ORDER}`).all().map(accRow));
});
app.post('/api/admin/funding/accounts', auth, adminOnly, (req, res) => {
  const { value: v, error } = cleanFundingAccount(req.body || {});
  if (error) return res.status(400).json({ error });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO funding_accounts(id,kind,bank_name,account_number,owner_name,note,published) VALUES (?,?,?,?,?,?,?)')
    .run(id, v.kind, v.bank, v.number, v.owner, v.note, v.published);
  res.status(201).json({ id });
});
app.put('/api/admin/funding/accounts/:id', auth, adminOnly, (req, res) => {
  const { value: v, error } = cleanFundingAccount(req.body || {});
  if (error) return res.status(400).json({ error });
  const r = db.prepare('UPDATE funding_accounts SET kind=?,bank_name=?,account_number=?,owner_name=?,note=?,published=? WHERE id=?')
    .run(v.kind, v.bank, v.number, v.owner, v.note, v.published, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Account not found.' });
});
app.delete('/api/admin/funding/accounts/:id', auth, adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM funding_accounts WHERE id=?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Account not found.' });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
  console.error('[server error]', err);
  res.status(500).json({ error: 'Something went wrong on the server.', detail: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ School site running at http://localhost:${PORT}  (staff login: /admin)`);
  console.log(`✅ Also accessible on your network at http://<YOUR-LOCAL-IP>:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
});