import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import type { User } from "@supabase/supabase-js";

const storageApp = new Hono();

storageApp.post("/upload", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user") as User;

  const form = await c.req.formData();
  const file = form.get("file");
  const folder = (form.get("folder") as string) || "props";

  if (!(file instanceof File)) return c.json({ error: "Ingen fil angiven" }, 400);

  const safeFolder = String(folder).replace(/[^a-z0-9/_-]+/gi, "-").toLowerCase();
  const origName = file.name || `file-${Date.now()}`;
  const safeName = origName.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
  const path = `${user.id}/${safeFolder}/${Date.now()}-${safeName}`.replace(/\/+/g, "/");

  const { error } = await sb.storage.from("properties").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return c.json({ error: error.message }, 400);

  return c.json({ bucket: "properties", path });
});

export default storageApp;