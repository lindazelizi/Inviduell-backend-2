import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Property } from "../types/property.js";
import { supabase } from "../lib/supabase.js";

export async function listProperties(): Promise<Property[]> {
  const res: PostgrestSingleResponse<Property[]> = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  return res.data ?? [];
}