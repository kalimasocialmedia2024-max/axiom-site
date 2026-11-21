// يبلّغ Bing (وبقية محرّكات IndexNow) بالموادّ الجديدة فور نشرها، بدل انتظار زيارة الزاحف.
// تستدعيه مهمّة آلية كلّ ربع ساعة؛ كلّ رابط يُبلَّغ مرّة واحدة.
import { json } from '../../lib/webpush.js';
import { articleUrl, SITE } from '../../lib/config.js';

const KEY = 'b66dfcb15a5ecbe372ea17533053ec40';

export async function GET({ locals }) {
  const kv = locals?.runtime?.env?.SUBSCRIBERS;
  if (!kv) return json({ error: 'unavailable' }, 503);
  const since = new Date(Date.now() - 6 * 3600e3).toISOString();
  const q = `*[_type=="article" && defined(slug.current) && coalesce(publishedAt,_createdAt) > "${since}"]{_id,"slug":slug.current,kind}`;
  const url = new URL('https://9rw3viyf.api.sanity.io/v2025-02-19/data/query/production');
  url.searchParams.set('query', q);
  url.searchParams.set('perspective', 'published');
  const r = await fetch(url);
  const list = r.ok ? (await r.json()).result || [] : [];
  const fresh = [];
  for (const a of list) if (!(await kv.get('indexed:' + a._id))) fresh.push(a);
  if (!fresh.length) return json({ idle: true });
  const urlList = [SITE.url + '/', SITE.url + '/news/', ...fresh.slice(0, 100).map((a) => SITE.url + articleUrl(a))];
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE.url).host, key: KEY, keyLocation: SITE.url + '/' + KEY + '.txt', urlList }),
  });
  if (res.status < 300) for (const a of fresh.slice(0, 100)) await kv.put('indexed:' + a._id, '1', { expirationTtl: 3 * 86400 });
  return json({ status: res.status, sent: urlList.length });
}
