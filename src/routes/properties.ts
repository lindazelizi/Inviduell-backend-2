import { Hono } from 'hono';
import { requireAuth } from '../middlewares/auth.js';
import type { NewProperty } from '../types/property.js';
import {
  listPublicProperties,
  listMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../database/property.js';

const propertyApp = new Hono();

// LISTA (offentligt – bara aktiva)
propertyApp.get('/', async (c) => {
  const sb = c.get('supabase');
  const { data, error } = await listPublicProperties(sb);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

// MINA (kräver inloggning)
propertyApp.get('/mine', requireAuth, async (c) => {
  const sb = c.get('supabase');
  const user = c.get('user')!;
  const { data, error } = await listMyProperties(sb, user.id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

// HÄMTA EN (offentligt om aktiv, annars ägaren – låt RLS avgöra om rad returneras)
propertyApp.get('/:id', async (c) => {
  const sb = c.get('supabase');
  const id = c.req.param('id');
  const { data, error } = await getPropertyById(sb, id);
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

// SKAPA (kräver inloggning)
propertyApp.post('/', requireAuth, async (c) => {
  const sb = c.get('supabase');
  const user = c.get('user')!;
  const body = await c.req.json<NewProperty>();
  const payload = { ...body, owner_id: user.id };

  const { data, error } = await createProperty(sb, payload);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data }, 201);
});

// UPPDATERA (kräver inloggning, RLS = endast ägaren)
propertyApp.put('/:id', requireAuth, async (c) => {
  const sb = c.get('supabase');
  const id = c.req.param('id');
  const patch = await c.req.json<Partial<NewProperty>>();

  const { data, error } = await updateProperty(sb, id, patch);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

// RADERA (kräver inloggning, RLS = endast ägaren)
propertyApp.delete('/:id', requireAuth, async (c) => {
  const sb = c.get('supabase');
  const id = c.req.param('id');

  const { error } = await deleteProperty(sb, id);
  if (error) return c.json({ error: error.message }, 400);

  return c.json({ message: 'Property deleted successfully' }, 200);
});

export default propertyApp;