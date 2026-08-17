# Setup Guide - Brow Bloom App

## Architecture
- **Frontend**: React + TypeScript + Vite (port 8080)
- **Backend**: Node.js + Express (port 3001)
- **Database**: PostgreSQL (cloud or local)

## Setup PostgreSQL Cloud (Recommended)

### Option 1: Neon
1. Go to https://neon.tech
2. Create account and database
3. Copy connection string
4. Paste in `server/.env`

## Setup Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Configure Database
Edit `server/.env`:
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=choose-a-strong-secret-key
PORT=3001
```

### 3. Create Database Tables
Run this SQL once (with an admin/superuser role):
```bash
psql "$DATABASE_URL" -f server/schema.sql
# Créer le rôle applicatif limité aux opérations CRUD (SELECT/INSERT/UPDATE/DELETE, pas de DDL) :
psql "$DATABASE_URL" -f server/setup_limited_role.sql
```
Puis mettez `DATABASE_URL` dans `server/.env` avec le rôle applicatif limité.

### 4. Start Backend
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3001`

### 5. Start Frontend (in another terminal)
```bash
npm install  # if not done yet
npm run dev
```
Frontend runs on `http://127.0.0.1:8080` (les appels `/api/*` sont proxifiés
vers le backend local — la session est un cookie HttpOnly, aucune clé en localStorage)

### 6. Create First Admin User
1. Go to `http://localhost:8080/auth`
2. Create account
3. In database, update user role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (session cookie `bb_session`, HttpOnly)
- `GET /api/auth/me` - Current user (session verification)
- `POST /api/auth/logout` - Logout
- `GET /api/appointments` - List all appointments (requires session)
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment status (requires session)
- `DELETE /api/appointments/:id` - Delete appointment (requires session)

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://127.0.0.1:3001   # optionnel : par défaut, le dev passe par le proxy Vite
```

### Backend (server/.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:8080,https://brow-bloom-app.vercel.app
```

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` format
- Ensure database is running/accessible
- Check firewall rules
- Check the PostgreSQL role has SELECT/INSERT/UPDATE/DELETE (see `server/setup_limited_role.sql`)

### CORS Error
- Frontend must use correct API URL
- Backend CORS allows only `ALLOWED_ORIGINS` (never use `*` with credentials)

### Admin Shows "Loading…" / Redirect Loop
- Clear the site data (`localStorage`) for the domain, then log in again
- This happens when a leftover `role=admin` exists without a valid session cookie

## Production Deployment

### Backend
Deploy to Vercel:
1. Set environment variables (DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS avec l'URL exacte du front)
2. Deploy from GitHub

### Frontend
Deploy to Vercel:
1. `VITE_API_URL` must point to the deployed backend (`https://brow-bloom-api...`)
2. Deploy

En production, le cookie de session utilise `Secure` + `SameSite=None` (HTTPS
nécessaire). Depuis le navigateur, le front et l'API doivent être sur des
origines listées dans `ALLOWED_ORIGINS`.
