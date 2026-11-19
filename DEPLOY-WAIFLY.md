# Deploying on Waifly

Included: code, `public/`, `school.db` (your data), `uploads/` (your files).
NOT included: `.env` (secrets) - you create it on the server.

## Steps
1. Upload and unzip this folder on the server (File Manager or SFTP).
2. Make sure the server uses Node.js 22.13 or newer (`node -v`).
3. Create `.env` in the same folder as `server.js`, from `.env.example`.
   Required: JWT_SECRET (long random string). Use NEW values for
   GEMINI_API_KEY and the TEACHER_* codes (the old ones were shared).
   You can copy the rest from your local .env.
   Generate a secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
4. In the folder run: npm install
5. Start command: npm start   (same as: node server.js)
   If Waifly sets a port for you, it is read from the PORT variable automatically.
   Keep it running with the panel's app manager, or: pm2 start server.js --name school
6. Point your domain at the app and enable HTTPS (SSL) in the panel.
7. Check https://YOUR-DOMAIN/api/health, then log in at /admin.

## Notes
- Back up `school.db` and `uploads/` regularly; they hold all your data.
- Never share `.env`. Don't put `school.db` or `uploads/` on GitHub.
