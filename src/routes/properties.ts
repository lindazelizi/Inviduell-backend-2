import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../middlewares/auth.js";
import { createPropertyValidator } from "../validators/property.js";
import type { Property } from "../types/property";

// Klientens POST ska inte få skicka owner_id, id eller created_at
type NewPropertyInput = Omit<Property, "id" | "owner_id" | "created_at">;

const propertyApp = new Hono();

// GET /properties – lista senaste 100
propertyApp.get("/", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new HTTPException(500, { res: c.json({ error: error.message }, 500) });
  }
  return c.json({ data });
});

// POST /properties – kräver login, owner_id = inloggad användare
propertyApp.post("/", requireAuth, createPropertyValidator, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user")!;            // satt av requireAuth
  const input = c.req.valid("json") as NewPropertyInput;

  // Ignorera ev. owner_id i body. Sätt alltid till inloggad användare.
  const payload = { ...input, owner_id: user.id };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new HTTPException(400, { res: c.json({ error: error.message }, 400) });
  }
  return c.json(data as Property, 201);
});

export default propertyApp;