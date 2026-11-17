# Tamaddi website

Serve the static site from this directory with `python3 -m http.server 8095 --directory dist`, then open http://localhost:8095.

Edit the pages in `src/` and their shared header in `src/header.html`. Run `node build.mjs` to render all four pages into `dist/` with the current-page pill in place. No dependencies need to be installed. The shared stylesheet and JavaScript live in `dist/`.

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
