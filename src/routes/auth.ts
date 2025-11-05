import { Hono } from "hono";
import { optionalAuth } from "../middlewares/auth.js";

const authApp = new Hono();

authApp.post("/register", async (c) => {
  const { email, password, name, role } = await c.req.json();
  const sb = c.get("supabase");

  const { error } = await sb.auth.signUp({ email, password });
  if (error) return c.json({ error: error.message }, 400);

  await sb.auth.signInWithPassword({ email, password }).catch(() => null);
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

authApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: "Fel e-post eller lösenord" }, 400);

  return c.json({ ok: true });
});

authApp.get("/me", optionalAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user");
  if (!user) return c.json({ error: "Inte inloggad" }, 401);

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

authApp.post("/logout", async (c) => {
  const sb = c.get("supabase");
  const { error } = await sb.auth.signOut();
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

export default authApp;