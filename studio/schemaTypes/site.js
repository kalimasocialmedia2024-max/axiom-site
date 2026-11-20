import { defineArrayMember, defineField, defineType } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'صفحة ثابتة',
  type: 'document',
  description: 'من نحن، الميثاق التحريري، سياسة التصحيح، أعلن معنا، انضمّ إلينا، اتصل بنا...',
  fields: [
    defineField({ name: 'title', title: 'العنوان', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'الرابط',
      type: 'slug',
      description: 'about، charter، corrections، advertise، join، contact، privacy، terms',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'body', title: 'النصّ', type: 'blockContent' }),
  ],
});

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'إعدادات الموقع',
  type: 'document',
  fields: [
    defineField({ name: 'breakingText', title: 'نصّ عاجل إضافيّ في الشريط (اختياريّ)', type: 'string' }),
    defineField({
      name: 'mostReadManual',
      title: 'الأكثر قراءة (اختيار يدويّ مؤقّت إلى أن يُربط عدّاد الزيارات)',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (r) => r.max(5),
    }),
    defineField({
      name: 'markets',
      title: 'الأسواق',
      type: 'array',
      of: [defineArrayMember({ type: 'object', fields: [{ name: 'label', type: 'string', title: 'البند' }, { name: 'value', type: 'string', title: 'السعر' }], preview: { select: { title: 'label', subtitle: 'value' } } })],
    }),
    defineField({
      name: 'matches',
      title: 'المباريات',
      type: 'array',
      of: [defineArrayMember({ type: 'object', fields: [{ name: 'home', type: 'string', title: 'الفريق الأوّل' }, { name: 'score', type: 'string', title: 'النتيجة' }, { name: 'away', type: 'string', title: 'الفريق الثاني' }], preview: { select: { title: 'home', subtitle: 'score' } } })],
    }),
  ],
  preview: { prepare: () => ({ title: 'إعدادات الموقع' }) },
});
