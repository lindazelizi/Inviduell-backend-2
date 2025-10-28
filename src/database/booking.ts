import type { SupabaseClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import type { NewBooking } from "../types/booking.js";

export async function listBookings(sb: SupabaseClient) {
  return sb.from("bookings").select("*").order("created_at", { ascending: false });
}

export async function getBooking(sb: SupabaseClient, id: string) {
  return sb.from("bookings").select("*").eq("id", id).single();
}

export async function createBooking(
  sb: SupabaseClient,
  userId: string,                 // <-- bytt namn
  payload: NewBooking
) {
  const { property_id, check_in, check_out } = payload;

  const ci = dayjs(check_in);
  const co = dayjs(check_out);
  const nights = co.diff(ci, "day");

  if (!ci.isValid() || !co.isValid() || nights <= 0) {
    return { data: null, error: { message: "Invalid dates (check_in < check_out required)" } };
  }

  const { data: prop, error: propErr } = await sb
    .from("properties")
    .select("price_per_night")
    .eq("id", property_id)
    .single();

  if (propErr || !prop) {
    return { data: null, error: propErr ?? { message: "Property not found" } };
  }

  const total_price = nights * Number(prop.price_per_night);

  return sb
    .from("bookings")
    .insert({
      property_id,
      user_id: userId,            // <-- viktigt: user_id
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
  let total_price: number | undefined = undefined;

  if (payload.check_in && payload.check_out) {
    const ci = dayjs(payload.check_in);
    const co = dayjs(payload.check_out);
    const nights = co.diff(ci, "day");

    if (!ci.isValid() || !co.isValid() || nights <= 0) {
      return { data: null, error: { message: "Invalid dates (check_in < check_out required)" } };
    }

    let propertyId = payload.property_id;
    if (!propertyId) {
      const { data: current, error: curErr } = await sb
        .from("bookings")
        .select("property_id")
        .eq("id", id)
        .single();

      if (curErr || !current) {
        return { data: null, error: curErr ?? { message: "Booking not found" } };
      }
      propertyId = current.property_id;
    }

    const { data: prop, error: propErr } = await sb
      .from("properties")
      .select("price_per_night")
      .eq("id", propertyId)
      .single();

    if (propErr || !prop) {
      return { data: null, error: propErr ?? { message: "Property not found" } };
    }

    total_price = nights * Number(prop.price_per_night);
  }

  return sb
    .from("bookings")
    .update({ ...payload, ...(total_price !== undefined ? { total_price } : {}) })
    .eq("id", id)
    .select()
    .single();
}

export async function removeBooking(sb: SupabaseClient, id: string) {
  return sb.from("bookings").delete().eq("id", id);
}