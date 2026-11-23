// لوحة التحرير تعمل من الرابط الرسمي فقط: أيّ زيارة لرابط pages.dev تُحوَّل إلى admin.axiomplusmedia.com
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.endsWith('.pages.dev')) {
    return Response.redirect('https://admin.axiomplusmedia.com' + url.pathname + url.search, 301);
  }
  return next();
}
