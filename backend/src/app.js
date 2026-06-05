import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { UPLOADS_DIR } from './middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Behind a hosting proxy (Render/Railway/etc.) so req.protocol reflects the
  // original https scheme — this keeps generated image URLs https (no mixed content).
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin / curl (no origin) and configured client origins
        if (!origin || config.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, true); // permissive for the demo; tighten in production
      },
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded images
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.use('/api', apiRoutes);

  // 404 for unknown API routes
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Central error handler (multer + thrown errors)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[error]', err.message);
    const status = err.status || (err.message?.includes('Only image') ? 400 : 500);
    res.status(status).json({ error: err.message || 'Server error' });
  });

  return app;
}
