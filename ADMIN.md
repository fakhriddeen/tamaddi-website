# Tamaddi administration

The static dashboard is served at /admin/. Public pages retain their existing build and assets.

## Setup

1. Apply Supabase migrations through 202611240006_restore_customer_support_replies.sql.
2. Create or use an existing Supabase Auth account. In the Supabase SQL editor, grant a specific account access:
   ```sql
   insert into public.tamaddi_administrators(user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict do nothing;
   ```
   No browser operation can grant this role. To revoke access, delete that account's row.
3. Set TAMADDI_ADMIN_SUPABASE_URL and TAMADDI_ADMIN_SUPABASE_PUBLISHABLE_KEY in the website build environment. Existing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are also supported. Only public publishable/anon keys are allowed. Never use a service-role key.
4. Run node website/build.mjs and deploy website/dist using the existing static deployment process. When deploying dist directly, build locally with these variables first.
5. Sign in at /admin/ using the authorized account. There is no registration form.

The login shell is static. All data and mutations require a valid Auth session and a backend lookup in tamaddi_administrators on every RPC. Ordinary users retain owner-only support RLS. Notes and audit records have no direct client grants. Private screenshot signing requires an authorized administrator. Legacy screenshots are returned only by the checked admin RPC.

Status values retain iOS compatibility: submitted = New, under_review = In Progress, replied = Waiting for User, resolved = Resolved, closed = Closed. Replies and status changes are independent. Official replies use individual support_messages records and trigger existing support_notifications. Customer replies use the original continue_support_ticket RPC, now enabled with its ownership checks intact. The iOS support UI already reads these notifications, shows the Tamaddi Support identity, and refreshes while focused.

The dashboard refreshes every 15 seconds while visible and avoids replacing focused forms. SDK session refresh handles expiration. Logout revokes the session. Browser tokens are scoped to sessionStorage.

Retry UUIDs prevent duplicate messages and notes. Status/priority changes and admin actions are recorded transactionally. Resolution metrics only cover requests resolved after the admin migration. The average first reply uses existing message timestamps. Future navigation sections explicitly show Coming soon.

## Validation

Run the rollback-only SQL suites against the migrated database:
- scripts/test-support.sql
- scripts/test-support-admin.sql

Also exercise the iOS-to-dashboard acceptance flow using a dedicated test account, including private screenshot signing and notification navigation. These live tests require the configured Supabase project and an administrator account. No push notification service is added.

## Platform expansion (24 November 2026)

Migrations 008–012 add submission-time app version/build/platform, protected user directory and account summaries, date-filtered analytics, administrator preferences, platform audit events and AI usage reporting. Migration 009 restores owner-checked customer follow-ups after migration 007 disabled them. The inbox and search use the app's actual display_name metadata, with full_name/name/email fallbacks. Historical report versions remain null.

The admin frontend uses bundled Lucide icons. catalog-build.mjs derives a read-only recipe and ingredient snapshot from the app's source catalog at build time, including the app's real recipe images. The build now requires the repository's existing TypeScript development dependency.

Implemented destinations:
- Users: search, date filters, sort, pagination, profile and synced-kitchen counts, link to user support.
- Meals & Recipes: read-only app catalog, category/search filters, pagination and ingredient details.
- Products & Ingredients: read-only recipe ingredient references and search/pagination.
- AI & Usage: protected model/feature/day aggregates, provider token counts, failures and average latency.
- Analytics: dated registration/support charts and current synced-account count.
- Activity Log: protected support and platform admin events, filters and pagination.
- Settings: current administrator identity, persistent auto-refresh preference, logout and non-secret configuration facts.

Blocked capabilities are identified on the relevant page. There is no remote recipe/product catalog or publishing contract, so create/edit/delete/publish controls are not offered. The admin never modifies private kitchen snapshots as a substitute for catalog management. Active-user and meal-engagement metrics have no reliable event source. Provider pricing/billing is not configured, so cost numbers are not displayed.

The assistant Edge Function records usage after authenticated provider attempts using its server-only service-role environment variable. It records no prompts or kitchen contents. Historical usage cannot be reconstructed. Metering failure does not discard a completed assistant response.

Validation performed against the existing project:
- scripts/test-support.sql
- scripts/test-support-admin.sql
- scripts/test-admin-platform.sql
All use disposable fixtures and roll back.
- Authenticated browser navigation for all nine sections, user search empty state, recipe pagination, preference persistence, existing conversation loading, internal-note mode and private image preview.
- Overview/support layouts at 1440px, 820px and 390px; mobile chart overflow corrected.
- Static build, application TypeScript/lint and Deno assistant typecheck.

Not yet verified: a newly built iOS client submitting version metadata, physical-device two-way messaging, provider usage capture from a new authenticated assistant call, and frontend deployment to Vercel. The database changes and assistant instrumentation are deployed; the admin visual update remains local.
