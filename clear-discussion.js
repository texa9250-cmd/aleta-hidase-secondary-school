/* Removes ALL discussion questions and answers (and uploaded voice files).
   1. Stop the school server.
   2. Put this file next to school.db (same folder as discussion-routes.js).
   3. Run:   node clear-discussion.js          -> only shows how many will be removed
             node clear-discussion.js --yes    -> makes a backup, then deletes everything
   4. Start the server again. */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (e) {}   // read DB_FILE / UPLOAD_DIR like the server does
const dbFile = process.env.DB_FILE || path.join(__dirname, 'school.db');
const mediaDir = path.join(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'), 'discuss');
if (!fs.existsSync(dbFile)) { console.error('school.db not found next to this script.'); process.exit(1); }

const db = new DatabaseSync(dbFile);
const count = t => { try { return db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; } catch (e) { return 0; } };
const files = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : [];
console.log(`Questions: ${count('discuss_questions')}   Answers: ${count('discuss_answers')}   Voice files: ${files.length}`);

if (!process.argv.includes('--yes')) {
  console.log('\nNothing was deleted. Run again with  --yes  to delete all of it.');
  process.exit(0);
}

db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
const backup = path.join(path.dirname(dbFile), `school-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
fs.copyFileSync(dbFile, backup);
console.log('Backup saved:', path.basename(backup));

db.exec('PRAGMA foreign_keys = ON');
db.exec('DELETE FROM discuss_answers');
db.exec('DELETE FROM discuss_questions');
try { db.exec("DELETE FROM sqlite_sequence WHERE name IN ('discuss_questions','discuss_answers')"); } catch (e) {}
for (const f of files) { try { fs.unlinkSync(path.join(mediaDir, f)); } catch (e) {} }
db.exec('VACUUM');
console.log('Done. The discussion board is now empty. Start the server again.');
