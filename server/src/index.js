import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ensureDatabase, ensureSchema } from './db.js';
import { seedSurvey, seedAdmin } from './seed.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// API 404s should return JSON (not the SPA index).
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production, serve the built React frontend so the whole app is one deployable unit.
// CLIENT_DIST can override the location; defaults to ../client/dist relative to /server/src.
const clientDist = process.env.CLIENT_DIST || path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  // SPA fallback: send index.html for any non-API route.
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  console.log(`Serving frontend from ${clientDist}`);
}

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await ensureDatabase();
  await ensureSchema();
  const seeded = await seedSurvey();
  const admin = await seedAdmin();
  console.log(`DB ready. survey=${seeded ? 'seeded' : 'existing'} admin=${admin ? 'created' : 'existing'}`);
  app.listen(PORT, () => console.log(`KLEF Survey API listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
