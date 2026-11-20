// محتوى مؤقّت يطابق القوالب المعتمدة، يظهر فقط قبل ربط الموقع بـ Sanity.
// كلّ نصّ هنا بين معقوفين، ويختفي تلقائياً حين تُنشر أولى الموادّ الحقيقية.

const p = (text) => ({ _type: 'block', style: 'normal', children: [{ _type: 'span', text }] });
const h2 = (text) => ({ _type: 'block', style: 'h2', children: [{ _type: 'span', text }] });
const quote = (text) => ({ _type: 'block', style: 'blockquote', children: [{ _type: 'span', text }] });
const withNote = (text, note, key) => ({
  _type: 'block',
  style: 'normal',
  markDefs: [{ _key: key, _type: 'footnote', text: note }],
  children: [{ _type: 'span', text, marks: [key] }],
});

const writers = Array.from({ length: 6 }, (_, i) => ({
  name: '[اسم الكاتب]',
  slug: `writer-${i + 1}`,
  role: '[صفته]',
  bio: '[نبذة من ثلاثة أسطر عن مسيرة الكاتب واختصاصه]',
  specialties: ['[اختصاص]', '[اختصاص]', '[اختصاص]'],
}));

const sections = ['local', 'regional', 'economy', 'health', 'sports', 'variety'];
const day = 864e5;
const base = Date.parse('2026-11-19T08:00:00Z');

function bodyFor(kind) {
  if (kind === 'study')
    return [
      h2('مقدّمة'), p('[فقرة من نصّ الدراسة]'), withNote('[فقرة تحمل إحالة إلى مرجع]', '[المؤلّف، عنوان المرجع، الناشر، السنة، الصفحة]', 'n1'),
      h2('[عنوان المحور]'), p('[فقرة من نصّ الدراسة]'), withNote('[فقرة مع إحالة]', '[المؤلّف، عنوان المرجع، الناشر، السنة، الصفحة]', 'n2'),
      h2('[عنوان المحور]'), p('[فقرة من نصّ الدراسة]'),
      h2('خاتمة: [عنوان الخلاصة]'), p('[فقرة من نصّ الدراسة]'),
    ];
  if (kind === 'investigation' || kind === 'special')
    return [
      p('[فقرة من النصّ]'), p('[فقرة من النصّ]'),
      h2('[عنوان المحور]'), p('[فقرة من النصّ]'), p('[فقرة من النصّ]'),
      h2('[عنوان المحور]'), p('[فقرة من النصّ]'), quote('[شهادة أو جملة مفصلية من التحقيق]'),
      h2('[عنوان المحور]'), p('[فقرة من النصّ]'),
    ];
  if (kind === 'opinion')
    return [p('[فقرة من النصّ]'), p('[فقرة من النصّ]'), quote('[جملة مقتبسة من المقال تلخّص موقف الكاتب]'), p('[فقرة من النصّ]'), p('[فقرة من النصّ]')];
  if (kind === 'analysis')
    return [p('[فقرة من النصّ]'), p('[فقرة من النصّ]'), h2('[عنوان فرعي]'), p('[فقرة من النصّ]'), p('[فقرة من النصّ]'), h2('[عنوان فرعي]'), p('[فقرة من النصّ]')];
  return [p('[الفقرة الأولى: من، ماذا، أين، متى]'), p('[فقرة من النصّ]'), p('[فقرة من النصّ]'), p('[فقرة من النصّ]')];
}

const TITLES = {
  news: '[عنوان الخبر]',
  analysis: '[عنوان التحليل]',
  opinion: '[عنوان مقال الرأي]',
  investigation: '[عنوان التحقيق]',
  special: '[عنوان مادّة خاصّة]',
  study: '[عنوان الدراسة]',
};

export function sampleData() {
  const articles = [];
  const counts = { news: 18, analysis: 6, opinion: 6, investigation: 3, special: 3, study: 3 };
  let t = 0;
  for (const [kind, n] of Object.entries(counts)) {
    for (let i = 1; i <= n; i++) {
      t++;
      articles.push({
        _id: `${kind}-${i}`,
        title: TITLES[kind],
        slug: `${kind}-${i}`,
        kind,
        section: kind === 'news' ? sections[i % sections.length] : null,
        subtitle: kind === 'study' ? '[عنوان فرعيّ يحدّد إشكالية الدراسة]' : kind === 'analysis' ? '[عنوان فرعي يحدّد السؤال الذي يجيب عنه التحليل]' : null,
        excerpt: '[سطران يلخّصان الفكرة المركزية ويدعوان القارئ إلى الدخول في النصّ]',
        publishedAt: new Date(base - t * day * 0.3).toISOString(),
        breaking: kind === 'news' && i === 1,
        featured: kind === 'analysis' && i === 1,
        source: kind === 'news' ? '[الجهة أو الوكالة]' : null,
        context: kind === 'news' ? '[سطران يضعان الخبر في سياقه، مع رابط إلى تحليل الشبكة إن وُجد]' : null,
        summary: kind === 'analysis' ? ['[نقطة أولى]', '[نقطة ثانية]', '[نقطة ثالثة]'] : null,
        methodology: kind === 'investigation' ? '[كيف جُمعت المعلومات، وما المصادر، وكيف تحقّق الفريق منها، وحقّ الردّ الذي مُنح للأطراف المعنيّة]' : null,
        researchTeam: kind === 'investigation' ? '[الأسماء]' : null,
        keyFindings: kind === 'study' ? ['[الخلاصة الأولى]', '[الخلاصة الثانية]', '[الخلاصة الثالثة]'] : null,
        recommendations: kind === 'study' ? ['[توصية]', '[توصية]', '[توصية]'] : null,
        pages: kind === 'study' ? 40 : null,
        authors: kind === 'news' ? [] : [writers[i % writers.length]],
        tags: ['[وسم]', '[وسم]', '[وسم]'],
        body: bodyFor(kind),
      });
    }
  }
  const types = ['podcast', 'video', 'audio'];
  const episodes = Array.from({ length: 9 }, (_, i) => ({
    _id: `ep-${i}`,
    title: types[i % 3] === 'audio' ? '[نشرة الساعة]' : '[عنوان الحلقة]',
    slug: `episode-${i + 1}`,
    mediaType: types[i % 3],
    guest: '[الضيف]',
    duration: '[المدّة]',
    description: '[وصف الحلقة ومحاورها]',
    publishedAt: new Date(base - i * day).toISOString(),
    program: { title: '[اسم البرنامج]', slug: 'program-1' },
  }));
  const programs = Array.from({ length: 4 }, (_, i) => ({
    title: '[اسم البرنامج]',
    slug: `program-${i + 1}`,
    description: '[وصف من سطر]',
    schedule: '[موعد البثّ]',
  }));
  return { articles, writers, episodes, programs, pages: [], settings: { breakingText: '[شريط الأخبار العاجلة]' } };
}
