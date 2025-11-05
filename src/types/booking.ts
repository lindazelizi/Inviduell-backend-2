export interface NewBooking {
  property_id: string;   
  check_in: string;     
  check_out: string;     
}

export interface Booking extends NewBooking {
  id: string;
  user_id: string;      
  total_price: number;
  created_at: string;
}