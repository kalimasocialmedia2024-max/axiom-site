import { defineArrayMember, defineField, defineType } from 'sanity';
import { STATUS_LIST } from '../workflow/status.js';

const KINDS = [
  { title: 'خبر', value: 'news' },
  { title: 'تحليل', value: 'analysis' },
  { title: 'رأي', value: 'opinion' },
  { title: 'تحقيق', value: 'investigation' },
  { title: 'خاصّ', value: 'special' },
  { title: 'دراسة', value: 'study' },
];

const SECTIONS = [
  { title: 'محلي', value: 'local' },
  { title: 'إقليمي ودولي', value: 'regional' },
  { title: 'اقتصاد', value: 'economy' },
  { title: 'صحة', value: 'health' },
  { title: 'رياضة', value: 'sports' },
  { title: 'منوعات', value: 'variety' },
];

const only = (...kinds) => ({ document }) => !kinds.includes(document?.kind);

export const article = defineType({
  name: 'article',
  title: 'مادّة',
  type: 'document',
  groups: [
    { name: 'content', title: 'المحتوى', default: true },
    { name: 'extra', title: 'عناصر القالب' },
    { name: 'publish', title: 'النشر' },
    { name: 'workflow', title: 'مسار الموافقة' },
  ],
  fields: [
    defineField({ name: 'kind', title: 'نوع المادّة', type: 'string', group: 'content', options: { list: KINDS, layout: 'radio', direction: 'horizontal' }, initialValue: 'news', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'العنوان', type: 'string', group: 'content', validation: (r) => r.required().max(160) }),
    defineField({ name: 'subtitle', title: 'العنوان الفرعي', type: 'string', group: 'content', hidden: only('analysis', 'investigation', 'special', 'study') }),
    defineField({ name: 'excerpt', title: 'المقتطف (سطران يظهران في البطاقات؛ وفي الدراسة: فقرة الملخّص التنفيذيّ)', type: 'text', rows: 3, group: 'content', validation: (r) => r.max(600) }),
    defineField({
      name: 'authors',
      title: 'الكاتب أو الكتّاب',
      description: 'الأخبار تُنشر باسم الشبكة، فلا يُذكر فيها كاتب.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'writer' }] })],
      hidden: ({ document }) => document?.kind === 'news',
    }),
    defineField({ name: 'section', title: 'القسم', type: 'string', group: 'content', options: { list: SECTIONS }, description: 'إلزاميّ للأخبار، واختياريّ لغيرها.', validation: (r) => r.custom((v, ctx) => (ctx.document?.kind === 'news' && !v ? 'اختر قسم الخبر' : true)) }),
    defineField({
      name: 'mainImage',
      title: 'الصورة الرئيسية',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'وصف الصورة للقرّاء بالصوت' }),
        defineField({ name: 'caption', type: 'string', title: 'التعليق' }),
        defineField({ name: 'credit', type: 'string', title: 'مصدر الصورة' }),
      ],
    }),
    defineField({ name: 'body', title: 'النصّ', type: 'blockContent', group: 'content' }),

    // عناصر خاصّة بكلّ قالب
    defineField({ name: 'source', title: 'المصدر (الجهة أو الوكالة)', type: 'string', group: 'extra', hidden: only('news') }),
    defineField({ name: 'context', title: 'سياق الخبر', type: 'text', rows: 3, group: 'extra', hidden: only('news') }),
    defineField({ name: 'summary', title: 'الخلاصة (نقاط)', type: 'array', of: [{ type: 'string' }], group: 'extra', hidden: only('analysis') }),
    defineField({ name: 'researchTeam', title: 'فريق التحقيق (الأسماء)', type: 'string', group: 'extra', hidden: only('investigation', 'special') }),
    defineField({ name: 'methodology', title: 'منهجية التحقيق', type: 'text', rows: 4, group: 'extra', hidden: only('investigation', 'special') }),
    defineField({ name: 'keyFindings', title: 'أبرز الخلاصات', type: 'array', of: [{ type: 'string' }], group: 'extra', hidden: only('study') }),
    defineField({ name: 'recommendations', title: 'التوصيات', type: 'array', of: [{ type: 'string' }], group: 'extra', hidden: only('study') }),
    defineField({ name: 'pdf', title: 'ملفّ الدراسة (PDF)', type: 'file', options: { accept: 'application/pdf' }, group: 'extra', hidden: only('study') }),
    defineField({ name: 'pages', title: 'عدد الصفحات', type: 'number', group: 'extra', hidden: only('study') }),
    defineField({ name: 'citation', title: 'صيغة الاستشهاد (اتركها فارغة لتُولَّد تلقائياً)', type: 'text', rows: 2, group: 'extra', hidden: only('study') }),
    defineField({ name: 'englishUrl', title: 'رابط النسخة الإنكليزية', type: 'url', group: 'extra', hidden: only('study') }),

    // النشر
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', group: 'publish', description: 'اضغط "توليد"، أو اكتبه بالإنكليزية بكلمات تفصل بينها شرطات.', options: { source: 'title', maxLength: 90, slugify: slugify }, validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime', group: 'publish', description: 'يُملأ تلقائياً عند النشر.' }),
    defineField({ name: 'tags', title: 'الوسوم', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' }, group: 'publish' }),
    defineField({ name: 'breaking', title: 'عاجل', type: 'boolean', group: 'publish', initialValue: false, hidden: only('news') }),
    defineField({ name: 'featured', title: 'في واجهة الصفحة الرئيسية', type: 'boolean', group: 'publish', initialValue: false }),
    defineField({ name: 'readingMinutes', title: 'مدّة القراءة بالدقائق (اختياريّ، تُحسب تلقائياً)', type: 'number', group: 'publish' }),

    // مسار الموافقة: يُدار بالأزرار أسفل الشاشة، لا يدوياً
    defineField({ name: 'workflow', title: 'المرحلة', type: 'string', group: 'workflow', options: { list: STATUS_LIST }, initialValue: 'draft', readOnly: true }),
    defineField({ name: 'editorNote', title: 'ملاحظات التحرير للكاتب', type: 'text', rows: 4, group: 'workflow' }),
    defineField({
      name: 'history',
      title: 'سجلّ المراحل',
      type: 'array',
      group: 'workflow',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'status', type: 'string', title: 'المرحلة' },
            { name: 'by', type: 'string', title: 'بواسطة' },
            { name: 'at', type: 'datetime', title: 'الوقت' },
          ],
          preview: {
            select: { status: 'status', by: 'by', at: 'at' },
            prepare: ({ status, by, at }) => ({ title: STATUS_LIST.find((s) => s.value === status)?.title || status, subtitle: `${by || ''} · ${at ? new Date(at).toLocaleString('ar-LB') : ''}` }),
          },
        }),
      ],
    }),
  ],
  orderings: [{ title: 'الأحدث', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', kind: 'kind', status: 'workflow', media: 'mainImage' },
    prepare: ({ title, kind, status, media }) => ({
      title,
      subtitle: [KINDS.find((k) => k.value === kind)?.title, STATUS_LIST.find((s) => s.value === status)?.title].filter(Boolean).join(' · '),
      media,
    }),
  },
});

// الرابط: يبقى العربي كما هو إن لم يُكتب بالإنكليزية، مع استبدال المسافات بشرطات.
function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}
