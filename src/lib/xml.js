// أدوات صغيرة لملفّات XML (خريطة الموقع وRSS).
export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
export const xml = (body) => new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
