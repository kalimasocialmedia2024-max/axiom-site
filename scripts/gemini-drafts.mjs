// مسوّدات الأخبار اللبنانية والسورية: كثير منها يصل من المصادر بعنوانه وحده.
// لكلّ خبر وارد عن لبنان أو سوريا بلا نصّ، يُطلب من Gemini (مع البحث في Google) أن يجد الخبر
// ويكتب ملخّصاً محايداً ومسوّدة نصّ بالعربية. يبقى الخبر في "الوارد": لا يُنشر شيء إلا بقرار التحرير.
// لا يُذكر أيّ أثر لهذه الأداة في نصّ الخبر أو سجلّه.
import { query, mutate, key } from './lib.mjs';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.log('لا مفتاح Gemini؛ تخطٍّ.');
  process.exit(0);
}
// الحصّة المجانية: نماذج Flash Lite تسمح بنحو 500 طلب يومياً (Flash الكامل 20 فقط).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',');
let MODEL = MODELS[0];
const PER_RUN = Number(process.env.GEMINI_PER_RUN || 10);
const LOG = 'gemini-log';

const LB = /لبنان|لبناني|بيروت|طرابلس|صيدا|صور|بعلبك|البقاع|الجنوب اللبناني|عكار|جبيل|زحلة|النبطية|Lebanon|Leban|Beirut|Liban/i;
const SY = /سوري|دمشق|حلب|حمص|حماة|إدلب|ادلب|اللاذقية|طرطوس|درعا|السويداء|دير الزور|الرقة|الحسكة|القامشلي|الشرع|Syria|Damascus|Aleppo|Syrie/i;

const clean = (s = '') => s.replace(/\s+/g, ' ').trim();
// "بلا نصّ": نصّ المصدر لا يزيد على العنوان إلا بأحرف قليلة (اسم المصدر مثلاً).
function headlineOnly(a) {
  const t = clean(a.title).replace(/\s+-\s+[^-]+$/, '');
  const s = clean(a.feedSummary || '');
  return !s || s.replace(t, '').replace(/[\s\p{P}]/gu, '').length < 40;
}

const log = (await query(`*[_id == $id][0]{ ids }`, { id: LOG })) || { ids: [] };
const done = new Set(log.ids || []);

const items = await query(
  `*[_type == "article" && _id in path("drafts.**") && workflow == "incoming" && !defined(body)] | order(_createdAt desc)[0...300]{ _id, title, feedSummary, source, section, _createdAt }`
);
const todo = items
  .filter((a) => !done.has(a._id))
  .filter((a) => a.section === 'local' || LB.test(`${a.title} ${a.feedSummary || ''}`) || SY.test(`${a.title} ${a.feedSummary || ''}`))
  .filter(headlineOnly)
  .slice(0, PER_RUN);

console.log(`أخبار لبنان وسوريا بلا نصّ: ${todo.length} في هذه الدورة.`);

const PROMPT = (a) => `أنت محرّر في موقع إخباري لبناني عربي رصين.
هذا عنوان خبر نشره المصدر "${a.source}" بتاريخ ${a._createdAt.slice(0, 10)}:
"${clean(a.title)}"

ابحث عن هذا الخبر نفسه في المصدر أو في مصادر موثوقة أخرى نشرته في التاريخ نفسه تقريباً.
- إن لم تجد الخبر نفسه، أو لم تتأكّد أنه الخبر نفسه، فأجب بكلمة واحدة: NOT_FOUND
- إن وجدته، فأجب بهذا الشكل حرفياً، بلا أيّ مقدّمة أو تعليق:
SUMMARY:
(ثلاث جمل إلى خمس تنقل وقائع الخبر كما وردت في المصدر، منسوبة إليه)
BODY:
(خبر بالعربية الفصحى من ثلاث فقرات إلى خمس، بلغة محايدة: الوقائع أوّلاً ثم السياق.
انسب كلّ تصريح إلى قائله وكلّ معلومة إلى مصدرها. لا رأي ولا تقييم ولا توصيف منحاز ولا عبارات طائفية.
تحقّق من الأسماء والمناصب والأرقام والتواريخ، واحذف كلّ ما لم تتأكّد منه.
لا تذكر أنك بحثت، ولا تذكر أيّ أداة أو نموذج، ولا تضع روابط أو علامات تنسيق.)`;

async function ask(a) {
  for (;;) {
    const r = await call(a);
    if (r.status === 404 && MODELS.indexOf(MODEL) < MODELS.length - 1) {
      MODEL = MODELS[MODELS.indexOf(MODEL) + 1];
      console.log(`تجربة النموذج ${MODEL}`);
      continue;
    }
    return r;
  }
}
async function call(a) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: PROMPT(a) }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 },
    }),
  });
}
async function draft(a) {
  const r = await ask(a);
  if (r.status === 429) {
    const t = await r.text();
    let why = '';
    try { why = JSON.stringify((JSON.parse(t).error.details || []).flatMap((d) => d.violations || []).map((v) => [v.quotaMetric, v.quotaId, v.quotaValue])); } catch {}
    throw Object.assign(new Error(why || t.replace(/\s+/g, ' ').slice(0, 300)), { quota: true });
  }
  if (!r.ok) throw new Error(`Gemini ${MODEL} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
}

const blocks = (text) =>
  text
    .split(/\n{1,}/)
    .map((p) => p.replace(/^[-*#>\s]+/, '').replace(/\*\*/g, '').trim())
    .filter((p) => p.length > 1)
    .map((p) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text: p, marks: [] }] }));

let ok = 0, miss = 0;
for (const a of todo) {
  try {
    const out = await draft(a);
    const m = out.match(/SUMMARY:\s*([\s\S]*?)\s*BODY:\s*([\s\S]+)/i);
    if (!m || /NOT_FOUND/.test(out.slice(0, 40))) {
      miss++;
      console.log(`- لم يُعثر على نصّ: ${a.title.slice(0, 70)}`);
    } else {
      const body = blocks(m[2]);
      if (body.length) {
        await mutate([{ patch: { id: a._id, set: { feedSummary: clean(m[1]).slice(0, 1500), body } } }]);
        ok++;
        console.log(`✓ ${a.title.slice(0, 70)}`);
      } else miss++;
    }
    done.add(a._id);
  } catch (e) {
    if (e.quota) {
      // فحص تشخيصي: هل يعمل النموذج نفسه من دون البحث؟ (لا يُكتب شيء)
      const t = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'قل: نعم' }] }] }),
      });
      console.log(`فحص من دون بحث: ${t.status}`);
      console.log(`بلغت الحصّة المجانية حدّها (${MODEL})؛ يُستأنف لاحقاً. ${e.message}`);
      break;
    }
    console.log(`✗ ${a.title.slice(0, 60)}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 5000));
}

await mutate([
  { createIfNotExists: { _id: LOG, _type: 'automationLog', ids: [] } },
  { patch: { id: LOG, set: { ids: [...done].slice(-3000) } } },
]);
console.log(`انتهى: ${ok} مسوّدة، ${miss} بلا نتيجة.`);
