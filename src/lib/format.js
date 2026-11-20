// تنسيق التواريخ والأوقات ومدّة القراءة بالعربية.

const dateFmt = new Intl.DateTimeFormat('ar-LB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Beirut' });
const timeFmt = new Intl.DateTimeFormat('ar-LB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Beirut' });

export const fmtDate = (d) => (d ? dateFmt.format(new Date(d)) : '');
export const fmtTime = (d) => (d ? timeFmt.format(new Date(d)) : '');
export const fmtDateTime = (d) => (d ? `${fmtDate(d)}، ${fmtTime(d)}` : '');

export function plainText(blocks = []) {
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => (b.children || []).map((c) => c.text || '').join(''))
    .join('\n');
}

export function readingTime(article) {
  if (article.readingMinutes) return `${article.readingMinutes} د قراءة`;
  const words = plainText(article.body).split(/\s+/).filter(Boolean).length;
  if (!words) return '';
  return `${Math.max(1, Math.round(words / 200))} د قراءة`;
}

export const authorNames = (a) => (a.authors || []).map((w) => w.name).join('، ');
