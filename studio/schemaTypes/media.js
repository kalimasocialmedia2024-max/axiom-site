import { defineField, defineType } from 'sanity';

export const program = defineType({
  name: 'program',
  title: 'برنامج',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'اسم البرنامج', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'وصف من سطر', type: 'string' }),
    defineField({ name: 'schedule', title: 'موعد البثّ', type: 'string' }),
    defineField({ name: 'cover', title: 'الغلاف (مربّع)', type: 'image' }),
    defineField({ name: 'order', title: 'الترتيب', type: 'number' }),
  ],
});

export const episode = defineType({
  name: 'episode',
  title: 'حلقة: بودكاست أو فيديو أو نشرة صوتية',
  type: 'document',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'النوع',
      type: 'string',
      options: { list: [{ title: 'بودكاست', value: 'podcast' }, { title: 'فيديو', value: 'video' }, { title: 'النشرة الصوتية', value: 'audio' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'podcast',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', title: 'العنوان', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'الرابط', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'program', title: 'البرنامج', type: 'reference', to: [{ type: 'program' }] }),
    defineField({ name: 'guest', title: 'الضيف', type: 'string' }),
    defineField({ name: 'duration', title: 'المدّة (مثلاً 42:10)', type: 'string' }),
    defineField({ name: 'description', title: 'الوصف', type: 'text', rows: 3 }),
    defineField({ name: 'cover', title: 'الصورة المصغّرة', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'youtubeUrl', title: 'رابط يوتيوب', type: 'url' }),
    defineField({ name: 'audio', title: 'الملفّ الصوتيّ', type: 'file', options: { accept: 'audio/*' } }),
    defineField({ name: 'spotifyUrl', title: 'رابط سبوتيفاي', type: 'url' }),
    defineField({ name: 'appleUrl', title: 'رابط أبل بودكاست', type: 'url' }),
    defineField({ name: 'transcript', title: 'النصّ المكتوب', type: 'text', rows: 12 }),
    defineField({ name: 'publishedAt', title: 'تاريخ النشر', type: 'datetime' }),
  ],
  preview: { select: { title: 'title', subtitle: 'guest', media: 'cover' } },
});
