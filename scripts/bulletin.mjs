// النشرة الصوتية الصباحية: أبرز أخبار آخر 24 ساعة بصوتَي حامد وزارية (Azure).
// تُوضع الحلقة مسوّدةً في لوحة التحرير، ولا تُنشر إلا بقرار المحرّر.
// ويعيد السكربت توليد صوت أيّ نشرة فعّل المحرّر فيها "أعد توليد الصوت".
import { query, mutate, uploadFile } from './lib.mjs';

const AZ_KEY = process.env.AZURE_SPEECH_KEY;
const AZ_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';
const VOICES = ['ar-SA-HamedNeural', 'ar-SA-ZariyahNeural'];
const ITEMS = Number(process.env.BULLETIN_ITEMS || 5);
const HOUR_UTC = Number(process.env.BULLETIN_HOUR_UTC || 5); // 7 صباحاً بتوقيت بيروت شتاءً

if (!AZ_KEY) {
  console.log('AZURE_SPEECH_KEY غير موجود: لا نشرة.');
  process.exit(0);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraphs = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

async function synth(text) {
  const parts = paragraphs(text)
    .map((p, i) => `<voice name="${VOICES[i % 2]}"><prosody rate="-3%">${esc(p)}</prosody><break time="600ms"/></voice>`)
    .join('');
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ar-SA">${parts}</speak>`;
  const r = await fetch(`https://${AZ_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZ_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'axiomplus-bulletin',
    },
    body: ssml,
  });
  if (!r.ok) throw new Error(`Azure ${r.status}: ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

const mmss = (bytes) => {
  const s = Math.round((bytes * 8) / 96000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

async function attach(id, text, slugDate) {
  const audio = await synth(text);
  const assetId = await uploadFile(audio, `axiomplus-bulletin-${slugDate}.mp3`, 'audio/mpeg');
  await mutate([{ patch: { id, set: { audio: { _type: 'file', asset: { _type: 'reference', _ref: assetId } }, duration: mmss(audio.length), regenerate: false } } }]);
}

// 1) إعادة التوليد بطلب المحرّر
const redo = await query(`*[_type == "episode" && mediaType == "audio" && regenerate == true]{_id, transcript, "slug": slug.current}`);
for (const e of redo) {
  try {
    await attach(e._id, e.transcript || '', (e.slug || e._id).replace(/^drafts\./, ''));
    console.log(`أُعيد توليد ${e._id}`);
  } catch (err) {
    console.log(`تعذّر إعادة توليد ${e._id}: ${err.message}`);
  }
}

// 2) نشرة اليوم
const now = new Date();
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(now); // YYYY-MM-DD
const id = `drafts.bulletin-${day}`;
const exists = await query(`count(*[_id in [$a, $b]])`, { a: id, b: `bulletin-${day}` });
if (exists || now.getUTCHours() < HOUR_UTC) {
  console.log(exists ? 'نشرة اليوم موجودة.' : 'لم يحن موعد النشرة بعد.');
  process.exit(0);
}

const since = new Date(now.getTime() - 24 * 3600e3).toISOString();
const news = await query(
  `*[_type == "article" && kind == "news" && !(_id in path("drafts.**")) && publishedAt > $since] | order(breaking desc, featured desc, publishedAt desc)[0...${ITEMS}]{title, excerpt}`,
  { since },
);
if (news.length < 3) {
  console.log(`أخبار منشورة غير كافية (${news.length}): لا نشرة اليوم.`);
  process.exit(0);
}

const dateAr = new Intl.DateTimeFormat('ar', { timeZone: 'Asia/Beirut', weekday: 'long', day: 'numeric', month: 'long' }).format(now);
const firstSentence = (s = '') => (s.split(/(?<=[.!؟?])\s/)[0] || '').trim();
const text = [
  `صباح الخير. هذه نشرة أكسيوم بلس ليوم ${dateAr}.`,
  ...news.map((n) => [n.title.trim().replace(/[.،]?$/, '.'), firstSentence(n.excerpt)].filter(Boolean).join(' ')),
  'تفاصيل هذه الأخبار وغيرها على موقع أكسيوم بلس. إلى اللقاء.',
].join('\n\n');

await mutate([
  {
    createIfNotExists: {
      _id: id,
      _type: 'episode',
      mediaType: 'audio',
      title: `النشرة الصباحية: ${dateAr}`,
      slug: { _type: 'slug', current: `bulletin-${day}` },
      description: 'أبرز أخبار الساعات الأربع والعشرين الماضية في دقيقتين.',
      transcript: text,
      publishedAt: now.toISOString(),
      regenerate: false,
    },
  },
]);
await attach(id, text, day);
console.log(`أُنشئت نشرة ${day} مسوّدةً بانتظار المحرّر.`);
