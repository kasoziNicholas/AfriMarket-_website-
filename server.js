/**
 * AfriMarket Equities - hardened backend
 * Express + Helmet (CSP) + rate limiting + optional Redis cache.
 * Serves the static frontend from /public and JSON from /api.
 */
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');

const PORT = Number(process.env.PORT) || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';
const CACHE_TTL_SECONDS = 900; // 15 minutes
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const app = express();
app.disable('x-powered-by');

// Behind a reverse proxy (Render, Railway, Nginx, Cloudflare) set TRUST_PROXY=1
// so rate limiting sees the real client IP instead of the proxy's.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

/* ---------- Security headers (strict CSP: everything is self-hosted) ---------- */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(IS_PROD ? { upgradeInsecureRequests: [] } : {})
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));
app.use(compression());

/* ---------- CORS: same-origin by default, explicit allow-list otherwise ---------- */
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);                       // same-origin / curl
    return cb(null, ALLOWED_ORIGINS.includes(origin));        // allow-list only
  },
  methods: ['GET'],
  maxAge: 600
}));

/* ---------- Rate limiting (API only) ---------- */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

/* ---------- Data layer: JSON files + optional Redis cache ---------- */
function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'));
}
const SOURCES = {
  companies: () => loadJson('companies.json'),
  exchanges: () => loadJson('exchanges.json')
};
// TODO: replace SOURCES.* with your licensed market-data provider.

let redis = null;
async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('REDIS_URL not set: using in-memory cache.');
    return;
  }
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 3000, reconnectStrategy: (n) => Math.min(n * 200, 5000) }
    });
    client.on('error', (err) => console.error('Redis error:', err.message));
    await client.connect();
    redis = client;
    console.log('Connected to Redis.');
  } catch (err) {
    console.error('Redis unavailable, continuing without it:', err.message);
  }
}

const memCache = new Map(); // fallback when Redis is missing or down

async function getCached(key) {
  if (redis && redis.isReady) {
    try {
      const hit = await redis.get(key);
      if (hit) return { source: 'cache', payload: JSON.parse(hit) };
    } catch (err) { console.error('Redis read failed:', err.message); }
  }
  const mem = memCache.get(key);
  if (mem && mem.expires > Date.now()) return { source: 'memory', payload: mem.payload };

  const payload = SOURCES[key]();
  memCache.set(key, { payload, expires: Date.now() + CACHE_TTL_SECONDS * 1000 });
  if (redis && redis.isReady) {
    try { await redis.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(payload)); }
    catch (err) { console.error('Redis write failed:', err.message); }
  }
  return { source: 'origin', payload };
}

function jsonRoute(key) {
  return async (_req, res) => {
    try {
      const { source, payload } = await getCached(key);
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ source, ...payload });
    } catch (err) {
      console.error(`Error serving ${key}:`, err.message);   // never log IPs or bodies
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
}

app.get('/api/companies', jsonRoute('companies'));
app.get('/api/exchanges', jsonRoute('exchanges'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

/* ---------- Static frontend ---------- */
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'index.html',
  maxAge: IS_PROD ? '1d' : 0,
  dotfiles: 'ignore'
}));

/* ---------- Fallback error handler ---------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

/* ---------- Start / graceful shutdown ---------- */
let server;
(async () => {
  await initRedis();
  server = app.listen(PORT, () => console.log(`AfriMarket Equities running on port ${PORT}`));
})();

async function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  if (server) server.close();
  if (redis) { try { await redis.quit(); } catch (_) { /* ignore */ } }
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
