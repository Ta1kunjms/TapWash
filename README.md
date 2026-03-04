# TapWash (Taglaba)

Production-ready mobile-first laundry marketplace using Next.js App Router + Supabase.

## Stack

- Next.js App Router + TypeScript strict mode
- TailwindCSS (design tokens for TapWash palette)
- Supabase Auth + Postgres + RLS + Realtime
- PWA basics (manifest + service worker + offline page)

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Scripts

- `npm run dev` - run local dev server
- `npm run lint` - run ESLint
- `npm run build` - production build
- `npm run format` - apply Prettier formatting

## Route Groups

- `/(public)` public marketing
- `/(auth)` login/signup
- `/(customer)` booking + order tracking
- `/(shop)` order operations + services
- `/(admin)` shop/user governance

## Database

Initial migration is in `supabase/migrations/202603040001_init.sql` and includes:

- enums: `user_role`, `order_status`, `payment_status`
- normalized tables + constraints + indexes
- RLS policies for customer/shop_owner/admin scopes
- DB trigger to enforce valid order status transitions

## Foodpanda-Style Focus (Recommended Next)

- Address picker + map autocomplete for pickup/dropoff
- Shop cards with ETA, ratings, and promo badges
- Checkout with vouchers, delivery fee rules, and payment intents
- Rider dispatch module for out_for_delivery stage
- In-app chat between customer and shop/rider
- Notification layer (email/SMS/push) for each status transition

## Implemented Marketplace Extensions

- Checkout supports address fields, promo code, and payment method (`cod`, `gcash`, `card`)
- Voucher module with admin creation/activation controls
- Rider dispatch module for assigning riders to ready orders
- Delivery quote engine with API route (`/api/maps/quote`) for fee + ETA + distance estimation
- Address autocomplete suggestions API (`/api/maps/suggest`) with Mapbox support and fallback suggestions
- Dispatch lifecycle controls (`picked_up`, `in_transit`, `delivered`) with order event logging
- Web Push subscription endpoint (`/api/push/subscribe`) with service-worker notifications
- Live rider location stream (`rider_locations`) rendered in customer order tracking panel
- Order event timeline for customer-facing live updates
- Shop cards surface ETA, ratings, and promo badge metadata
