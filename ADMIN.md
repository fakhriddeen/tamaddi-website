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
- Meals & Recipes: shared draft editor, image uploads, ingredient quantities, preparation steps and publish/unpublish controls (see shared publishing setup below).
- Products & Ingredients: read-only recipe ingredient references and search/pagination.
- AI & Usage: protected model/feature/day aggregates, provider token counts, failures and average latency.
- Analytics: dated registration/support charts and current synced-account count.
- Activity Log: protected support and platform admin events, filters and pagination.
- Settings: current administrator identity, persistent auto-refresh preference, logout and non-secret configuration facts.

The shared recipe publishing implementation below supersedes the original read-only meal catalog. A separate shared product catalog is not provided. The admin never modifies private kitchen snapshots as a substitute for catalog management. Active-user and meal-engagement metrics have no reliable event source. Provider pricing/billing is not configured, so cost numbers are not displayed.

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

## Shared meal publishing (25 November 2026)

Migration `202611250001_shared_meal_catalog.sql` adds private drafts, a separate published snapshot, revision checks, publication visibility and administrator audit events. Only the existing administrator membership can read drafts or mutate meals. Published recipe content is intentionally readable by guests and signed-in app users; it contains no account data. No new administrator is granted.

In Meals & Recipes, use **Import missing bundled meals** once to create private drafts of the existing website catalog. It does not overwrite edits or automatically publish meals. Existing IDs remain unchanged. Imported photos use the current website origin, which must be a stable HTTPS production URL. Uploaded photos instead use the public `meal-photos` bucket; administrators alone can insert JPEG/PNG/WebP up to 5 MB. Immutable filenames prevent cache conflicts. Client overwrite/delete is deliberately unavailable to protect published references.

Use **New meal** or **Edit meal**, enter the name, description, timing, servings, image, categories, ingredients/quantities and preparation steps. **Save draft** is private. **Publish meal** atomically replaces the public version. **Unpublish** removes discovery visibility while preserving the last published data for saved plans, favourites and history. Conflicting revisions require a reload before saving. There is no destructive recipe deletion.

The updated app synchronizes on launch, foreground and every 60 seconds while active. It persists the last published catalog locally and retains bundled meals offline. Remote meals use HTTPS images with the existing image cache. Old app binaries keep their bundled catalog: ship the app update before expecting live meal changes on users' devices. Personal recipe overrides are retained.

Validation:
- `node scripts/test-meal-catalog.cjs` (from the mobile repository): cache, merge, unpublishing, stable IDs, invalid responses and deduplicated refreshes.
- `scripts/test-meal-catalog.sql`: rollback-only draft/publish/conflict/unpublish, ordinary-user and anonymous permissions, and storage RLS checks.
- Production website build and application lint/typecheck.

Deployment status: the catalog migration was applied to the existing Tamaddi Supabase project using its authorized CLI session. This database has no `supabase_migrations.schema_migrations` ledger, so the SQL was executed transactionally through `supabase db query --remote --file ...`, following the existing setup; do not reapply it unchanged. Website/editor and mobile synchronization source changes still require their respective releases. Browser acceptance used isolated fixture data; a physical-device publish/sync acceptance test remains necessary after the updated app is installed.


## Refined meal workspace and live updates (26 November 2026)

Meals now has responsive photographic cards, live-record statistics, combined status/cuisine/category filters, sorting and grid/list layouts. Contextual actions support edit, preview, duplicate-as-draft and unpublish. “Archived” describes the existing unpublished state; no destructive archive/delete operation was added. Categories and cuisines remain recipe fields and filters, not disconnected management tabs.

Editing opens a dedicated workspace. Save/publish/unpublish require explicit confirmation. Navigation, refresh, sign-out and closing a dirty editor warn before discarding changes. Ingredient names suggest names from the shared meal drafts; ingredient quantities and preparation steps can be reordered without JSON. Photos support preview, replace and remove-from-draft, retaining immutable stored files. A photograph is still required before saving/publishing under the existing validation contract. There is no separate ingredient registry, global ingredient rename, per-step image store or ingredient-note field; these were not invented by the redesign.

