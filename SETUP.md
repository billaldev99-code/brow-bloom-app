# Setup Guide - Brow Bloom App

## Architecture
- **Frontend**: React + TypeScript + Vite (port 8080)
- **Backend**: Node.js + Express (port 3001)
- **Database**: PostgreSQL (cloud or local)

## Setup PostgreSQL Cloud (Recommended)

### Option 1: Railway (Easiest)
1. Go to https://railway.app
2. Create an account and new project
3. Add PostgreSQL database
4. Copy the DATABASE_URL from Railway
5. Open `server/.env` and paste it in `DATABASE_URL`

### Option 2: Neon
1. Go to https://neon.tech
2. Create account and database
3. Copy connection string
4. Paste in `server/.env`

### Option 3: PlanetScale (MySQL)
Similar to above, copy connection string to `.env`

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
Run this SQL in your PostgreSQL interface:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  service TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_users_email ON users(email);
```

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
Frontend runs on `http://localhost:8080`

### 6. Create First Admin User
1. Go to `http://localhost:8080/auth`
2. Create account
3. In database, update user role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/appointments` - List all appointments (requires token)
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment status (requires token)
- `DELETE /api/appointments/:id` - Delete appointment (requires token)

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development
```

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` format
- Ensure database is running/accessible
- Check firewall rules

### CORS Error
- Frontend must use correct API URL
- Backend has CORS enabled for all origins (change in production)

### Appointments Won't Load
- Check token is saved in localStorage
- Verify user is logged in
- Check browser console for errors

## Production Deployment

### Backend
Deploy to Render, Railway, Heroku:
1. Set environment variables
2. Deploy from GitHub

### Frontend
Deploy to Vercel, Netlify:
1. Update `VITE_API_URL` to production backend URL
2. Deploy

Example production API URL: `https://brow-bloom-api.railway.app`
