# CS128.1-ResTrack

ResTrack is split into:

- `restrack-frontend`: Create React App frontend
- `restrack-backend`: Express API
- PostgreSQL database

## Setup (quick)

### Backend

- Copy `restrack-backend/.env.example` to `restrack-backend/.env`
- Fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`
- Run:

```bash
cd restrack-backend
npm install
npm run dev
```

### Frontend

- Copy `restrack-frontend/.env.example` to `restrack-frontend/.env`
- Set `REACT_APP_API_URL` to the backend URL. For local dev, keep `http://localhost:5000`.
- Run:

```bash
cd restrack-frontend
npm install
npm start
```

## Production deployment

See `DEPLOYMENT.md`.
