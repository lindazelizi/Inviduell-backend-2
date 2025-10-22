import type { Context, Next } from "hono";
import { setCookie } from "hono/cookie";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient;
    user: User | null;
  }
}

function createSupabaseForRequest(c: Context) {
  // Bedöm om vi kör över https (prod) eller http (lokalt)
  const isProd =
    c.req.url.startsWith("https://") ||
    process.env.NODE_ENV === "production";

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header("Cookie") ?? "").map(
            ({ name, value }) => ({ name, value: value ?? "" })
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(c, name, value, {
              ...options,
              httpOnly: true,
              secure: isProd,      // <— viktigt: false i dev (http)
              sameSite: "lax",
              path: "/",
            });
          });
        },
      },
    }
  );
}

export async function optionalAuth(c: Context, next: Next) {
  if (!c.get("supabase")) {
    const sb = createSupabaseForRequest(c);
    c.set("supabase", sb);
    const { data: { user }, error } = await sb.auth.getUser();
    c.set("user", error ? null : user);
  }
  return next();
}

export async function requireAuth(c: Context, next: Next) {
  await optionalAuth(c, async () => {});
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  return next();
}