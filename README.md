# Academic English — Learning Hub

Vocabulary (Units 1–11), Grammar reference, and user accounts with PostgreSQL (Neon).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set your secrets:

```bash
copy .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — your Neon PostgreSQL connection string
- `JWT_SECRET` — at least 16 random characters
- `PORT` — optional (default `3000`)

**Never commit `.env` or share database passwords publicly.** If a password was exposed, rotate it in the Neon dashboard.

3. Start the server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

**Windows:** double-click `start.bat` (installs deps, starts server, opens browser).

### “Failed to fetch”

This means the browser cannot reach the API. **Do not open `index.html` directly.** Always use the server:

1. Run `npm start` (or `start.bat`)
2. Open **http://localhost:3000**

## Features

- **Nickname entry** — enter a unique nickname to start (no password)
- **Profile** — saved in PostgreSQL; book choice remembered
- **Vocabulary** — choose **Vocabulary for IELTS Advanced**
- **Android & iOS (PWA)** — install from browser; works like an app
- **Live online count** — see how many learners are online now

### Mobile (Android & iOS)

1. Deploy or use the site over **HTTPS** (required for install on real phones).
2. **Android (Chrome):** open site → **Install app** banner, or menu → *Install app*.
3. **iPhone (Safari):** Share → **Add to Home Screen**.

Local testing: `http://localhost:3000` on the same Wi‑Fi (use your PC IP in phone browser).

### Online learners

Logged-in users send a heartbeat every 25 seconds. The home and login screens show **X learners online now** with a live pulse animation.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Public config |
| POST | `/api/auth/join` | `{ username }` — nickname entry |
| GET | `/api/auth/me` | Bearer token required |
| GET | `/api/books` | List vocabulary books |
| POST | `/api/books/select` | Bearer token · `{ bookId }` or `{ bookSlug }` |
| GET | `/api/presence/online` | Online user count (public) |
| POST | `/api/presence/heartbeat` | Bearer token — mark online |
| POST | `/api/presence/offline` | Bearer token — mark offline |
