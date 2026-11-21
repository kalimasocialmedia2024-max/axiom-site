// يبلّغ Bing (ومحرّكات IndexNow الأخرى) بالموادّ المنشورة خلال آخر 40 دقيقة.
// يعمل ضمن مهمّة النشر كلّ ربع ساعة؛ تكرار الإبلاغ عن رابط واحد لا يضرّ.
const SITE = 'https://axiomplusmedia.com';
const KEY = 'b66dfcb15a5ecbe372ea17533053ec40';
const PATHS = { news: 'news', analysis: 'analysis', opinion: 'opinion', investigation: 'investigations', special: 'special', study: 'studies' };

const since = new Date(Date.now() - 40 * 60e3).toISOString();
const q = `*[_type=="article" && defined(slug.current) && coalesce(publishedAt,_createdAt) > "${since}"]{"slug":slug.current,kind}`;
const url = new URL('https://9rw3viyf.api.sanity.io/v2025-02-19/data/query/production');
url.searchParams.set('query', q);
url.searchParams.set('perspective', 'published');
const list = (await (await fetch(url)).json()).result || [];
if (!list.length) {
  console.log('لا موادّ جديدة.');
  process.exit(0);
}
const urlList = [SITE + '/', SITE + '/news/', ...list.map((a) => encodeURI(`${SITE}/${PATHS[a.kind] || "news"}/${a.slug}/`))];
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'axiomplusmedia.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log('IndexNow', res.status, urlList.length, res.status < 300 ? '' : (await res.text()).slice(0, 200));
