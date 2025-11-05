export interface NewProperty {
  owner_id: string;
  title: string;
  description?: string;
  location?: string;
  price_per_night: number;
  is_active?: boolean;
}

export interface Property extends NewProperty {
  id: string;
  created_at: string;
}