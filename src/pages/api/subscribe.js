// يحفظ البريد في مخزن KV باسم SUBSCRIBERS إن رُبط بالمشروع (انظر README).
export async function POST({ request, locals }) {
  const env = locals?.runtime?.env || {};
  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const back = new URL('/', request.url);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    back.searchParams.set('subscribe', 'invalid');
    return Response.redirect(back.toString(), 303);
  }
  if (env.SUBSCRIBERS) {
    await env.SUBSCRIBERS.put(email, JSON.stringify({ at: new Date().toISOString() }));
    back.searchParams.set('subscribe', 'ok');
  } else {
    back.searchParams.set('subscribe', 'pending');
  }
  return Response.redirect(back.toString(), 303);
}
