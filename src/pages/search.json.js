// فهرس البحث: يُولَّد وقت البناء ويُقرأ في صفحة البحث دون خادم.
import { getData } from '../lib/sanity.js';
import { articleUrl, KINDS } from '../lib/config.js';

export async function GET() {
  const data = await getData();
  const items = data.articles.map((a) => ({
    t: a.title,
    e: a.excerpt || a.subtitle || '',
    u: articleUrl(a),
    k: KINDS[a.kind]?.badge || '',
    d: a.publishedAt,
    g: (a.tags || []).join(' '),
    w: (a.authors || []).map((w) => w.name).join(' '),
  }));
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
