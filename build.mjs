import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = relative => new URL(relative, import.meta.url);
const header = await readFile(source('./src/header.html'), 'utf8');
const footer = await readFile(source('./src/footer.html'), 'utf8');
const routes = ['', 'features/', 'how-it-works/', 'about/'];

await Promise.all(routes.map(async route => {
  const page = await readFile(source(`./src/${route}index.html`), 'utf8');
  const activeLink = `<a href="/${route}">`;
  const routeHeader = header.replace(activeLink, `<a href="/${route}" aria-current="page">`);
  if (!page.includes('<!-- shared-header -->') || !routeHeader.includes('aria-current="page"')) {
    throw new Error(`Missing header or active link for /${route}`);
  }
  const output = source(`./dist/${route}`);
  await mkdir(output, { recursive: true });
  await writeFile(new URL('index.html', output), page.replace('<!-- shared-header -->', routeHeader.trimEnd()).replace('<!-- shared-footer -->', footer));
}));
