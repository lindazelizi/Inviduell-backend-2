import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { optionalAuth } from "../middlewares/auth.js";

const authApp = new Hono();

/**
 * POST /auth/register
 * body: { email, password, name?, role?: 'guest'|'host' }
 * - Skapar användare i Supabase Auth
 * - Försöker autologga in (om projektinställningarna tillåter)
 * - Upsertar profile (name/role) när session finns
 */
authApp.post("/register", async (c) => {
  const { email, password, name, role } = await c.req.json();
  const sb = c.get("supabase");

  const { error } = await sb.auth.signUp({ email, password });
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
  }

  // Försök autologga in direkt (om tillåtet i projektets auth-inställningar)
  await sb.auth.signInWithPassword({ email, password }).catch(() => null);

  // Om vi nu har en session: skapa/uppdatera profil
  const { data: me } = await sb.auth.getUser();
  if (me?.user) {
    const prof = {
      user_id: me.user.id,
      name: name ?? null,
      role: role === "host" ? "host" : "guest",
    };
    await sb.from("profiles").upsert(prof, { onConflict: "user_id" });
  }

  return c.json({ ok: true });
});

/**
 * POST /auth/login
 * body: { email, password }
 */
authApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: "Invalid credentials" }, 400) });
  }
  return c.json({ ok: true });
});

/**
 * GET /auth/me  -> { id, email, name, role }
 */
authApp.get("/me", optionalAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Not authenticated" }, 401);

  const { data: profile } = await sb
    .from("profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .single();

  return c.json({
    id: user.id,
    email: user.email,
    name: profile?.name ?? null,
    role: profile?.role ?? "guest",
  });
});

/**
 * POST /auth/logout
 */
authApp.post("/logout", async (c) => {
  const sb = c.get("supabase");
  const { error } = await sb.auth.signOut();
  if (error) {
    throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
  }
  return c.json({ ok: true });
});

export default authApp;