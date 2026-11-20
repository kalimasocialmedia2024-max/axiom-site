// أدوات مشتركة لسكربتات الأتمتة: الاتّصال بـ Sanity وتنظيف النصوص.
import { createHash } from 'node:crypto';

const PID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_WRITE_TOKEN;
const V = 'v2025-02-19';

if (!PID || !TOKEN) {
  console.error('SANITY_PROJECT_ID و SANITY_WRITE_TOKEN مطلوبان.');
  process.exit(1);
}

const base = `https://${PID}.api.sanity.io/${V}`;
const auth = { Authorization: `Bearer ${TOKEN}` };

export async function query(groq, params = {}) {
  const u = new URL(`${base}/data/query/${DATASET}`);
  u.searchParams.set('query', groq);
  u.searchParams.set('perspective', 'raw');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(`$${k}`, JSON.stringify(v));
  const r = await fetch(u, { headers: auth });
  if (!r.ok) throw new Error(`query ${r.status}: ${await r.text()}`);
  return (await r.json()).result;
}

export async function mutate(mutations) {
  if (!mutations.length) return;
  const r = await fetch(`${base}/data/mutate/${DATASET}?returnIds=true`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  if (!r.ok) throw new Error(`mutate ${r.status}: ${await r.text()}`);
  return r.json();
}

export async function uploadFile(buffer, filename, contentType) {
  const r = await fetch(`${base}/assets/files/${DATASET}?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': contentType },
    body: buffer,
  });
  if (!r.ok) throw new Error(`upload ${r.status}: ${await r.text()}`);
  return (await r.json()).document._id;
}

export const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 20);
export const key = () => Math.random().toString(36).slice(2, 10);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', hellip: '…', mdash: '-', ndash: '-', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
export function plain(html = '', max = 800) {
  const t = decode(decode(html))
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t;
}
