# Copilot Instructions for TapWash

These instructions define how AI coding agents (including GitHub Copilot Chat/Agent) should work in this repository.

## Primary Objective

Build and maintain **TapWash** as a production-ready, mobile-first laundry marketplace using Next.js App Router + TypeScript + Supabase while keeping changes safe, minimal, and aligned with existing architecture.

## Tech Stack and Core Constraints

- Framework: Next.js App Router (TypeScript, strict mode)
- Styling: TailwindCSS with existing project tokens/utilities
- Backend/BaaS: Supabase (Auth, Postgres, RLS, Realtime)
- App modes: PWA-capable (`public/manifest.json`, `public/sw.js`, offline route)

Always preserve strict TypeScript correctness and avoid introducing `any` unless there is no practical alternative.

## Environment and Deployment Rules

Required env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Rules:

- Never hardcode secrets, keys, or URLs in source files.
- Never commit real credentials.
- If code needs Supabase at build/runtime, fail gracefully with clear errors.
- Keep local/dev/prod behavior compatible with Vercel builds.

## Repository Structure (Respect Existing Boundaries)

- `src/app/` route groups and pages
  - `/(public)` public pages
  - `/(auth)` authentication flows
  - `/(customer)` customer experience
  - `/(shop)` shop dashboard/ops
  - `/(admin)` admin governance
- `src/components/` reusable UI and feature components
- `src/services/` business/domain service layer
- `src/lib/` shared utilities, constants, roles, validators, Supabase clients
- `src/hooks/` client hooks
- `src/types/` domain types
- `supabase/migrations/` schema and policy evolution

Do not move files across layers unless explicitly requested.

## Coding Principles

1. Fix root causes, not surface symptoms.
2. Keep changes small and focused to the requested scope.
3. Reuse existing utilities/services before adding new abstractions.
4. Match naming and coding style already present in nearby files.
5. Prefer pure helpers and deterministic logic where possible.
6. Add defensive checks around external input and async failures.
7. Avoid introducing new dependencies unless clearly justified.

## Next.js App Router Guidelines

- Use Server/Client Components intentionally:
  - Server Components by default.
  - Add `"use client"` only when interactivity/browser APIs are needed.
- Keep route-level code lean; move reusable logic to `services`, `lib`, or `components`.
- Use `next/navigation` and App Router conventions already used in the codebase.
- Avoid unnecessary dynamic rendering if static/ISR fits.
- Preserve route-group semantics and URL structure.

## Supabase and Data Access Guidelines

- Use existing Supabase client helpers under `src/lib/supabase/`.
- Keep authorization and data access compatible with existing RLS policies.
- Validate inputs before writes using existing validators (`src/lib/validators/`).
- For schema changes:
  - Add new migration files under `supabase/migrations/`.
  - Prefer additive, reversible changes.
  - Include indexes/constraints as needed for correctness/performance.

## Notifications Standard (Mandatory)

- Use `notify` from `src/lib/notify.ts` in app code.
- Do **not** import `sileo` directly in feature components/pages.
- Direct `sileo` import is only valid in:
  - `src/lib/notify.ts`
  - `src/components/ui/toast-provider.tsx`

## UX and UI Rules

- Mobile-first by default.
- Use existing UI primitives from `src/components/ui/` before creating new ones.
- Keep interactions straightforward and accessible.
- Do not introduce new design systems, icon packs, or visual paradigms unless requested.
- Avoid hardcoded colors/spacing inconsistent with existing Tailwind usage.

## Type Safety and Validation

- Keep domain types centralized in `src/types/domain.ts` and related type files.
- Prefer explicit return types for exported functions.
- Narrow unknown/error types safely.
- Ensure form and API payloads are validated before processing.

## Performance and Reliability

- Minimize unnecessary client bundles.
- Avoid duplicate fetches and heavy computations in render paths.
- Handle loading/empty/error states for user-facing flows.
- Ensure realtime/tracking features degrade gracefully when connectivity is poor.

## Testing and Verification Workflow

For code changes, run (at minimum):

1. `npm run lint`
2. `npm run build`

If behavior-specific checks are needed, run targeted local verification relevant to changed routes/components.

Do not claim success without confirming command outcomes.

## Git and Change Management

- Keep commits atomic and descriptive when asked to commit.
- Do not rewrite unrelated code.
- Do not add license/copyright headers unless requested.
- Update docs only when behavior/setup changes.

## What to Avoid

- No placeholder TODO implementations for requested production behavior.
- No silent error swallowing.
- No broad refactors outside task scope.
- No speculative feature additions not asked by the user.
- No breaking public behavior unless explicitly requested.

## Preferred Delivery Format for Agents

When completing a task:

- Briefly state what changed.
- List touched files.
- Mention validation commands run and results.
- Note any follow-up actions needed by the user (e.g., env vars in Vercel).

## Project-Specific Operational Notes

- Vercel builds require Supabase public env vars to be set.
- Keep PWA assets and offline route functional.
- Preserve customer/shop/admin role boundaries in all new logic.

---

If a user instruction conflicts with these guidelines, prioritize the explicit user instruction while keeping safety, correctness, and minimal scope.
