# ResTrack Deployment Guide

This repo has three deployable pieces:

- PostgreSQL database
- Express backend in `restrack-backend`
- React frontend in `restrack-frontend`

## Recommended hosting

- Database: Render PostgreSQL, Neon, Supabase, or Railway Postgres
- Backend: Render Web Service
- Frontend: Vercel, Netlify, or Render Static Site

The steps below use Render for the backend/database and Vercel for the frontend.

## 1. Create the hosted PostgreSQL database

Create a PostgreSQL database and copy its external connection string.

Run the schema after the database exists:

```bash
cd restrack-backend
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME" DB_SSL=true npm run migrate
```

Optional seed data:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME" DB_SSL=true npm run seed
```

## 2. Deploy the backend

Create a Render Web Service from this repository.

Settings:

- Root Directory: `restrack-backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```text
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
DB_SSL=true
JWT_SECRET=use-a-long-random-secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

After deploy, open:

```text
https://your-backend-domain.onrender.com/api/health
```

It should return:

```json
{ "ok": true }
```

## 3. Deploy the frontend

Create a Vercel project from this repository.

Settings:

- Root Directory: `restrack-frontend`
- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`

Environment variable:

```text
REACT_APP_API_URL=https://your-backend-domain.onrender.com
```

Redeploy the frontend after changing `REACT_APP_API_URL`; Create React App bakes this value into the production build.

## 4. Update backend CORS

After Vercel gives you the final frontend URL, update the backend `CORS_ORIGIN` value to that exact URL and redeploy the backend.

For multiple allowed frontends, use a comma-separated list:

```text
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com
```

## 5. Final smoke test

Check these in order:

- Backend health page returns `{ "ok": true }`
- Frontend loads online
- Signup/login works
- Researcher can create a study
- TRB can assign reviewers
- Reviewer can submit approval feedback

