import { defineField, defineType } from 'sanity';

const SECTIONS = [
  { title: 'محلي', value: 'local' },
  { title: 'إقليمي ودولي', value: 'regional' },
  { title: 'اقتصاد', value: 'economy' },
  { title: 'صحة', value: 'health' },
  { title: 'رياضة', value: 'sports' },
  { title: 'منوعات', value: 'variety' },
];

// مصدر أخبار آليّ: تُجلب عناوينه كلّ ساعة إلى طابور "أخبار واردة من المصادر".
export const feedSource = defineType({
  name: 'feedSource',
  title: 'مصدر أخبار آليّ',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'اسم المصدر كما يُذكر في الخبر', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'url', title: 'رابط خلاصة RSS', type: 'url', validation: (r) => r.required() }),
    defineField({ name: 'section', title: 'القسم', type: 'string', options: { list: SECTIONS }, validation: (r) => r.required() }),
    defineField({ name: 'category', title: 'الفئة', type: 'string', options: { list: ['محلي', 'إقليمي', 'وكالة عربية رسمية', 'صحافة غربية', 'الصين', 'روسيا', 'الهند', 'منظّمات دولية', 'مرخّص للنقل'] } }),
    defineField({ name: 'lang', title: 'اللغة', type: 'string', options: { list: ['ar', 'en', 'fr', 'ru', 'zh'] }, initialValue: 'ar' }),
    defineField({ name: 'limit', title: 'أقصى عدد من الأخبار في كلّ جولة', type: 'number', initialValue: 6 }),
    defineField({ name: 'active', title: 'مفعّل', type: 'boolean', initialValue: true }),
    defineField({ name: 'terms', title: 'ملاحظة عن شروط الاستعمال', type: 'text', rows: 2 }),
    defineField({ name: 'lastRun', title: 'آخر جلب', type: 'datetime', readOnly: true }),
    defineField({ name: 'lastStatus', title: 'نتيجة آخر جلب', type: 'string', readOnly: true }),
    defineField({ name: 'lastCount', title: 'عدد الأخبار الجديدة في آخر جلب', type: 'number', readOnly: true }),
    defineField({ name: 'seen', title: 'روابط سبق جلبها', type: 'array', of: [{ type: 'string' }], readOnly: true, hidden: true }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'lastStatus', active: 'active' },
    prepare: ({ title, subtitle, active }) => ({ title: title + (active === false ? ' (موقوف)' : ''), subtitle }),
  },
});
