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

// الأخبار الواردة مقسومة على مكاتب غرفة التحرير (الحقل desk يملؤه الجلب الآلي)، ليدخل كلّ محرّر إلى اختصاصه.
export const DESKS = [
  ['lebanon', 'محلي (لبنان)'],
  ['syria', 'سوريا'],
  ['palestine', 'فلسطين'],
  ['arab', 'عربي'],
  ['regional', 'إقليمي (إيران، تركيا، إسرائيل)'],
  ['usa', 'أمريكا'],
  ['china', 'الصين'],
  ['russia', 'روسيا وأوكرانيا'],
  ['europe', 'أوروبا'],
  ['international', 'دولي'],
  ['economy', 'اقتصاد'],
  ['health', 'صحة وعلوم'],
  ['sports', 'رياضة'],
  ['variety', 'منوعات'],
  ['world-press', 'الصحافة العالمية'],
];

const incomingList = (S, id, title, filter, params = {}) =>
  S.listItem()
    .id(id)
    .title(title)
    .child(
      S.documentList()
        .id(`${id}-list`)
        .title(title)
        .schemaType('article')
        .filter(`_type == "article" && workflow == "incoming" && ${filter}`)
        .params(params)
        .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
    );

const incoming = (S) =>
  S.listItem()
    .id('q-incoming')
    .title('الأخبار من المصادر')
    .child(
      S.list()
        .id('q-incoming-desks')
        .title('الأخبار من المصادر')
        .items([
          incomingList(S, 'in-urgent', 'عاجل وأحدث ساعتين', '(title match "عاجل" || title match "Breaking" || dateTime(_createdAt) > dateTime(now()) - 60*60*2)'),
          S.divider(),
          ...DESKS.map(([k, t]) => incomingList(S, `in-${k}`, t, 'desk == $k', { k })),
          incomingList(S, 'in-none', 'بلا تصنيف', '!defined(desk)'),
          S.divider(),
          incomingList(S, 'in-all', 'كلّ الوارد', 'true'),
        ])
    );

export const structure = (S) =>
  S.list()
    .title('غرفة التحرير')
    .items([
      incoming(S),
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
