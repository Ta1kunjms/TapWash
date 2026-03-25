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
export type ServicePricingModel = "per_kg" | "per_load";
export type ServiceOptionType = "detergent" | "fabcon" | "addon";
export type ServiceOptionSelectionType = "single" | "multiple";
export type ServiceOptionPriceType = "per_order" | "per_load";

export interface Profile {
  id: string;
  first_name: string | null;
  surname: string | null;
  username: string | null;
  avatar_key: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  city_id: string | null;
  location_permission_status: "granted" | "denied" | "unsupported" | null;
  location_permission_updated_at: string | null;
  location_onboarding_last_prompted_at: string | null;
  created_at: string;
}

export interface LaundryShop {
  id: string;
  owner_id: string;
  shop_name: string;
  description: string | null;
  location: string;
  cover_image_url: string | null;
  city_id: string | null;
  starting_price: number;
  load_capacity_kg: number;
  commission_percentage: number;
  is_verified: boolean;
  created_at: string;
}

export interface ServiceOption {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  price_delta: number;
  price_type: ServiceOptionPriceType;
  is_default: boolean;
  sort_order: number;
}

export interface ServiceOptionGroup {
  id: string;
  service_id: string;
  name: string;
  option_type: ServiceOptionType;
  selection_type: ServiceOptionSelectionType;
  is_required: boolean;
  sort_order: number;
  service_options?: ServiceOption[];
}

export interface ServiceItem {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  pricing_model: ServicePricingModel;
  unit_price: number;
  load_capacity_kg: number | null;
  service_option_groups?: ServiceOptionGroup[];
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
  contact_phone: string | null;
  delivery_instructions: string | null;
  rider_notes: string | null;
  promo_code: string | null;
  discount_amount: number;
  tip_amount: number;
  selected_option_ids: string[];
  service_snapshot: Record<string, unknown>;
  pricing_breakdown: Record<string, unknown>;
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
