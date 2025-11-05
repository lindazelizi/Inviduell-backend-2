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

const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_SECURE = IS_PROD;
const COOKIE_SAMESITE: "none" | "lax" | "strict" = IS_PROD ? "none" : "lax";

function makeClient(c: Context) {
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
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
            path: "/",
          });
        });
      },
    },
  });
}

export async function withSupabase(c: Context, next: Next) {
  if (!c.get("supabase")) {
    const sb = makeClient(c);
    c.set("supabase", sb);

    const auth = c.req.header("authorization");
    let user: User | null = null;

    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7).trim();
      const { data } = await sb.auth.getUser(token);
      user = data?.user ?? null;
    }

    if (!user) {
      const { data } = await sb.auth.getUser();
      user = data?.user ?? null;
    }

    c.set("user", user);
  }
  return next();
}

export const optionalAuth = withSupabase;

export async function requireAuth(c: Context, next: Next) {
  await withSupabase(c, async () => {});
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Otillåtet" });
  return next();
}