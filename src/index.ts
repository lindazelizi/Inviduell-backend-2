import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

import { optionalAuth } from "./middlewares/auth.js";
import authApp from "./routes/auth.js";
import propertyApp from "./routes/properties.js";
import bookingApp from "./routes/bookings.js";
import storageApp from "./routes/storage.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("*", optionalAuth);

app.route("/auth", authApp);
app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);
app.route("/storage", storageApp);

const port = Number(process.env.PORT ?? process.env.HONO_PORT ?? 5177);
console.log(`Server startad på http://localhost:${port}`);
serve({ fetch: app.fetch, port });