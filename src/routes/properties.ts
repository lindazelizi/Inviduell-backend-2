import { Hono } from "hono";
import { requireAuth, withSupabase } from "../middlewares/auth.js";
import type { User } from "@supabase/supabase-js";

type NewPropertyBody = {
  title: string;
  description?: string | null;
  location?: string | null;
  price_per_night: number;
  is_active?: boolean;
  main_image_url?: string | null; // lagra storage-stig eller null
  image_urls?: string[];          // lagra storage-stigar
};

type UpdatePropertyBody = Partial<NewPropertyBody>;

const propertyApp = new Hono();

/**
 * GET /properties
 * Publik lista över aktiva annonser
 */
propertyApp.get("/", withSupabase, async (c) => {
  const sb = c.get("supabase");
  const { data, error } = await sb
    .from("properties")
    .select("id,title,price_per_night,is_active,location,main_image_url,image_urls,owner_id")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

/**
 * GET /properties/mine
 * Lista värdens egna annonser (kräver inloggning + att rollen är host)
 */
propertyApp.get("/mine", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  // (valfritt) kontroll: måste vara host
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (pErr) return c.json({ error: pErr.message }, 400);
  if (!profile || profile.role !== "host") {
    return c.json({ error: "Endast värdar kan visa sina annonser." }, 403);
  }

  const { data, error } = await sb
    .from("properties")
    .select("id,title,price_per_night,is_active,location,main_image_url,image_urls,owner_id")
    .eq("owner_id", user.id) // ← visar bara ägarens
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

/**
 * GET /properties/:id
 * Visa en specifik annons (publikt)
 */
propertyApp.get("/:id", withSupabase, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");

  const { data, error } = await sb
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

/**
 * POST /properties
 * Skapa annons – sätter owner_id = inloggad användare
 * Kräver att profilen har role = 'host'
 */
propertyApp.post("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  console.log("insert as user", user.id);

  // Säkerställ host-roll
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (pErr) return c.json({ error: pErr.message }, 400);
  if (!profile || profile.role !== "host") {
    return c.json({ error: "Endast värdar kan skapa annonser." }, 403);
  }

  const body = (await c.req.json()) as NewPropertyBody;

  const payload = {
    title: String(body.title ?? "").trim(),
    description: body.description ?? null,
    location: body.location ?? null,
    price_per_night: Number(body.price_per_night ?? 0),
    is_active: body.is_active ?? true,
    main_image_url: body.main_image_url ?? null,
    image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
    owner_id: user.id, // ← viktigt för RLS
  };

  if (!payload.title) return c.json({ error: "title is required" }, 400);

  const { data, error } = await sb
    .from("properties")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("properties insert error:", error);
    return c.json({ error: error.message }, 403);
  }
  return c.json({ data }, 201);
});

/**
 * PATCH /properties/:id
 * Uppdatera en egen annons (ägarskap kontrolleras av RLS)
 */
propertyApp.patch("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const body = (await c.req.json()) as UpdatePropertyBody;

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = String(body.title ?? "").trim();
  if (body.description !== undefined) update.description = body.description ?? null;
  if (body.location !== undefined) update.location = body.location ?? null;
  if (body.price_per_night !== undefined) update.price_per_night = Number(body.price_per_night ?? 0);
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);
  if (body.main_image_url !== undefined) update.main_image_url = body.main_image_url ?? null;
  if (body.image_urls !== undefined) update.image_urls = Array.isArray(body.image_urls) ? body.image_urls : [];

  const { data, error } = await sb
    .from("properties")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("properties update error:", error);
    return c.json({ error: error.message }, 403);
  }
  return c.json({ data });
});

/**
 * DELETE /properties/:id
 * Ta bort en egen annons (ägarskap kontrolleras av RLS)
 */
propertyApp.delete("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");

  const { data, error } = await sb
    .from("properties")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("properties delete error:", error);
    return c.json({ error: error.message }, 403);
  }
  return c.json({ data });
});

export default propertyApp;