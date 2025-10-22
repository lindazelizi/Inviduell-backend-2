import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { optionalAuth } from './middlewares/auth.js';
import propertyApp from './routes/properties.js';
import { supabase } from './lib/supabase.js'; // kvar för test GET /

const app = new Hono();
app.use('*', optionalAuth);
app.route('/auth', (await import('./routes/auth.js')).authApp);

app.get('/', async (c) => {
  const { data } = await supabase.from('properties').select('*').limit(1);
  return c.json({ ok: true, service: 'bnb-api', data: data ?? [] });
});

app.route('/properties', propertyApp);

const port = Number(process.env.HONO_PORT) || 5177;
console.log(`API running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });