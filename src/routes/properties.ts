import { Hono } from "hono";
import { requireAuth, withSupabase } from "../middlewares/auth.js";
import type { User } from "@supabase/supabase-js";

type NewPropertyBody = {
  title: string;
  description?: string | null;
  location?: string | null;
  price_per_night: number;
  is_active?: boolean;
  main_image_url?: string | null;
  image_urls?: string[];
};

type UpdatePropertyBody = Partial<NewPropertyBody>;

const propertyApp = new Hono();

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

propertyApp.get("/mine", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (pErr) return c.json({ error: pErr.message }, 400);
  if (!profile || profile.role !== "host") return c.json({ error: "Endast värdar kan visa sina annonser" }, 403);

  const { data, error } = await sb
    .from("properties")
    .select("id,title,price_per_night,is_active,location,main_image_url,image_urls,owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

propertyApp.get("/mine-with-bookings", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (pErr) return c.json({ error: pErr.message }, 400);
  if (!profile || profile.role !== "host") return c.json({ error: "Endast värdar kan visa sina annonser" }, 403);

  const { data: props, error: propsErr } = await sb
    .from("properties")
    .select("id,title,location,price_per_night,is_active")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (propsErr) return c.json({ error: propsErr.message }, 400);

  const propIds = (props ?? []).map(p => p.id);
  if (propIds.length === 0) return c.json({ data: [] });

  const { data: bookings, error: bErr } = await sb
    .from("bookings")
    .select("id,property_id,user_id,check_in,check_out")
    .in("property_id", propIds)
    .order("check_in", { ascending: true });
  if (bErr) return c.json({ error: bErr.message }, 400);

  const userIds = Array.from(new Set((bookings ?? []).map(b => b.user_id).filter(Boolean)));
  let guestMap = new Map<string, { name: string | null; email: string | null }>();

  if (userIds.length > 0) {
    const { data: guests, error: gErr } = await sb
      .from("profiles")
      .select("user_id,name")
      .in("user_id", userIds);
    if (gErr) return c.json({ error: gErr.message }, 400);
    guestMap = new Map((guests ?? []).map(g => [g.user_id as string, { name: g.name ?? null, email: null }]));
  }

  const byProp = new Map<string, any[]>();
  (props ?? []).forEach(p => byProp.set(p.id, []));
  (bookings ?? []).forEach(b => {
    const arr = byProp.get(b.property_id);
    if (arr) {
      arr.push({
        id: b.id,
        property_id: b.property_id,
        check_in: b.check_in,
        check_out: b.check_out,
        guest: guestMap.get(b.user_id) ?? { name: null, email: null },
      });
    }
  });

  const data = (props ?? []).map(p => ({
    ...p,
    bookings: byProp.get(p.id) ?? [],
  }));

  return c.json({ data });
});

propertyApp.get("/:id/booked-ranges", withSupabase, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await sb.rpc("booked_ranges", { pid: id });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

propertyApp.get("/:id", withSupabase, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await sb.from("properties").select("*").eq("id", id).single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

propertyApp.post("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (pErr) return c.json({ error: pErr.message }, 400);
  if (!profile || profile.role !== "host") return c.json({ error: "Endast värdar kan skapa annonser" }, 403);

  const body = (await c.req.json()) as NewPropertyBody;

  const payload = {
    title: String(body.title ?? "").trim(),
    description: body.description ?? null,
    location: body.location ?? null,
    price_per_night: Number(body.price_per_night ?? 0),
    is_active: body.is_active ?? true,
    main_image_url: body.main_image_url ?? null,
    image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
    owner_id: user.id,
  };

  if (!payload.title) return c.json({ error: "title krävs" }, 400);

  const { data, error } = await sb.from("properties").insert(payload).select().single();
  if (error) return c.json({ error: error.message }, 403);
  return c.json({ data }, 201);
});

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

  const { data, error } = await sb.from("properties").update(update).eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 403);
  return c.json({ data });
});

propertyApp.delete("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await sb.from("properties").delete().eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 403);
  return c.json({ data });
});

export default propertyApp;