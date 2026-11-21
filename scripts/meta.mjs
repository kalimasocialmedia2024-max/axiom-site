// ينشر كلّ مادّة جديدة على صفحة فيسبوك وحساب إنستغرام المربوط بها.
// يحتاج سرّاً واحداً: META_PAGE_TOKEN (رمز الصفحة الدائم). معرّف الصفحة وحساب إنستغرام يُستخرجان منه.
// يحفظ ما نُشر في مستند "meta-log"؛ في أوّل تشغيل يسجّل الموجود دون نشر.
import { query, mutate } from './lib.mjs';

const TOKEN = process.env.META_PAGE_TOKEN;
const G = 'https://graph.facebook.com/v25.0';
const SITE = 'https://axiomplusmedia.com';
const PATHS = { news: 'news', analysis: 'analysis', opinion: 'opinion', investigation: 'investigations', special: 'special', study: 'studies' };

if (!TOKEN) {
  console.log('لا يوجد META_PAGE_TOKEN بعد؛ لا شيء يُنشر.');
  process.exit(0);
}

async function api(path, params = {}, method = 'GET') {
  const u = new URL(`${G}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const r = method === 'GET' ? await fetch(`${u}?${body}`) : await fetch(u, { method, body });
  const j = await r.json();
  if (j.error) throw new Error(`${path}: ${j.error.message}`);
  return j;
}

const page = await api('me', { fields: 'id,name,instagram_business_account' });
const igId = page.instagram_business_account?.id;
console.log(`الصفحة: ${page.name}${igId ? ' + إنستغرام' : ' (بلا إنستغرام مربوط)'}`);

const log = await query(`*[_id == "meta-log"][0]{ ids }`);
const items = await query(
  `*[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc)[0...40]{
    _id, title, excerpt, kind, "slug": slug.current,
    "img": coalesce(mainImage.asset->url, feedImage)
  }`
);

if (!log) {
  await mutate([{ createIfNotExists: { _id: 'meta-log', _type: 'automationLog', ids: items.map((a) => a._id) } }]);
  console.log(`أوّل تشغيل: سُجّلت ${items.length} مادّة قائمة دون نشر.`);
  process.exit(0);
}

const seen = new Set(log.ids || []);
const fresh = items.filter((a) => !seen.has(a._id)).reverse().slice(0, 5);
const done = [];

for (const a of fresh) {
  const url = `${SITE}/${PATHS[a.kind] || 'news'}/${a.slug}/`;
  const text = [a.title, a.excerpt || ''].filter(Boolean).join('\n\n');
  try {
    await api(`${page.id}/feed`, { message: text, link: url }, 'POST');
  } catch (e) {
    console.error(`فيسبوك ${a._id}: ${e.message}`);
  }
  if (igId && a.img) {
    try {
      const caption = `${text}\n\nالخبر كاملاً على axiomplusmedia.com (الرابط في البايو)`.slice(0, 2100);
      const c = await api(`${igId}/media`, { image_url: a.img.includes('cdn.sanity.io') ? `${a.img}?w=1080&h=1080&fit=crop&fm=jpg` : a.img, caption }, 'POST');
      await new Promise((res) => setTimeout(res, 8000));
      await api(`${igId}/media_publish`, { creation_id: c.id }, 'POST');
    } catch (e) {
      console.error(`إنستغرام ${a._id}: ${e.message}`);
    }
  }
  done.push(a._id);
  await new Promise((res) => setTimeout(res, 3000));
}

if (done.length) {
  await mutate([{ patch: { id: 'meta-log', set: { ids: [...done, ...(log.ids || [])].slice(0, 600) } } }]);
}
console.log(`نُشرت ${done.length} مادّة على فيسبوك/إنستغرام.`);
