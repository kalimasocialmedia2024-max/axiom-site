// خريطة الموقع الكاملة لمحرّكات البحث.
import { getData, tagCounts, tagUrl, byKind, bySection } from '../lib/sanity.js';
import { SITE, KINDS, SECTIONS, articleUrl, sectionUrl } from '../lib/config.js';
import { esc, xml } from '../lib/xml.js';

export async function GET() {
  const d = await getData();
  const u = (path) => new URL(path, SITE.url).href;
  const latest = d.articles[0]?.updatedAt || new Date().toISOString();
  const rows = [
    { loc: u('/'), lastmod: latest, freq: 'hourly', pr: '1.0' },
    ...Object.entries(KINDS).filter(([kk]) => byKind(d.articles, kk).length > 0).map(([, k]) => ({ loc: u(`/${k.path}/`), lastmod: latest, freq: 'hourly', pr: '0.8' })),
    ...SECTIONS.filter((s) => bySection(d.articles, s.slug).length > 0).map((s) => ({ loc: u(sectionUrl(s.slug)), lastmod: latest, freq: 'hourly', pr: '0.8' })),
    ...d.articles.map((a) => ({ loc: u(articleUrl(a)), lastmod: a.updatedAt || a.publishedAt, freq: 'weekly', pr: '0.7' })),
    ...tagCounts(d.articles).filter((t) => t.count >= 3).map((t) => ({ loc: u(tagUrl(t.tag)), lastmod: latest, freq: 'daily', pr: '0.5' })),
    ...d.writers.map((w) => ({ loc: u(`/writers/${w.slug}/`), freq: 'weekly', pr: '0.4' })),
    ...(d.episodes.length ? [{ loc: u('/media/'), lastmod: latest, freq: 'daily', pr: '0.6' }] : []),
    ...d.episodes.map((e) => ({ loc: u(`/media/${e.slug}/`), lastmod: e.publishedAt, freq: 'monthly', pr: '0.5' })),
    ...d.pages.map((p) => ({ loc: u(`/page/${p.slug}/`), freq: 'monthly', pr: '0.3' })),
  ];
  return xml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((r) => `<url><loc>${esc(r.loc)}</loc>${r.lastmod ? `<lastmod>${esc(new Date(r.lastmod).toISOString())}</lastmod>` : ''}<changefreq>${r.freq}</changefreq><priority>${r.pr}</priority></url>`).join('\n')}
</urlset>`);
}
