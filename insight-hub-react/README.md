# Tata Steel R&D Insight Hub (React version)

A knowledge repository where R&D staff log learnings from the 9 BT²i scanning channels,
attach images, comment and rate entries. Built from scratch, independent of SharePoint.

| Part | Technology | Folder |
|---|---|---|
| Screens (what users see) | React 19 + Vite | `frontend/` |
| Server (API) | Node.js 22 + Express | `backend/` |
| Database | Microsoft SQL Server **or** MySQL (switch with `DB_CLIENT` in `backend/.env`) | `database/` |
| Sign-in | Microsoft Entra ID single sign-on (MSAL) - plus a test mode | |

## Quick start (Windows, after installing Node.js 22 and SQL Server Express)

```
1. Run database\sqlserver-create-database.sql in SSMS   (or mysql-create-database.sql in MySQL Workbench)
2. cd backend   ->  copy .env.example .env  ->  edit .env
   npm install
   npm run setup-db
   npm start                       (leave this window open)
3. cd frontend  ->  copy .env.example .env
   npm install
   npm run dev                     (leave this window open)
4. Open http://localhost:5173
```

The full beginner guide, including single sign-on setup, is in the "Insight Hub (React) - Build Guide" document.

## Folder map

```
backend/
  .env.example        settings template (database, sign-in)
  src/server.js       starts the API server
  src/config.js       reads .env
  src/db.js           database connection (SQL Server or MySQL)
  src/setup-db.js     creates the tables (npm run setup-db)
  src/auth.js         checks who is signed in
  src/entries.js      API: entries, images, comments, ratings
  uploads/            uploaded images are saved here
frontend/
  .env.example        settings template (sign-in)
  src/main.jsx        starts the React app
  src/auth.jsx        Microsoft sign-in (MSAL) / test sign-in
  src/api.js          calls to the backend
  src/App.jsx         main page: filters, tabs, feed
  src/components/     Header, Slideshow, Stats, LatestStrip, EntryCard, EntryForm, Lightbox, SignIn
  src/channels.js     the 9 channels and their sub-types
  src/styles.css      the design
database/
  sqlserver-create-database.sql
  mysql-create-database.sql
```

## Database tables

`users`, `entries`, `entry_images`, `comments`, `ratings` - created by `npm run setup-db`.

## API

| Method | Address | What it does |
|---|---|---|
| GET | /api/health | Is the server and database up? (no sign-in needed) |
| GET | /api/me | Signed-in user |
| GET | /api/entries | All entries with images, comments, ratings |
| POST | /api/entries | Add an entry (form data + images) |
| PUT | /api/entries/:id | Edit an entry (owner only) |
| DELETE | /api/entries/:id | Delete an entry (owner only) |
| POST | /api/entries/:id/comments | Add a comment |
| PUT | /api/entries/:id/rating | Rate 1-5 stars |

## Going live (production)

```
cd frontend && npm run build     (creates frontend\dist)
cd backend  && npm start         (serves the app and the API on one address: http://server:3001)
```
Set `AUTH_MODE=entra` / `VITE_AUTH_MODE=entra` before building, and add the live address as a
redirect URI in the Azure app registration.
