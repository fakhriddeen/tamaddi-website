import ts from 'typescript';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { runInNewContext } from 'node:vm';

// Read the app's actual bundled catalog. No second editable catalog is created.
export async function buildCatalog(root) {
  const cache = new Map();
  const images = new Map();
  async function load(path) {
    if (cache.has(path)) return cache.get(path);
    const input = await readFile(path, 'utf8');
    const code = ts.transpileModule(input, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const dependencies = [...code.matchAll(/(?:from\s+|require\()['"]([^'"]+)['"]/g)];
    const modules = new Map();
    for (const [, name] of dependencies) {
      const target = resolve(dirname(path), name);
      if (/\.(png|jpg|webp)$/.test(target)) {
        const output = basename(target);
        images.set(output, target);
        modules.set(name, '/admin/catalog-images/' + output);
      } else if (name.startsWith('.')) {
        modules.set(name, await load(extname(target) ? target : target + '.ts'));
      }
    }
    const module = { exports: {} };
    runInNewContext(code, { exports: module.exports, module, require: name => {
      if (!modules.has(name)) throw new Error('Unsupported catalog dependency: ' + name);
      return modules.get(name);
    } }, { filename: path });
    cache.set(path, module.exports);
    return module.exports;
  }
  const catalog = await load(resolve(root, 'catalog-source/src/data/recipes.ts'));
  const output = resolve(root, 'dist/admin');
  await mkdir(resolve(output, 'catalog-images'), { recursive: true });
  await Promise.all([...images].map(([name,path]) => copyFile(path, resolve(output,'catalog-images',name))));
  await writeFile(resolve(output,'catalog.json'), JSON.stringify({
    recipes: catalog.RECIPES.map(recipe => ({...recipe, browsable: catalog.BROWSABLE_RECIPES.some(item=>item.id===recipe.id)})),
    source: 'Bundled iOS recipe catalog',
  }));
}
