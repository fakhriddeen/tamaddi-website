
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const source = relative => new URL(relative, import.meta.url);

const header = await readFile(source('./src/header.html'), 'utf8');
const footer = await readFile(source('./src/footer.html'), 'utf8');

const routes = ['', 'features/', 'how-it-works/', 'about/'];

await Promise.all(routes.map(async route => {
  const page = await readFile(source(`./src/${route}index.html`), 'utf8');
  const activeLink = `<a href="/${route}">`;
  const routeHeader = header.replace(
    activeLink,
    `<a href="/${route}" aria-current="page">`
  );

  if (!page.includes('<!-- shared-header -->') || !routeHeader.includes('aria-current="page"')) {
    throw new Error(`Missing header or active link for /${route}`);
  }

  const output = source(`./dist/${route}`);
  await mkdir(output, { recursive: true });

  await writeFile(
    new URL('index.html', output),
    page
      .replace('<!-- shared-header -->', routeHeader.trimEnd())
      .replace('<!-- shared-footer -->', footer)
  );
}));

// Copy CSS, JavaScript and images into the production output
await cp(source('./public'), source('./dist'), { recursive: true });


// Admin uses only the public Supabase URL and publishable key.
const adminUrl = process.env.TAMADDI_ADMIN_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const adminKey = process.env.TAMADDI_ADMIN_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if (adminKey && !adminKey.startsWith('sb_publishable_')) {
  let role;
  try { role = JSON.parse(Buffer.from(adminKey.split('.')[1], 'base64url').toString()).role; } catch {}
  if (role !== 'anon') throw new Error('Admin configuration requires a public anon or publishable key.');
}
await mkdir(source('./dist/admin/'), { recursive: true });
await writeFile(source('./dist/admin/config.js'),
  'window.TAMADDI_ADMIN = ' + JSON.stringify({ url: adminUrl, key: adminKey }) + ';\n');
