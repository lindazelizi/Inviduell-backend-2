import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();
app.get('/', (c) => c.json({ ok: true, service: 'bnb-api' }));

const port = Number(process.env.PORT || 5177);
console.log(`API running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
