import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors"; // 👈 nytt
import { optionalAuth } from "./middlewares/auth.js";
import propertyApp from "./routes/properties.js";
import authApp from "./routes/auth.js";
import { supabase } from "./lib/supabase.js";
import bookingApp from "./routes/bookings.js";

const app = new Hono();

// ✅ CORS för frontend-kommunikation
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ valfritt test-endpoint
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