import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import type { NewBooking } from "../types/booking.js";
import * as db from "../database/booking.js";

const bookingApp = new Hono();

/**
 * Lista bokningar för INLOGGAD användare
 * (vi skickar in user.id → RLS + explicit filter)
 */
bookingApp.get("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!; // garanteras av requireAuth
  const { data, error } = await db.listBookings(sb, user.id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

/**
 * Hämta en bokning (RLS skyddar åtkomst)
 */
bookingApp.get("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const { data, error } = await db.getBooking(sb, id);
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

/**
 * Skapa bokning – räknar totalpris automatiskt
 */
bookingApp.post("/", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!;
  const body = (await c.req.json()) as NewBooking;

  const { data, error } = await db.createBooking(sb, user.id, body);
  if (error) {
    return c.json(
      { error: (error as any).message ?? "Failed to create booking" },
      400
    );
  }
  return c.json({ data }, 201);
});

/**
 * Uppdatera bokning (räknar om totalpris om båda datum finns)
 */
bookingApp.put("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");
  const body = (await c.req.json()) as Partial<NewBooking>;

  const { data, error } = await db.updateBooking(sb, id, body);
  if (error) {
    return c.json(
      { error: (error as any).message ?? "Failed to update booking" },
      400
    );
  }
  return c.json({ data });
});

/**
 * Ta bort bokning
 */
bookingApp.delete("/:id", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const id = c.req.param("id");

  const { error } = await db.removeBooking(sb, id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ message: "Booking deleted successfully" }, 200);
});

export default bookingApp;