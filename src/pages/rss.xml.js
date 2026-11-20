// خلاصة RSS لآخر الموادّ.
import { getData } from '../lib/sanity.js';
import { SITE, articleUrl, sectionTitle } from '../lib/config.js';
import { esc } from '../lib/xml.js';

export async function GET() {
  const d = await getData();
  const items = d.articles.slice(0, 50);
  const u = (p) => new URL(p, SITE.url).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${esc(SITE.name)}</title>
<link>${SITE.url}/</link>
<description>${esc(SITE.description)}</description>
<language>ar</language>
<atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items.map((a) => `<item>
<title>${esc(a.title)}</title>
<link>${esc(u(articleUrl(a)))}</link>
<guid isPermaLink="true">${esc(u(articleUrl(a)))}</guid>
<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
${a.section ? `<category>${esc(sectionTitle(a.section))}</category>` : ''}
${(a.tags || []).map((t) => `<category>${esc(t)}</category>`).join('')}
${a.excerpt ? `<description>${esc(a.excerpt)}</description>` : ''}
${a.image?.url ? `<media:content url="${esc(a.image.url)}" medium="image"/>` : ''}
</item>`).join('\n')}
</channel>
</rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
