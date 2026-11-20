// مراحل مسار الموافقة: كاتب ← محرّر ← رئيس تحرير
export const STATUS = {
  incoming: 'incoming',
  draft: 'draft',
  submitted: 'submitted',
  returned: 'returned',
  edited: 'edited',
  published: 'published',
};

export const STATUS_LIST = [
  { title: 'واردة من المصادر', value: 'incoming' },
  { title: 'مسوّدة الكاتب', value: 'draft' },
  { title: 'بانتظار المحرّر', value: 'submitted' },
  { title: 'أُعيدت إلى الكاتب', value: 'returned' },
  { title: 'بانتظار رئيس التحرير', value: 'edited' },
  { title: 'منشورة', value: 'published' },
];

export const ROLES = [
  { title: 'كاتب', value: 'writer' },
  { title: 'محرّر', value: 'editor' },
  { title: 'رئيس تحرير', value: 'editorInChief' },
];
