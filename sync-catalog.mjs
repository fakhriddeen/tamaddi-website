import { cp, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const website = fileURLToPath(new URL('.', import.meta.url));
const app = resolve(website, '..');
const snapshot = resolve(website, 'catalog-source');
const dataFiles = ['recipes.ts', 'new-recipes.ts', 'recipe-standards.ts'];

// Refresh the checked-in build inputs from the existing app catalog.
// Vercel builds consume this snapshot without requiring the mobile repository.
for (const name of dataFiles) {
  const relative = 'src/data/' + name;
  const input = resolve(app, relative);
  const output = resolve(snapshot, relative);
  await mkdir(dirname(output), { recursive: true });
  await cp(input, output);
  const source = await readFile(input, 'utf8');
  for (const [, asset] of source.matchAll(/require\(['"]([^'"]+\.(?:png|jpg|webp))['"]\)/g)) {
    const assetInput = resolve(dirname(input), asset);
    const assetOutput = resolve(dirname(output), asset);
    if (!assetOutput.startsWith(snapshot + '/')) throw new Error('Catalog asset escapes snapshot directory.');
    await mkdir(dirname(assetOutput), { recursive: true });
    await cp(assetInput, assetOutput);
  }
}
console.log('Updated website catalog build inputs from the Tamaddi app.');
