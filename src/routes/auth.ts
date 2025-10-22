import { Hono } from "hono";
export const authApp = new Hono();

authApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: "Invalid credentials" }, 400);
  return c.json({ user: data.user });
});

authApp.post("/register", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ user: data.user });
});