Migration `202611260001_catalog_live_updates.sql` is applied to Tamaddi. It replicates only a public revision/timestamp signal updated transactionally by publication/unpublication. The private meal table is never added to Realtime. Compatible online apps refetch the published RPC upon the signal and on resubscription; an event during an in-flight fetch schedules another fetch. Foreground refresh, periodic fallback and offline caching remain. Draft saves never send publication signals. This replaces the earlier polling-only latency once the updated app is released.

Verified: local Chrome fixture create/edit, confirmation, publish/unpublish, discard/cancel and eight-card layouts at 1680/820/390px; app lint/typecheck, iOS export, domain/cache/realtime listener tests; rollback database publication/RLS/signal tests. Real public WebSocket delivery and RPC refetch were verified against the existing project with a harmless revision increment, without changing meals. Physical-device synchronization is not yet verified. Dashboard/app code remains local until released; backend signal is deployed. Existing compatible polling-only builds refresh at their polling interval until upgraded.


## Shared dashboard experience layer

`public/admin/experience.css` defines the shared warm ivory/orange administration theme, tables, forms, support conversation surfaces, chart treatment and responsive editor workspace. `experience.js` adds native Web Animations API page entry/exit, staggered section/card entry, animated sidebar selection, contextual-menu entry, dialog entry/exit and notice feedback. The CSS provides press/hover, ingredient-row entrance and delayed skeleton pulse. Reduced motion disables CSS/WAAPI animation, including animations already running when the preference changes.

Loading keeps the existing page in place while a delayed skeleton overlays the content bounds; it does not insert layout space or replace form data. Retry uses the existing refresh action. Quiet auto-refresh avoids entrance animations. The meal editor composes the existing form fields and handlers into sections plus a desktop sticky live preview/publication panel; on narrow screens the existing top/bottom actions and preview dialog remain available. There are no new runtime dependencies, schema changes, authorization changes, or altered RPC contracts.

Optional browser fixture suites (no production writes): build first, then run `tests/admin-experience.cjs` and `tests/meal-editor.cjs` using Node. Provide `PLAYWRIGHT_MODULE` pointing to an installed Playwright module and optionally `CHROME_EXECUTABLE` for an existing Chrome installation. Tests cover all nine routes at 1440/820/390, error/retry, delayed loading, reduced motion; meal editing, drafts, publishing/unpublishing, unsaved changes, filtering, list/grid, preview and 1680/820/390 editor/card layouts. Fixture identities and values exist only in intercepted local test responses. This presentation upgrade remains local until the website is deployed. Physical-device catalog synchronization is outside these visual tests.

## Approved premium admin presentation (26 November 2026)

`premium.css` applies the approved warm ivory, peach and orange design across the existing workspace. Meal collection tabs now expose real category/cuisine groups; selecting a group filters the shared catalog. Search combines with publication/cuisine/category filters and sorting. The compact card secondary action opens the existing editor; it does not imply a new bookmark backend. Import requires confirmation and continues to add missing IDs as private drafts only. Draft and published snapshots, permission checks, image storage and optimistic revision checks are unchanged.

**Publication audit:** the production database was read on 26 November: 29 records, 2 visible published snapshots, 27 unpublished drafts, 0 archived. The current iOS app also retains bundled recipes. These are distinct from Supabase published snapshots. No records were bulk-published, duplicated, unpublished, or restyled to falsely show Published. Making all 29 shared records published requires a deliberate catalog publication operation, separate from this presentation update.

Validation: production static build, mobile application lint and TypeScript, all nine destinations at 1440/820/390px, populated meal collection at 1672/1280/820/390px, category/cuisine navigation, combined filters, live search/focus retention, import cancellation, fixture creation/draft/publish/unpublish and unsaved-change dialogs. Existing rollback-only catalog SQL verified live backend permissions, draft isolation, revisions and publication behavior. Physical-device iOS synchronization and real photo uploads were not exercised in this visual update. Website source/build are prepared locally; no frontend deployment was performed.

Browser suites: `tests/admin-experience.cjs`, `tests/meal-editor.cjs`, and `tests/premium-admin.cjs`. Use `PLAYWRIGHT_MODULE` and `CHROME_EXECUTABLE` for the installed browser runtime when needed.
