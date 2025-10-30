import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { optionalAuth } from "./middlewares/auth.js";
import propertyApp from "./routes/properties.js";
import authApp from "./routes/auth.js";
import bookingApp from "./routes/bookings.js";
import { supabase } from "./lib/supabase.js";

const app = new Hono();

/**
 * CORS för frontend-kommunikation – MÅSTE ligga före auth och routes
 */
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"], // lägg till fler origins vid behov
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true, // behövs för cookies
  })
);

/**
 * Supabase-cookie auth på alla requests (efter CORS, före routes)
 */
app.use("*", optionalAuth);

/**
 * Valfri test-endpoint
 */
app.get("/", async (c) => {
  const { data, error } = await supabase.from("properties").select("*").limit(1);
  if (error) return c.json({ ok: false, error: error.message });
  return c.json({ ok: true, service: "bnb-api", data });
});

/**
 * Routes
 */
app.route("/auth", authApp);
app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

const port = Number(process.env.HONO_PORT) || 5177;
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });