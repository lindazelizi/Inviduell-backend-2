import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { optionalAuth, requireAuth } from "../middlewares/auth.js";
import type { User } from "@supabase/supabase-js";

const propertyApp = new Hono();

// LISTA (öppet)
propertyApp.get("/", optionalAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const { data, error } = await sb
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /properties error:", error);
      throw new HTTPException(500, { res: c.json({ error: error.message }, 500) });
    }
    return c.json({ data });
  } catch (err: any) {
    console.error("GET /properties crashed:", err);
    return c.json({ error: err?.message ?? "Server error" }, 500);
  }
});

// HÄMTA en
propertyApp.get("/:id", optionalAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const id = c.req.param("id");
    const { data, error } = await sb.from("properties").select("*").eq("id", id).single();
    if (error) return c.json({ error: "Not found" }, 404);
    return c.json({ data });
  } catch (err: any) {
    console.error("GET /properties/:id crashed:", err);
    return c.json({ error: err?.message ?? "Server error" }, 500);
  }
});

// SKAPA (kräver inloggning)
propertyApp.post("/", requireAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const user = c.get("user") as User; // <- TS: user is guaranteed by requireAuth
    const body = await c.req.json();

    const payload = {
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      price_per_night: Number(body.price_per_night ?? 0),
      is_active: body.is_active ?? true,
      owner_id: user.id, // <- kräver kolumnen owner_id
    };

    const { data, error } = await sb
      .from("properties")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("POST /properties error:", error);
      throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
    }

    return c.json({ data }, 201);
  } catch (err: any) {
    console.error("POST /properties crashed:", err);
    return c.json({ error: err?.message ?? "Server error" }, 500);
  }
});

// UPPDATERA (kräver inloggning)
propertyApp.put("/:id", requireAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const id = c.req.param("id");
    const body = await c.req.json();

    const { data, error } = await sb
      .from("properties")
      .update({
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        price_per_night: Number(body.price_per_night ?? 0),
        is_active: body.is_active ?? true,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("PUT /properties/:id error:", error);
      throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
    }
    return c.json({ data });
  } catch (err: any) {
    console.error("PUT /properties/:id crashed:", err);
    return c.json({ error: err?.message ?? "Server error" }, 500);
  }
});

// TA BORT (kräver inloggning)
propertyApp.delete("/:id", requireAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const id = c.req.param("id");

    const { error } = await sb.from("properties").delete().eq("id", id);
    if (error) {
      console.error("DELETE /properties/:id error:", error);
      throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
    }
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /properties/:id crashed:", err);
    return c.json({ error: err?.message ?? "Server error" }, 500);
  }
});

export default propertyApp;