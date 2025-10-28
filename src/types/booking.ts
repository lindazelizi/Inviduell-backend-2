export interface NewBooking {
  property_id: string;   // UUID
  check_in: string;      // "YYYY-MM-DD"
  check_out: string;     // "YYYY-MM-DD"
}

export interface Booking extends NewBooking {
  id: string;
  guest_id: string;
  total_price: number;
  created_at: string;
}