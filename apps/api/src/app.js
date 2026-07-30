import path from 'node:path';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import env from './config/env.js';
import routes from './routes/index.js';
import { sanitize } from './middleware/sanitize.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { dbReady } from './middleware/dbReady.js';

const app = express();

// Nginx orqasida ishlaydi — rate limit va req.ip to'g'ri bo'lishi uchun
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    // /uploads dagi rasmlar boshqa origin'dan yuklanadi
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, cb) {
      // Postman / server-to-server so'rovlarda origin bo'lmaydi
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: ruxsat etilmagan origin'));
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// NoSQL injection himoyasi ($ va . kalitlarini o'chiradi)
app.use(sanitize);

if (!env.isTest) {
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
}

// Yuklangan rasmlar
app.use(
  '/uploads',
  express.static(path.resolve(env.UPLOAD_DIR), {
    maxAge: '30d',
    immutable: true,
  }),
);

// /health baza holatidan qat'i nazar javob berishi kerak — monitoring shunga qaraydi
app.get('/api/health', (req, res) =>
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  }),
);

app.use('/api', apiLimiter, dbReady, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
