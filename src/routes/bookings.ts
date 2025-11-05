import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import type { NewBooking } from "../types/booking.js";
import * as db from "../database/booking.js";

const bookingApp = new Hono();

bookingApp.get("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!;
  const { data, error } = await db.listBookings(sb, user.id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

bookingApp.get("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await db.getBooking(sb, id);
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

bookingApp.post("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!;
  const body = (await c.req.json()) as NewBooking;

  const { data, error } = await db.createBooking(sb, user.id, body);
  if (error) {
    const msg = (error as any).message || "";
    if (msg.toLowerCase().includes("krock") || msg.toLowerCase().includes("overlap")) {
      return c.json({ error: "Datumen krockar med en annan bokning" }, 400);
    }
    if (msg.toLowerCase().includes("ogiltiga datum") || msg.toLowerCase().includes("invalid dates")) {
      return c.json({ error: "Ogiltiga datum" }, 400);
    }
    return c.json({ error: msg || "Kunde inte skapa bokningen" }, 400);
  }
  return c.json({ data }, 201);
});

bookingApp.put("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const body = (await c.req.json()) as Partial<NewBooking>;

  const { data, error } = await db.updateBooking(sb, id, body);
  if (error) {
    const msg = (error as any).message || "";
    if (msg.toLowerCase().includes("krock") || msg.toLowerCase().includes("overlap")) {
      return c.json({ error: "Datumen krockar med en annan bokning" }, 400);
    }
    if (msg.toLowerCase().includes("ogiltiga datum") || msg.toLowerCase().includes("invalid dates")) {
      return c.json({ error: "Ogiltiga datum" }, 400);
    }
    return c.json({ error: msg || "Kunde inte uppdatera bokningen" }, 400);
  }
  return c.json({ data });
});

bookingApp.delete("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { error } = await db.removeBooking(sb, id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ message: "Bokningen har tagits bort" }, 200);
});

export default bookingApp;