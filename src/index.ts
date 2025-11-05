import "dotenv/config"; // <-- Måste vara först
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

import { optionalAuth } from "./middlewares/auth.js";
import authApp from "./routes/auth.js";
import propertyApp from "./routes/properties.js";
import bookingApp from "./routes/bookings.js";
import storageApp from "./routes/storage.js";

const app = new Hono();

// CORS måste ligga före auth/routes
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

// Lägg till Supabase-cookies och refresh på varje request
app.use("*", optionalAuth);

// Routes
app.route("/auth", authApp);
app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);
app.route("/storage", storageApp);

// Starta servern
const port = Number(process.env.HONO_PORT ?? 5177);
console.log(`✅ API running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });