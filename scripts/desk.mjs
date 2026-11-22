// تصنيف الأخبار الواردة على مكاتب غرفة التحرير، ليدخل كلّ محرّر إلى اختصاصه.
// التصنيف للتنظيم الداخلي فقط، ولا يغيّر قسم الخبر على الموقع.
// الترتيب مهمّ: يُختار أوّل مكتب ينطبق.

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

const R = (words) => new RegExp(words.join('|'), 'i');

const RULES = [
  ['syria', R(['سوري', 'دمشق', 'حلب', 'حمص', 'حماة', 'إدلب', 'ادلب', 'اللاذقية', 'طرطوس', 'درعا', 'السويداء', 'دير الزور', 'الرقة', 'الحسكة', 'القامشلي', 'الشرع', 'قسد', 'Syria', 'Damascus', 'Aleppo', 'Syrie'])],
  ['lebanon', R(['لبنان', 'لبناني', 'بيروت', 'صيدا', 'بعلبك', 'البقاع', 'عكار', 'جبيل', 'زحلة', 'النبطية', 'الضاحية', 'حزب الله', 'نواف سلام', 'جوزاف عون', 'نبيه بري', 'Lebanon', 'Leban', 'Beirut', 'Liban', 'Hezbollah'])],
  ['palestine', R(['فلسطين', 'غزة', 'غزّة', 'الضفة', 'القدس', 'رام الله', 'جنين', 'نابلس', 'الخليل', 'حماس', 'الأونروا', 'Gaza', 'Palestin', 'West Bank', 'Hamas'])],
  ['arab', R(['السعودي', 'الرياض', 'الإمارات', 'أبوظبي', 'دبي', 'قطر', 'الدوحة', 'الكويت', 'البحرين', 'عُمان', 'سلطنة عمان', 'مسقط', 'اليمن', 'الحوثي', 'صنعاء', 'العراق', 'بغداد', 'الأردن', 'عمّان', 'مصر', 'القاهرة', 'السودان', 'ليبيا', 'الليبي', 'تونس', 'الجزائر', 'المغرب', 'موريتانيا', 'الجامعة العربية', 'الخليج', 'Saudi', 'Emirat', 'Qatar', 'Egypt', 'Iraq', 'Jordan', 'Yemen', 'Houthi', 'Sudan', 'Libya'])],
  ['regional', R(['إيران', 'ايران', 'طهران', 'الإيراني', 'تركيا', 'التركي', 'أنقرة', 'إسطنبول', 'أردوغان', 'إسرائيل', 'الإسرائيلي', 'تل أبيب', 'نتنياهو', 'الكنيست', 'Iran', 'Tehran', 'Turkey', 'Türkiye', 'Erdogan', 'Israel', 'Netanyahu'])],
  ['china', R(['الصين', 'صيني', 'الصيني', 'بكين', 'شي جين', 'تايوان', 'هونغ كونغ', 'شنغهاي', 'China', 'Chinese', 'Beijing', 'Xi Jinping', 'Taiwan'])],
  ['usa', R(['أمريك', 'أميرك', 'واشنطن', 'ترامب', 'البيت الأبيض', 'الكونغرس', 'البنتاغون', 'نيويورك', 'U\.S\.', 'United States', 'America', 'Washington', 'Trump', 'White House', 'Pentagon', 'Congress'])],
  ['russia', R(['روسيا', 'الروسي', 'موسكو', 'الكرملين', 'بوتين', 'أوكرانيا', 'الأوكراني', 'كييف', 'زيلينسكي', 'Russia', 'Moscow', 'Kremlin', 'Putin', 'Ukrain', 'Kyiv', 'Zelensky'])],
  ['europe', R(['أوروب', 'الاتحاد الأوروبي', 'بريطاني', 'لندن', 'فرنس', 'باريس', 'ماكرون', 'ألمان', 'برلين', 'إيطالي', 'إسباني', 'الناتو', 'Europe', 'Britain', 'British', 'London', 'France', 'French', 'Paris', 'Germany', 'German', 'NATO'])],
];

const SECTION_DESK = { economy: 'economy', health: 'health', sports: 'sports', variety: 'variety', 'world-press': 'world-press' };

export function deskFor({ title = '', feedSummary = '', section = '' }) {
  if (SECTION_DESK[section]) return SECTION_DESK[section];
  const t = `${title} ${feedSummary}`;
  for (const [desk, re] of RULES) if (re.test(t)) return desk;
  return section === 'local' ? 'lebanon' : 'international';
}
