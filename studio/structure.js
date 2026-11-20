// تنظيم غرفة التحرير: المراحل أوّلاً، ثمّ الموادّ بحسب النوع، ثمّ الباقي.

const KINDS = [
  ['news', 'الأخبار'],
  ['analysis', 'التحليلات'],
  ['opinion', 'الرأي'],
  ['investigation', 'التحقيقات'],
  ['special', 'خاصّ'],
  ['study', 'الدراسات'],
];

const byStatus = (S, title, status, id) =>
  S.listItem()
    .id(id)
    .title(title)
    .child(S.documentList().id(`${id}-list`).title(title).schemaType('article').filter('_type == "article" && workflow == $s').params({ s: status }).defaultOrdering([{ field: '_updatedAt', direction: 'desc' }]));

export const structure = (S) =>
  S.list()
    .title('غرفة التحرير')
    .items([
      byStatus(S, 'أخبار واردة من المصادر', 'incoming', 'q-incoming'),
      byStatus(S, 'بانتظار المحرّر', 'submitted', 'q-submitted'),
      byStatus(S, 'بانتظار رئيس التحرير', 'edited', 'q-edited'),
      byStatus(S, 'أُعيدت إلى الكتّاب', 'returned', 'q-returned'),
      S.listItem()
        .id('q-drafts')
        .title('مسوّدات الكتّاب')
        .child(S.documentList().id('q-drafts-list').title('مسوّدات الكتّاب').schemaType('article').filter('_type == "article" && (!defined(workflow) || workflow == "draft")')),
      S.divider(),
      ...KINDS.map(([k, t]) =>
        S.listItem()
          .id(`kind-${k}`)
          .title(t)
          .child(
            S.documentList()
              .id(`kind-${k}-list`)
              .title(t)
              .schemaType('article')
              .filter('_type == "article" && kind == $k')
              .params({ k })
              .initialValueTemplates([S.initialValueTemplateItem('article-kind', { kind: k })])
              .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
          )
      ),
      S.listItem().id('all-articles').title('كلّ الموادّ').child(S.documentTypeList('article').title('كلّ الموادّ')),
      S.divider(),
      S.documentTypeListItem('episode').title('البودكاست والفيديو والنشرة الصوتية'),
      S.documentTypeListItem('program').title('البرامج'),
      S.documentTypeListItem('writer').title('الكتّاب وفريق التحرير'),
      S.documentTypeListItem('page').title('الصفحات الثابتة'),
      S.documentTypeListItem('feedSource').title('مصادر الأخبار الآلية'),
      S.divider(),
      S.listItem().id('settings').title('إعدادات الموقع').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
