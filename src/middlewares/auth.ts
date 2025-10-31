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

// Vi betraktar localhost (olika portar) som "cross-site" ⇒ SameSite=None
// Chrome kräver Secure när SameSite=None (även på localhost är det ok att markera Secure)
const COOKIE_SECURE = true;
const COOKIE_SAMESITE: "none" | "lax" | "strict" = "none";

function createSb(c: Context) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // Läser in alla inkommande cookies från requesten
      getAll() {
        const raw = c.req.header("Cookie") ?? "";
        return parseCookieHeader(raw).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      // Skriv ut eventuella Set-Cookie från Supabase tillbaka till svar till klienten
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(c, name, value, {
            ...options,
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
            path: "/", // viktigt: gör kakan giltig för hela sajten
          });
        });
      },
    },
  });
}

export async function withSupabase(c: Context, next: Next) {
  // Skapa och cacha klienten per request
  if (!c.get("supabase")) {
    const sb = createSb(c);
    c.set("supabase", sb);

    // Läs ut user (kan trigga refresh av session; setAll ovan skriver ut nya kakor)
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();

    // Sätt user i context; vid error/null behandlar vi det som utloggad
    c.set("user", error ? null : user ?? null);
  }

  return next();
}

// Öppen variant (sätter supabase + ev. uppdaterar cookies)
export const optionalAuth = withSupabase;

// Skyddad variant
export async function requireAuth(c: Context, next: Next) {
  await withSupabase(c, async () => {});
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return next();
}