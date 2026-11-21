// يرسل إشعار الخبر البارز (featured) الحديث على دفعات. تستدعيه مهمّة آلية كلّ ربع ساعة،
// ولا يفعل شيئاً إلا إن وُجد خبر بارز جديد لم يُرسل، وبحدّ أقصى خمسة إشعارات في اليوم.
import { getVapid, sendPush, json } from '../../lib/webpush.js';
import { articleUrl } from '../../lib/config.js';

const PER_CALL = 40, DAY_CAP = 5, FRESH_H = 3;

async function candidates() {
  const since = new Date(Date.now() - FRESH_H * 3600e3).toISOString();
  const q = `*[_type=="article" && featured==true && defined(slug.current) && coalesce(publishedAt,_createdAt) > "${since}"] | order(coalesce(publishedAt,_createdAt) desc)[0...5]{_id,title,"slug":slug.current,kind}`;
  const url = new URL('https://9rw3viyf.api.sanity.io/v2025-02-19/data/query/production');
  url.searchParams.set('query', q);
  url.searchParams.set('perspective', 'published');
  const r = await fetch(url);
  return r.ok ? (await r.json()).result || [] : [];
}

async function run({ locals }) {
  const kv = locals?.runtime?.env?.SUBSCRIBERS;
  if (!kv) return json({ error: 'unavailable' }, 503);
  const v = await getVapid(kv);
  if (!v) return json({ idle: true, reason: 'no-keys' });

  let job = await kv.get('pushjob', 'json');
  if (!job) {
    const day = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
    const used = Number((await kv.get('pushday:' + day)) || 0);
    for (const a of await candidates()) {
      if (await kv.get('pushed:' + a._id)) continue;
      if (used >= DAY_CAP) return json({ idle: true, reason: 'daily-cap' });
      job = { id: a._id, cursor: null, sent: 0, gone: 0 };
      await kv.put('push:latest', JSON.stringify({ id: a._id, title: a.title, url: 'https://axiomplusmedia.com' + articleUrl(a) }));
      await kv.put('pushed:' + a._id, '1', { expirationTtl: 7 * 86400 });
      await kv.put('pushday:' + day, String(used + 1), { expirationTtl: 3 * 86400 });
      break;
    }
    if (!job) return json({ idle: true });
  }

  const page = await kv.list({ prefix: 'sub:', cursor: job.cursor || undefined, limit: PER_CALL });
  const cache = {};
  await Promise.all(
    page.keys.map(async (k) => {
      const ep = k.metadata?.e;
      if (!ep) return;
      try {
        const s = await sendPush(v, ep, cache);
        if (s === 404 || s === 410) { await kv.delete(k.name); job.gone++; }
        else if (s < 300) job.sent++;
      } catch {}
    })
  );
  if (page.list_complete) {
    await kv.delete('pushjob');
    return json({ done: true, id: job.id, sent: job.sent, gone: job.gone });
  }
  job.cursor = page.cursor;
  await kv.put('pushjob', JSON.stringify(job));
  return json({ more: true, id: job.id, sent: job.sent });
}
export const GET = run;
export const POST = run;
