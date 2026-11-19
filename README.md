# School website backend

## Folder layout
```
school backend/
  server.js               main server (login, announcements, staff accounts)
  portal-routes.js        Grade 12 portal API        -> /api/portal
  discussion-routes.js    discussion board API       -> /api/discuss
  facilities-routes.js    campus facilities API      -> /api/campus
  package.json
  .env.example            copy to .env and fill in
  school.db               database (created automatically if missing)
  uploads/                uploaded portal PDFs, campus photos, and page files
  public/                 the website pages, CSS and JS
```

## Run it
1. Install Node.js 22.13 or newer (the current LTS is fine).
2. In this folder: `npm install`
3. Copy `.env.example` to `.env` and fill it in (JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD). Teacher credentials can be managed in the Admin page; existing `TEACHER_<SUBJECT>` codes in `.env` remain supported for compatibility.
   To enable the Grade 9–11 AI study helper, also add a Google Gemini API key as `GEMINI_API_KEY` in `.env`. Questions are sent to Google Gemini; do not enter personal information.
4. `npm start`
5. Public page: http://localhost:3000   Staff login: http://localhost:3000/admin

The first admin account is created from `.env` on the first start. After that you can remove ADMIN_PASSWORD from `.env`.

### Starting locally on Windows

Install Node.js LTS 22.13.0 or newer. In VS Code, run **Terminal > Run Task > Start School Backend Locally**. The task and `start-local.bat` find Node.js in the per-user WinGet installation even when an already-open terminal has an outdated PATH. Keep the task terminal running while you use http://localhost:3000. Alternatively, restart VS Code to refresh PATH, then run `npm start`.

In Staff area > Page uploads, staff can attach an image or PDF to an existing or new topic in any subject, select an achievement entry, or select a facility page/image card. Facility images can replace a page cover, replace a card image on the Library, Computer Room, or Classrooms page, or be added to the facility gallery. Re-uploading replaces the file for an existing destination. Question sources are managed separately and can be assigned to Grade 9, 10, 11, 12, or all grades. Uploaded files are stored under `uploads/` and their destination records are stored in `school.db`.

## Who can do what
- Public visitors: read published announcements only.
- Publisher: log in, post announcements, edit or delete their own.
- Admin: everything a publisher can do, on all announcements, plus add/remove staff and reset passwords.

## Before going live
- Serve the site over HTTPS (use a host that provides it, or put nginx/Caddy in front). Passwords are sent on login.
- Keep `.env` and `school.db` private and back up `school.db` regularly. Do not put them in zip files you share.
- Use a long random JWT_SECRET.
- The example subject codes ending in `1234` are predictable; replace them with unique random codes before exposing the discussion board publicly.

## Known to-do
- `public/achievement.html` expects a photo named `image_74a772d6.jpg` in `public/`. Add it (or change the file name in the page). Until then the picture is simply hidden.
