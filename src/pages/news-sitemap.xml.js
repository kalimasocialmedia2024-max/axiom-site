// خريطة Google News: موادّ آخر 48 ساعة فقط، كما تشترط غوغل.
import { getData } from '../lib/sanity.js';
import { SITE, articleUrl } from '../lib/config.js';
import { esc, xml } from '../lib/xml.js';

export async function GET() {
  const d = await getData();
  const since = Date.now() - 48 * 3600 * 1000;
  const items = d.articles.filter((a) => a.kind !== 'study' && Date.parse(a.publishedAt) > since).slice(0, 1000);
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.map((a) => `<url><loc>${esc(new URL(articleUrl(a), SITE.url).href)}</loc><news:news><news:publication><news:name>${esc(SITE.name)}</news:name><news:language>ar</news:language></news:publication><news:publication_date>${new Date(a.publishedAt).toISOString()}</news:publication_date><news:title>${esc(a.title)}</news:title>${(a.tags || []).length ? `<news:keywords>${esc(a.tags.join(', '))}</news:keywords>` : ''}</news:news></url>`).join('\n')}
</urlset>`);
}
