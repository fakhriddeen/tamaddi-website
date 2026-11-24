# Tamaddi website

Serve the static site from this directory with `python3 -m http.server 8095 --directory dist`, then open http://localhost:8095.

Edit the pages in `src/` and their shared header in `src/header.html`. Run `npm ci` once, then `npm run build` to render all four pages into `dist/` with the current-page pill in place. The shared stylesheet, JavaScript and assets live in `public/` and are copied to `dist/`.

The imagery includes Tamaddi’s brand assets, food photography from the app and real app captures. The hero and Features page use the supplied native Home and Insights captures. The Meals, Kitchen and Grocery showcase uses the existing app captures. The full-width kitchen section uses the supplied dark photograph. The How it works page uses the supplied 3074 × 1920 Plov photograph, resized into responsive WebP variants without cropping.

The homepage kitchen backdrop was created with built-in ImageGen. The Home and Insights screenshots are separate assets inside CSS phone frames.

The shared palette uses the app’s graphite, blue and neutral surfaces alongside warm photography. The mobile Home showcase supports arrow keys, Home and End. On How it works, the desktop workflow preview follows the current step as visitors scroll. Mobile and no-script layouts show each screenshot alongside its step. Motion respects reduced-motion settings and browsers without cross-document view transitions use regular links.

Static checks from the repository root:

```sh
node website/build.mjs
node --check website/build.mjs
./node_modules/.bin/eslint --config website/eslint.config.mjs website/dist/site.js website/build.mjs
./node_modules/.bin/tsc --allowJs --checkJs --noEmit --ignoreConfig --skipLibCheck --target ES2022 --lib ES2022,DOM website/dist/site.js
```

The current app previews come from `page screenshots/IMG_9904.PNG` through `IMG_9908.PNG` (Home, Meals, Kitchen, Grocery, and Insights, in that order). The WebP copies in `dist/media` retain the originals’ full 1320 × 2868 frame.

## Vercel production deployment

This directory is its own Git repository and npm project. From this directory run:

```sh
npm ci
npm run build
```

The committed vercel.json installs with npm ci, builds with npm run build and publishes dist. For the tamaddi-website repository, Vercel's Root Directory is the repository root (leave it blank). Set the framework preset to Other. The dist output includes all four public routes and /admin/.

Set these variables in Vercel's Production environment before deploying:
- TAMADDI_ADMIN_SUPABASE_URL
- TAMADDI_ADMIN_SUPABASE_PUBLISHABLE_KEY

The build writes their public values to dist/admin/config.js. Never use a service-role key.

TypeScript is a pinned website dependency because catalog-build.mjs transpiles the app's recipe modules to generate the read-only admin catalog. catalog-source/ contains the checked-in recipe build inputs and corresponding images, allowing Vercel to build without the parent mobile repository. After changing the app catalog locally, run npm run sync:catalog from this directory and commit the updated catalog-source/ files. The synchronization script requires the existing sibling app source; the production build does not.

To check an isolated deployment, copy package.json, package-lock.json, build.mjs, catalog-build.mjs, src/, public/, and catalog-source/ into an empty directory, run npm ci --omit=dev, then npm run build with the two public configuration variables set.
