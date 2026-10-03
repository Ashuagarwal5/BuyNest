import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { TRACKING_TOKEN_HEADER } from './modules/orders/orders.schemas.js';

const API_PREFIX = '/api/v1';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      // With no origins configured, development allows any browser origin and production
      // allows none. Native mobile apps send no Origin header and are unaffected by CORS.
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : !env.isProduction,
      allowedHeaders: ['Content-Type', TRACKING_TOKEN_HEADER],
      exposedHeaders: ['Idempotent-Replayed'],
    })
  );
  app.use(express.json({ limit: '100kb' }));

  if (!env.isTest) {
    app.use(requestLogger);
  }

  app.use(healthRouter);
  app.use(API_PREFIX, catalogRouter);
  app.use(API_PREFIX, ordersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
