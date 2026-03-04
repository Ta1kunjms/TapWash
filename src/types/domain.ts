export type UserRole = "customer" | "shop_owner" | "admin";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "washing"
  | "drying"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";
export type PaymentMethod = "cod" | "gcash" | "card";
export type DeliveryStatus = "assigned" | "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  city_id: string | null;
  created_at: string;
}

export interface LaundryShop {
  id: string;
  owner_id: string;
  shop_name: string;
  description: string | null;
  location: string;
  city_id: string | null;
  price_per_kg: number;
  commission_percentage: number;
  is_verified: boolean;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  shop_id: string;
  name: string;
  price_per_kg: number;
}

export interface Order {
  id: string;
  customer_id: string;
  shop_id: string;
  service_id: string;
  weight_estimate: number;
  total_price: number;
  delivery_fee: number;
  status: OrderStatus;
  pickup_date: string;
  delivery_date: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  pickup_address: string | null;
  dropoff_address: string | null;
  promo_code: string | null;
  discount_amount: number;
  payment_reference: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  distance_km: number | null;
  eta_minutes: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  rating: number;
  comment: string | null;
}

export interface Rider {
  id: string;
  profile_id: string;
  city_id: string | null;
  is_available: boolean;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string | null;
  status: DeliveryStatus;
  assigned_at: string;
  picked_at: string | null;
  delivered_at: string | null;
  eta_minutes: number | null;
  notes: string | null;
}

export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discount_type: "fixed" | "percent";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}
