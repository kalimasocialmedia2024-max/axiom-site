// ينشر كلّ مادّة جديدة على الموقع في قناة تيليغرام: الصورة والعنوان والمقدّمة والرابط.
// يحفظ ما نُشر في مستند "telegram-log" حتى لا يتكرّر شيء. في أوّل تشغيل يسجّل الموجود دون إرسال.
import { query, mutate } from './lib.mjs';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT || '@Axiomplus';
const SITE = 'https://axiomplusmedia.com';
const PATHS = { news: 'news', analysis: 'analysis', opinion: 'opinion', investigation: 'investigations', special: 'special', study: 'studies' };

if (!TOKEN) {
  console.log('لا يوجد TELEGRAM_BOT_TOKEN بعد؛ لا شيء يُرسل.');
  process.exit(0);
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const log = await query(`*[_id == "telegram-log"][0]{ ids }`);
const items = await query(
  `*[_type == "article" && !(_id in path("drafts.**")) && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc)[0...40]{
    _id, title, excerpt, kind, "slug": slug.current,
    "img": coalesce(mainImage.asset->url, feedImage)
  }`
);

if (!log) {
  await mutate([{ createIfNotExists: { _id: 'telegram-log', _type: 'automationLog', ids: items.map((a) => a._id) } }]);
  console.log(`أوّل تشغيل: سُجّلت ${items.length} مادّة قائمة دون إرسال.`);
  process.exit(0);
}

const seen = new Set(log.ids || []);
const fresh = items.filter((a) => !seen.has(a._id)).reverse();
const sent = [];

for (const a of fresh.slice(0, 10)) {
  const url = `${SITE}/${PATHS[a.kind] || 'news'}/${a.slug}/`;
  const caption = [`<b>${esc(a.title)}</b>`, a.excerpt ? esc(a.excerpt).slice(0, 700) : '', `<a href="${url}">اقرأ على AXIOM+</a>`].filter(Boolean).join('\n\n');
  const method = a.img ? 'sendPhoto' : 'sendMessage';
  const body = a.img ? { chat_id: CHAT, photo: `${a.img}?w=1200`, caption, parse_mode: 'HTML' } : { chat_id: CHAT, text: caption, parse_mode: 'HTML' };
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) {
    console.error(`تعذّر إرسال ${a._id}: ${j.description}`);
    continue;
  }
  sent.push(a._id);
  await new Promise((res) => setTimeout(res, 3000));
}

if (sent.length) {
  const ids = [...sent, ...(log.ids || [])].slice(0, 600);
  await mutate([{ patch: { id: 'telegram-log', set: { ids } } }]);
}
console.log(`أُرسلت ${sent.length} مادّة إلى تيليغرام.`);
