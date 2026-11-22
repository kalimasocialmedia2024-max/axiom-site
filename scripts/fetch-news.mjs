// يجلب الأخبار من مصادر RSS المسجّلة في لوحة التحرير ("مصادر الأخبار الآلية")
// ويضعها مسوّدات في طابور "أخبار واردة من المصادر". لا يُنشر شيء آلياً.
import { deskFor } from './desk.mjs';
import { query, mutate, hash, key, plain, decode } from './lib.mjs';

const UA = 'Mozilla/5.0 (compatible; AXIOMPlusNewsBot/1.0; +https://axiomplusmedia.com)';
const MAX_AGE_H = 36;

function tag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
    if (m && m[1].trim()) return m[1].trim();
  }
  return '';
}

function image(b) {
  const m =
    b.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i) ||
    b.match(/<media:thumbnail[^>]*url=["']([^"']+)/i) ||
    b.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
    b.match(/<enclosure[^>]*type=["']image[^>]*url=["']([^"']+)/i) ||
    decode(b).match(/<img[^>]*src=["'](https?:[^"']+)/i);
  return m ? decode(m[1]).trim() : '';
}

function parse(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    let link = decode(tag(b, ['link'])).trim();
    if (!link) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i) || b.match(/<link[^>]*href=["']([^"']+)/i);
      link = alt ? decode(alt[1]) : '';
    }
    if (!link) link = decode(tag(b, ['guid', 'id']));
    const date = tag(b, ['pubDate', 'published', 'updated', 'dc:date']);
    return {
      title: plain(tag(b, ['title']), 300),
      link: link.trim(),
      summary: plain(tag(b, ['description', 'summary', 'content:encoded', 'content']), 900),
      date: date ? new Date(decode(date)) : null,
      image: image(b),
    };
  }).filter((i) => i.title && i.link);
}

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }, signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

const feeds = await query(`*[_type == "feedSource" && active != false && !(_id in path("drafts.**"))]{_id, name, url, section, lang, limit, seen}`);
console.log(`المصادر المفعّلة: ${feeds.length}`);
let total = 0;

for (const f of feeds) {
  const now = new Date().toISOString();
  try {
    const items = parse(await get(f.url));
    const seen = new Set(f.seen || []);
    const fresh = items
      .filter((i) => !seen.has(hash(i.link)))
      .filter((i) => !i.date || isNaN(i.date) || Date.now() - i.date.getTime() < MAX_AGE_H * 3600e3)
      .slice(0, f.limit || 6);

    // حين لا تحمل الخلاصة صورة، نأخذ صورة المشاركة (og:image) من صفحة الخبر نفسها.
    for (const i of fresh) {
      if (i.image || /news\.google\./.test(i.link)) continue;
      try {
        const h = await get(i.link);
        const m = h.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)/i) || h.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i);
        if (m && !/logo/i.test(m[1])) i.image = decode(m[1]).trim();
      } catch {}
    }

    const muts = fresh.map((i) => {
      const id = `feed-${hash(i.link)}`;
      return {
        createIfNotExists: {
          _id: `drafts.${id}`,
          _type: 'article',
          kind: 'news',
          section: f.section,
          desk: deskFor({ title: i.title, feedSummary: i.summary, section: f.section }),
          // عناوين Google News تنتهي باسم الوسيلة (" - الميادين"): يُحذف.
          title: (/news\.google\./.test(i.link) ? i.title.replace(/\s+[-–]\s+[^-–]{2,60}$/, '') : i.title).slice(0, 160),
          feedSummary: i.summary || i.title,
          source: f.name,
          sourceUrl: i.link,
          ...(i.image ? { feedImage: i.image } : {}),
          feedLang: f.lang || 'ar',
          breaking: false,
          featured: false,
          workflow: 'incoming',
          history: [{ _key: key(), _type: 'object', status: 'incoming', by: `المصادر الآلية: ${f.name}`, at: now }],
        },
      };
    });
    // لا يُعاد إنشاء خبر نُشر أو حُذف: نحفظ بصمات الروابط في المصدر نفسه.
    const stale = items.filter((i) => i.date && !isNaN(i.date) && Date.now() - i.date.getTime() >= MAX_AGE_H * 3600e3);
    const newSeen = [...fresh, ...stale].map((i) => hash(i.link)).concat(f.seen || []);
    const uniq = [...new Set(newSeen)].slice(0, 400);
    await mutate([...muts, { patch: { id: f._id, set: { lastRun: now, lastStatus: `تمّ: ${items.length} في الخلاصة، ${fresh.length} جديدة`, lastCount: fresh.length, seen: uniq } } }]);
    total += fresh.length;
    console.log(`✓ ${f.name}: ${fresh.length} جديدة من ${items.length}`);
  } catch (e) {
    console.log(`✗ ${f.name}: ${e.message}`);
    await mutate([{ patch: { id: f._id, set: { lastRun: now, lastStatus: `خطأ: ${String(e.message).slice(0, 120)}`, lastCount: 0 } } }]).catch(() => {});
  }
}
console.log(`المجموع: ${total} خبراً جديداً`);

// تصنيف ما سبق وروده بلا مكتب (مرّة واحدة لكلّ خبر).
const untagged = await query(`*[_type == "article" && workflow == "incoming" && !defined(desk)][0...1500]{_id, title, feedSummary, section}`);
for (let i = 0; i < untagged.length; i += 100) {
  await mutate(untagged.slice(i, i + 100).map((a) => ({ patch: { id: a._id, set: { desk: deskFor(a) } } })));
}
if (untagged.length) console.log(`صُنّف ${untagged.length} خبراً وارداً على المكاتب.`);
