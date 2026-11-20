// جلب المحتوى من Sanity عبر واجهة HTTP مباشرة، دون مكتبات إضافية.
// يُقرأ المنشور فقط (published): لا يظهر على الموقع إلا ما نشره رئيس التحرير.

import { SECTIONS } from './config.js';
import { sampleData } from './sample.js';

const env = (k) => (import.meta.env && import.meta.env[k]) || (typeof process !== 'undefined' ? process.env[k] : undefined);

const PROJECT_ID = env('SANITY_PROJECT_ID');
const DATASET = env('SANITY_DATASET') || 'production';
const API_VERSION = '2025-02-19';

export const sanityEnabled = Boolean(PROJECT_ID);

async function query(groq) {
  const url = new URL(`https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  url.searchParams.set('query', groq);
  url.searchParams.set('perspective', 'published');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

const PERSON = `{ name, "slug": slug.current, role, bio, "photo": photo.asset->url, specialties, x, facebook, email }`;

const ARTICLE = `{
  _id, title, "slug": slug.current, kind, section, subtitle, excerpt,
  "publishedAt": coalesce(publishedAt, _createdAt), "updatedAt": _updatedAt,
  readingMinutes, breaking, featured, source, sourceUrl, context, summary, pullQuote,
  methodology, keyFindings, recommendations, pages, citation, researchTeam,
  "pdf": pdf.asset->url, "pdfSize": pdf.asset->size, "englishUrl": englishUrl,
  "image": coalesce(mainImage{ "url": asset->url, alt, caption, credit }, select(defined(feedImage) => { "url": feedImage, "alt": "", "credit": source })),
  "authors": authors[]->${PERSON},
  tags,
  body[]{ ..., _type == "image" => { "url": asset->url }, _type == "evidence" => { "url": image.asset->url }, _type == "chart" => { "url": image.asset->url } }
}`;

const EPISODE = `{
  _id, title, "slug": slug.current, mediaType, guest, duration, description,
  "publishedAt": coalesce(publishedAt, _createdAt), youtubeUrl, spotifyUrl, appleUrl,
  "audio": audio.asset->url, "cover": cover.asset->url, transcript,
  "program": program->{ title, "slug": slug.current }
}`;

const ALL = `{
  "articles": *[_type == "article" && defined(slug.current)] | order(publishedAt desc) ${ARTICLE},
  "writers": *[_type == "writer" && defined(slug.current) && showOnSite != false] | order(name asc) ${PERSON},
  "episodes": *[_type == "episode" && defined(slug.current)] | order(publishedAt desc) ${EPISODE},
  "programs": *[_type == "program" && defined(slug.current)] | order(order asc) { title, "slug": slug.current, description, schedule, "cover": cover.asset->url },
  "pages": *[_type == "page" && defined(slug.current)] { title, "slug": slug.current, body },
  "settings": *[_type == "siteSettings"][0] { breakingText, markets, matches, mostReadManual[]->{ title, "slug": slug.current, kind } }
}`;

let cache;

export function getData() {
  if (!cache) {
    cache = (sanityEnabled ? query(ALL) : Promise.resolve(sampleData())).then(normalize);
  }
  return cache;
}

function normalize(d) {
  const articles = (d.articles || []).map((a) => ({ ...a, authors: a.authors || [], tags: a.tags || [], body: a.body || [] }));
  return {
    articles,
    writers: d.writers || [],
    episodes: d.episodes || [],
    programs: d.programs || [],
    pages: d.pages || [],
    settings: d.settings || {},
    sections: SECTIONS,
    sample: !sanityEnabled,
  };
}

// أدوات مساعدة
export const byKind = (list, kind) => list.filter((a) => a.kind === kind);
export const bySection = (list, slug) => list.filter((a) => a.section === slug);
export const byWriter = (list, slug) => list.filter((a) => (a.authors || []).some((w) => w.slug === slug));

// "الأكثر قراءة": يُختار من لوحة التحرير يدوياً إلى أن يُربط عدّاد الزيارات، وإلا فالأحدث.
export function mostRead(data, n = 5) {
  const manual = (data.settings.mostReadManual || []).filter(Boolean);
  const list = manual.length ? manual : data.articles.filter((a) => a.kind !== 'study');
  return list.slice(0, n);
}

export function related(data, article, n = 3) {
  const tags = new Set(article.tags || []);
  return data.articles
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({ a, score: (a.kind === article.kind ? 2 : 0) + (a.section && a.section === article.section ? 2 : 0) + (a.tags || []).filter((t) => tags.has(t)).length * 3 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map((x) => x.a);
}

// الوسوم: عدد الموادّ لكلّ وسم، مرتّبة من الأكثر تداولاً.
export function tagCounts(list) {
  const m = new Map();
  for (const a of list) for (const t of a.tags || []) m.set(t, (m.get(t) || 0) + 1);
  return [...m.entries()].sort((x, y) => y[1] - x[1]).map(([tag, count]) => ({ tag, count }));
}
export const tagUrl = (t) => `/tag/${encodeURIComponent(t)}/`;
// يقدّم المادّة المصوّرة إلى رأس القائمة من دون تغيير ترتيب الباقي.
export function imageFirst(list) {
  const i = list.findIndex((a) => a.image?.url);
  return i > 0 ? [list[i], ...list.slice(0, i), ...list.slice(i + 1)] : list;
}
