const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();
const db = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'school.db'));

// Create tables with correct INTEGER PRIMARY KEY for IDs
db.exec(`
  CREATE TABLE IF NOT EXISTS campus_facilities (
    id INTEGER PRIMARY KEY,
    title TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    icon TEXT DEFAULT '🏫',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS campus_photos (
    id INTEGER PRIMARY KEY,
    facility_id INTEGER REFERENCES campus_facilities(id) ON DELETE CASCADE,
    file TEXT NOT NULL,
    name TEXT NOT NULL,
    caption TEXT DEFAULT '',
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Auto-populate facilities if the table is empty (prevents errors)
if (!db.prepare('SELECT 1 FROM campus_facilities LIMIT 1').get()) {
  const insert = db.prepare('INSERT INTO campus_facilities (title, slug, icon, description) VALUES (?, ?, ?, ?)');
  insert.run('Library', 'library', '📚', 'Thousands of textbooks, references, and quiet study space.');
  insert.run('Science Labs', 'science-labs', '🧪', 'Physics, chemistry, and biology labs with modern equipment.');
  insert.run('Classrooms', 'classrooms', '🏫', 'Bright, spacious classrooms with modern teaching aids.');
  insert.run('The Beauty of Our School', 'beauty-of-school', '🌳', 'Discover the beautiful gardens, green spaces, and peaceful environment.');
}

router.get('/facilities', (req, res) => {
  const rows = db.prepare('SELECT id, title, slug, icon, description FROM campus_facilities ORDER BY id').all();
  res.json(rows);
});

router.get('/facilities/:id', (req, res) => {
  const facility = db.prepare('SELECT id, title, slug, icon, description FROM campus_facilities WHERE id = ?').get(req.params.id);
  if (!facility) return res.status(404).json({ error: 'Facility not found.' });
  
  const photos = db.prepare('SELECT id, file, name, caption, mime, size FROM campus_photos WHERE facility_id = ? ORDER BY id').all(facility.id);
  facility.photos = photos.map(p => ({ ...p, url: `/uploads/campus/${p.file}` }));
  
  res.json(facility);
});

module.exports = router;