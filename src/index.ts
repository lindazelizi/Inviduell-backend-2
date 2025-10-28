import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { optionalAuth } from "./middlewares/auth.js";
import propertyApp from "./routes/properties.js";
import authApp from "./routes/auth.js";
import { supabase } from "./lib/supabase.js"; // för din test-GET nedan
import bookingApp from "./routes/bookings.js";
const app = new Hono();
app.use("*", optionalAuth);

// Test-root (valfritt)
app.get("/", async (c) => {
  const { data, error } = await supabase.from("properties").select("*").limit(1);
  if (error) return c.json({ ok: false, error: error.message });
  return c.json({ ok: true, service: "bnb-api", data });
});

app.route("/auth", authApp);
app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

const port = Number(process.env.HONO_PORT) || 5177;
console.log(`API running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });