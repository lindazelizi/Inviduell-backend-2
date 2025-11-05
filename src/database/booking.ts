import type { SupabaseClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import type { NewBooking } from "../types/booking.js";

function invalidDates(ci: string, co: string) {
  const a = dayjs(ci);
  const b = dayjs(co);
  const nights = b.diff(a, "day");
  return { a, b, nights, ok: a.isValid() && b.isValid() && nights > 0 };
}

export async function listBookings(sb: SupabaseClient, userId: string) {
  return sb
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function getBooking(sb: SupabaseClient, id: string) {
  return sb.from("bookings").select("*").eq("id", id).single();
}

export async function createBooking(
  sb: SupabaseClient,
  userId: string,
  payload: NewBooking
) {
  const { property_id, check_in, check_out } = payload;

  const { a, b, nights, ok } = invalidDates(check_in, check_out);
  if (!ok) return { data: null, error: { message: "Ogiltiga datum (check_in måste vara före check_out)" } };

  const { data: prop, error: propErr } = await sb
    .from("properties")
    .select("price_per_night")
    .eq("id", property_id)
    .single();
  if (propErr || !prop) return { data: null, error: propErr ?? { message: "Hittar inte boendet" } };

  const { data: conflict, error: conflictErr } = await sb
    .from("bookings")
    .select("id")
    .eq("property_id", property_id)
    .lt("check_in", check_out)
    .gt("check_out", check_in)
    .maybeSingle();
  if (conflictErr) return { data: null, error: conflictErr };
  if (conflict) return { data: null, error: { message: "Datumen krockar med en annan bokning" } };

  const total_price = nights * Number(prop.price_per_night);

  return sb
    .from("bookings")
    .insert({
      property_id,
      user_id: userId,
      check_in,
      check_out,
      total_price,
    })
    .select()
    .single();
}

export async function updateBooking(
  sb: SupabaseClient,
  id: string,
  payload: Partial<NewBooking>
) {
  const { data: current, error: curErr } = await sb
    .from("bookings")
    .select("property_id, check_in, check_out")
    .eq("id", id)
    .single();
  if (curErr || !current) return { data: null, error: curErr ?? { message: "Hittar inte bokningen" } };

  const property_id = payload.property_id ?? current.property_id;
  const check_in = payload.check_in ?? current.check_in;
  const check_out = payload.check_out ?? current.check_out;

  const { nights, ok } = invalidDates(check_in, check_out);
  if (!ok) return { data: null, error: { message: "Ogiltiga datum (check_in måste vara före check_out)" } };

  const { data: conflict, error: conflictErr } = await sb
    .from("bookings")
    .select("id")
    .eq("property_id", property_id)
    .neq("id", id)
    .lt("check_in", check_out)
    .gt("check_out", check_in)
    .maybeSingle();
  if (conflictErr) return { data: null, error: conflictErr };
  if (conflict) return { data: null, error: { message: "Datumen krockar med en annan bokning" } };

  const { data: prop, error: propErr } = await sb
    .from("properties")
    .select("price_per_night")
    .eq("id", property_id)
    .single();
  if (propErr || !prop) return { data: null, error: propErr ?? { message: "Hittar inte boendet" } };

  const total_price = nights * Number(prop.price_per_night);

  return sb
    .from("bookings")
    .update({ check_in, check_out, property_id, total_price })
    .eq("id", id)
    .select()
    .single();
}

export async function removeBooking(sb: SupabaseClient, id: string) {
  return sb.from("bookings").delete().eq("id", id);
}