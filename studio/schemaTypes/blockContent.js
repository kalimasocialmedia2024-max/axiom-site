import { defineArrayMember, defineField, defineType } from 'sanity';
import { createElement as h } from 'react';

// أدوات تنسيق إضافية: تظهر في المحرّر كما تظهر على الموقع.
const deco = (title, value, style, icon) => ({
  title,
  value,
  icon: () => h('span', { style: { ...style, fontSize: 13, padding: '0 2px' } }, icon),
  component: (props) => h('span', { style }, props.children),
});

// نصّ المادّة: فقرات وعناوين محاور واقتباسات وقوائم وهوامش وصور ووثائق.
export const blockContent = defineType({
  name: 'blockContent',
  title: 'النصّ',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'فقرة', value: 'normal' },
        { title: 'فقرة كبيرة (افتتاحية)', value: 'lead', component: (p) => h('div', { style: { fontSize: '1.3em', fontWeight: 600, lineHeight: 1.8 } }, p.children) },
        { title: 'فقرة صغيرة', value: 'small', component: (p) => h('div', { style: { fontSize: '0.85em', color: '#6b6b74' } }, p.children) },
        { title: 'عنوان محور', value: 'h2' },
        { title: 'عنوان فرعي', value: 'h3' },
        { title: 'عنوان صغير', value: 'h4' },
        { title: 'اقتباس بارز', value: 'blockquote' },
      ],
      lists: [
        { title: 'نقاط', value: 'bullet' },
        { title: 'ترقيم', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'غامق', value: 'strong', component: (p) => h('strong', { style: { fontWeight: 900 } }, p.children) },
          { title: 'مائل', value: 'em' },
          { title: 'تسطير', value: 'underline' },
          { title: 'شطب', value: 'strike-through' },
          deco('تكبير', 'big', { fontSize: '1.25em', fontWeight: 600 }, 'A+'),
          deco('تصغير', 'small', { fontSize: '0.82em' }, 'A-'),
          deco('أحمر', 'c-red', { color: '#D0021B' }, '●'),
          deco('أزرق', 'c-blue', { color: '#1F5FAD' }, '●'),
          deco('أخضر', 'c-green', { color: '#1E7D4F' }, '●'),
          deco('رمادي', 'c-gray', { color: '#6b6b74' }, '●'),
          deco('تظليل أصفر', 'mark', { background: '#FFE58A', color: '#111' }, '▮'),
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'رابط',
            fields: [{ name: 'href', type: 'url', title: 'الرابط', validation: (r) => r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }) }],
          },
          {
            name: 'footnote',
            type: 'object',
            title: 'هامش',
            description: 'يظهر رقماً في النصّ، ويُجمع في قسم الهوامش آخر الدراسة.',
            fields: [{ name: 'text', type: 'text', rows: 2, title: 'نصّ الهامش (المؤلّف، العنوان، الناشر، السنة، الصفحة)' }],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      title: 'صورة',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'وصف الصورة للقرّاء بالصوت' }),
        defineField({ name: 'caption', type: 'string', title: 'التعليق' }),
        defineField({ name: 'credit', type: 'string', title: 'مصدر الصورة' }),
      ],
    }),
    defineArrayMember({
      name: 'evidence',
      type: 'object',
      title: 'وثيقة',
      fields: [
        defineField({ name: 'label', type: 'string', title: 'التسمية', initialValue: 'وثيقة' }),
        defineField({ name: 'image', type: 'image', title: 'صورة الوثيقة' }),
        defineField({ name: 'alt', type: 'string', title: 'وصف الصورة' }),
        defineField({ name: 'caption', type: 'text', rows: 3, title: 'ما تثبته الوثيقة ومصدرها وكيف جرى التحقّق منها' }),
      ],
      preview: { select: { title: 'caption', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'وثيقة', media }) },
    }),
    defineArrayMember({
      name: 'chart',
      type: 'object',
      title: 'خريطة أو رسم بيانيّ',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'العنوان (مثلاً: شكل 1: ...)' }),
        defineField({ name: 'image', type: 'image', title: 'الصورة' }),
        defineField({ name: 'source', type: 'string', title: 'مصدر البيانات' }),
      ],
      preview: { select: { title: 'title', media: 'image' } },
    }),
    defineArrayMember({
      name: 'embed',
      type: 'object',
      title: 'فيديو يوتيوب',
      fields: [
        defineField({ name: 'url', type: 'url', title: 'رابط الفيديو' }),
        defineField({ name: 'title', type: 'string', title: 'العنوان' }),
      ],
      preview: { select: { title: 'title', subtitle: 'url' } },
    }),
  ],
});
