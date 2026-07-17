/**
 * Postbuild prerender: per-route <title>/<meta>/<og:*> + sitemap + robots.
 *
 * A Vite SPA serves one index.html for every route, so crawlers and link
 * unfurlers see identical metadata everywhere. This script stamps each public
 * route's title/description (from src/lib/publicRoutes.json — the same source
 * the useMeta hook uses at runtime) into a copy at dist/<route>/index.html.
 * No headless browser: pure string templating; the SPA hydrates over it.
 * The backend's SPA handler serves these directory indexes before falling
 * back to the root index.html.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const routes = JSON.parse(readFileSync(join(root, 'src/lib/publicRoutes.json'), 'utf8'))

const BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://forex-desk.onrender.com').replace(
  /\/$/,
  '',
)

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

function stamp(html, { path, title, description }) {
  const head =
    `<title>${esc(title)}</title>\n` +
    `    <meta name="description" content="${esc(description)}" />\n` +
    `    <meta property="og:title" content="${esc(title)}" />\n` +
    `    <meta property="og:description" content="${esc(description)}" />\n` +
    `    <meta property="og:type" content="website" />\n` +
    `    <meta property="og:url" content="${BASE_URL}${path}" />\n` +
    `    <link rel="canonical" href="${BASE_URL}${path}" />`
  return html
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '') // drop the template's copy
}

for (const route of routes) {
  const html = stamp(template, route)
  if (route.path === '/') {
    writeFileSync(join(dist, 'index.html'), html)
  } else {
    const dir = join(dist, route.path.slice(1))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
  console.log(`prerendered ${route.path}`)
}

const today = new Date().toISOString().slice(0, 10)
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  routes
    .map(
      (r) =>
        `  <url><loc>${BASE_URL}${r.path === '/' ? '' : r.path}</loc><lastmod>${today}</lastmod></url>`,
    )
    .join('\n') +
  '\n</urlset>\n'
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /portfolio\nDisallow: /journal\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
)
console.log('wrote sitemap.xml + robots.txt')
