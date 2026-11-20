import { defineField, defineType } from 'sanity';
import { ROLES } from '../workflow/status.js';

// الكاتب: صفحته على الموقع، ودوره في غرفة التحرير.
export const writer = defineType({
  name: 'writer',
  title: 'كاتب وفريق التحرير',
  type: 'document',
  groups: [
    { name: 'profile', title: 'الصفحة العامّة', default: true },
    { name: 'staff', title: 'الدور في التحرير' },
  ],
  fields: [
    defineField({ name: 'name', title: 'الاسم', type: 'string', group: 'profile', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', group: 'profile', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'الصفة', type: 'string', group: 'profile', description: 'مثلاً: باحث في الشؤون الإقليمية' }),
    defineField({ name: 'photo', title: 'الصورة', type: 'image', group: 'profile', options: { hotspot: true } }),
    defineField({ name: 'bio', title: 'نبذة', type: 'text', rows: 4, group: 'profile' }),
    defineField({ name: 'specialties', title: 'الاختصاصات', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' }, group: 'profile' }),
    defineField({ name: 'x', title: 'حساب X', type: 'url', group: 'profile' }),
    defineField({ name: 'facebook', title: 'فيسبوك', type: 'url', group: 'profile' }),
    defineField({ name: 'email', title: 'البريد الظاهر للقرّاء (اختياريّ)', type: 'string', group: 'profile' }),
    defineField({ name: 'showOnSite', title: 'إظهار صفحته على الموقع', type: 'boolean', group: 'profile', initialValue: true }),

    defineField({
      name: 'staffRole',
      title: 'الدور في التحرير',
      type: 'string',
      group: 'staff',
      options: { list: ROLES, layout: 'radio' },
      initialValue: 'writer',
      description: 'الكاتب يرسل إلى التحرير. المحرّر يعيد أو يرفع إلى رئيس التحرير. رئيس التحرير وحده ينشر.',
    }),
    defineField({
      name: 'staffEmail',
      title: 'بريد حسابه في لوحة التحرير',
      type: 'string',
      group: 'staff',
      description: 'البريد نفسه الذي دُعي به إلى Sanity، ليتعرّف الاستوديو على دوره.',
      validation: (r) => r.email(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo', staffRole: 'staffRole' },
    prepare: ({ title, subtitle, media, staffRole }) => ({
      title,
      subtitle: [ROLES.find((x) => x.value === staffRole)?.title, subtitle].filter(Boolean).join(' · '),
      media,
    }),
  },
});
