import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { optionalAuth } from "../middlewares/auth.js";

const authApp = new Hono();

// Logga in – Supabase sätter cookies via SSR-klienten i din middleware
authApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: "Invalid credentials" }, 400) });
  }

  // Returnera något enkelt som frontenden kan använda
  return c.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
  });
});

// Registrera användare
authApp.post("/register", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");

  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
  }

  return c.json({
    ok: true,
    user: { id: data.user?.id, email: data.user?.email },
  });
});

// Vem är jag? (används av frontendens UserContext/PageWrapper)
authApp.get("/me", optionalAuth, (c) => {
  const user = c.get("user"); // sätts i withSupabase() i din middleware
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json({ id: user.id, email: user.email });
});

// Logga ut – rensar session/cookies
authApp.post("/logout", async (c) => {
  const sb = c.get("supabase");
  const { error } = await sb.auth.signOut();
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
  }
  return c.json({ ok: true });
});

export default authApp;