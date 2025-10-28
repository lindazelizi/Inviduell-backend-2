import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import type { NewBooking } from "../types/booking.js";
import * as db from "../database/booking.js";

const bookingApp = new Hono();

// Lista bokningar för inloggad (RLS visar egna + som värd på egna properties)
bookingApp.get("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const { data, error } = await db.listBookings(sb);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

// Hämta en bokning
bookingApp.get("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await db.getBooking(sb, id);
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

// Skapa bokning – räknar totalpris automatiskt
bookingApp.post("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!; // ⬅️ ändringen: non-null assertion
  const body = (await c.req.json()) as NewBooking;

  const { data, error } = await db.createBooking(sb, user.id, body);
  if (error) return c.json({ error: (error as any).message ?? "Failed to create booking" }, 400);
  return c.json({ data }, 201);
});

// Uppdatera t.ex. datum (räknar om totalpris om båda datum medföljer)
bookingApp.put("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const body = (await c.req.json()) as Partial<NewBooking>;

  const { data, error } = await db.updateBooking(sb, id, body);
  if (error) return c.json({ error: (error as any).message ?? "Failed to update booking" }, 400);
  return c.json({ data });
});

// Ta bort
bookingApp.delete("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");

  const { error } = await db.removeBooking(sb, id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ message: "Booking deleted successfully" }, 200);
});

export default bookingApp;