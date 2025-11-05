import type { Context, Next } from "hono";
import { setCookie } from "hono/cookie";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "../lib/supabase.js";
import { HTTPException } from "hono/http-exception";

declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient;
    user: User | null;
  }
}

// 👉 endast säkra kakor i prod/https
const IS_PROD = process.env.NODE_ENV === "production";
// Chrome kräver Secure för SameSite=None, men det funkar inte på http.
// I dev kör vi LAX + !Secure, i prod kör vi NONE + Secure.
const COOKIE_SECURE: boolean = IS_PROD;
const COOKIE_SAMESITE: "none" | "lax" | "strict" = IS_PROD ? "none" : "lax";

function createSb(c: Context) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const raw = c.req.header("Cookie") ?? "";
        return parseCookieHeader(raw).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(c, name, value, {
            ...options,
            // viktigt: dessa styr vi centralt
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
            path: "/", // gör kakan giltig för hela sajten
          });
        });
      },
    },
  });
}

export async function withSupabase(c: Context, next: Next) {
  if (!c.get("supabase")) {
    const sb = createSb(c);
    c.set("supabase", sb);

    const {
      data: { user },
      error,
    } = await sb.auth.getUser();

    c.set("user", error ? null : user ?? null);
  }
  return next();
}

export const optionalAuth = withSupabase;

export async function requireAuth(c: Context, next: Next) {
  await withSupabase(c, async () => { });
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  return next();
}