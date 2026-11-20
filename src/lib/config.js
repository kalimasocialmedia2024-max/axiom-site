// إعدادات الموقع الثابتة: الأقسام وأنواع المواد والروابط.
// أيّ تعديل هنا ينعكس على القوائم والصفحات معاً.

export const SITE = {
  name: 'AXIOM+',
  slogan: 'إعلام بمستوى الحقيقة',
  url: 'https://axiomplusmedia.com',
  description: 'أكسيوم بلس: مؤسّسة إعلامية رقمية للأخبار والتحليل والرأي. إعلام بمستوى الحقيقة.',
  // مساحات الإعلانات تبقى مخفيّة حتى يُتّفق مع معلنين.
  showAdSlots: false,
};

// الأقسام الإخبارية (تظهر في القائمة الأولى وفي صفحات /section/...)
export const SECTIONS = [
  { slug: 'local', title: 'محلي', description: 'الشأن اللبنانيّ: السياسة والمجتمع والمؤسّسات' },
  { slug: 'regional', title: 'إقليمي ودولي', description: 'المنطقة والعالم، وسوريا ساحةً أساسية' },
  { slug: 'economy', title: 'اقتصاد', description: 'الأسواق والمال والطاقة والاقتصاد السياسيّ' },
  { slug: 'health', title: 'صحة', description: 'الصحّة العامّة والطبّ والعلوم' },
  { slug: 'sports', title: 'رياضة', description: 'الرياضة المحلية والعربية والعالمية' },
  { slug: 'variety', title: 'منوعات', description: 'الثقافة والفنّ والمجتمع' },
];

// أنواع المواد: لكلّ نوع قالبه ورابطه.
export const KINDS = {
  news: { label: 'أخبار', badge: 'خبر', path: 'news', description: 'آخر الأخبار من لبنان والمنطقة والعالم' },
  analysis: { label: 'الوحدة التحليلية', badge: 'الوحدة التحليلية', path: 'analysis', description: 'تحليلات معمّقة لما وراء الحدث' },
  opinion: { label: 'رأي', badge: 'رأي', path: 'opinion', description: 'مقالات الرأي لكتّاب AXIOM+' },
  investigation: { label: 'تحقيقات', badge: 'تحقيق', path: 'investigations', description: 'تحقيقات استقصائية موثّقة' },
  special: { label: 'خاصّ', badge: 'خاصّ', path: 'special', description: 'موادّ خاصّة بـAXIOM+' },
  study: { label: 'الدراسات', badge: 'دراسة', path: 'studies', description: 'إصدارات مركز كلمة للدراسات والبحوث الجيوسياسية' },
};

export const kindByPath = (p) => Object.entries(KINDS).find(([, v]) => v.path === p)?.[0];
export const articleUrl = (a) => `/${KINDS[a.kind]?.path || 'news'}/${a.slug}/`;
export const sectionUrl = (slug) => `/section/${slug}/`;
export const sectionTitle = (slug) => SECTIONS.find((s) => s.slug === slug)?.title || '';

export const MEDIA_TYPES = {
  podcast: 'بودكاست',
  video: 'فيديو',
  audio: 'النشرة الصوتية',
};

export const MAIN_NAV = [
  { label: 'أخبار', href: '/news/' },
  { label: 'محلي', href: '/section/local/' },
  { label: 'إقليمي ودولي', href: '/section/regional/' },
  { label: 'اقتصاد', href: '/section/economy/' },
  { label: 'صحة', href: '/section/health/' },
  { label: 'رياضة', href: '/section/sports/' },
  { label: 'بودكاست', href: '/media/?type=podcast' },
  { label: 'فيديو', href: '/media/?type=video' },
  { label: 'النشرة الصوتية', href: '/media/?type=audio' },
  { label: 'منوعات', href: '/section/variety/' },
];

export const SUB_NAV = [
  { label: 'الوحدة التحليلية', href: '/analysis/' },
  { label: 'الدراسات', href: '/studies/' },
  { label: 'الكتّاب', href: '/writers/' },
  { label: 'رأي', href: '/opinion/' },
  { label: 'تحقيقات', href: '/investigations/' },
  { label: 'خاصّ', href: '/special/' },
];

// روابط الحسابات: تُستبدل بالروابط الفعلية عند فتح الحسابات.
export const SOCIAL = [
  { label: 'X', aria: 'AXIOM+ على X', href: '#' },
  { label: 'يوتيوب', href: '#' },
  { label: 'فيسبوك', href: '#' },
  { label: 'إنستغرام', href: '#' },
  { label: 'تيك توك', href: '#' },
  { label: 'لينكدإن', href: '#' },
];

export const FOOTER_LINKS = [
  { label: 'من نحن', href: '/page/about/' },
  { label: 'الميثاق التحريري', href: '/page/charter/' },
  { label: 'سياسة التصحيح', href: '/page/corrections/' },
  { label: 'أعلن معنا', href: '/page/advertise/' },
  { label: 'انضمّ إلينا', href: '/page/join/' },
  { label: 'اتصل بنا', href: '/page/contact/' },
];
