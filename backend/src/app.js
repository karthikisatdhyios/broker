import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  // Behind a hosting proxy/load balancer (Elastic Beanstalk/App Runner/etc.) so
  // req.protocol reflects the original https.
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
  // Body parsing that's safe behind platforms that may pre-parse JSON bodies.
  const jsonParser = express.json({ limit: '2mb' });
  const formParser = express.urlencoded({ extended: true });
  app.use((req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('application/json') && req.body && typeof req.body === 'object') {
      return next();
    }
    jsonParser(req, res, (err) => {
      if (err) return next(err);
      formParser(req, res, next);
    });
  });

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
