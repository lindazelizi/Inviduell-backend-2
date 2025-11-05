import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewProperty } from '../types/property.js';

export async function listPublicProperties(sb: SupabaseClient) {
  return sb
    .from('properties')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
}

export async function listMyProperties(sb: SupabaseClient, ownerId: string) {
  return sb
    .from('properties')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
}

export async function getPropertyById(sb: SupabaseClient, id: string) {
  return sb
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createProperty(
  sb: SupabaseClient,
  payload: NewProperty & { owner_id: string }
) {
  return sb
    .from('properties')
    .insert(payload)
    .select()
    .single();
}

export async function updateProperty(
  sb: SupabaseClient,
  id: string,
  patch: Partial<NewProperty>
) {
  // RLS ser till att bara ägaren får uppdatera
  return sb
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteProperty(sb: SupabaseClient, id: string) {
  // RLS ser till att bara ägaren får radera
  return sb
    .from('properties')
    .delete()
    .eq('id', id);
}