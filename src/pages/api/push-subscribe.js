// تسجيل اشتراك القارئ في الإشعارات أو إلغاؤه. لا يُحفظ إلا عنوان خدمة الإشعار، بلا أيّ بيانات شخصية.
import { validEndpoint, subKey, json } from '../../lib/webpush.js';
async function handle(request, locals, remove) {
  const kv = locals?.runtime?.env?.SUBSCRIBERS;
  if (!kv) return json({ error: 'unavailable' }, 503);
  const b = await request.json().catch(() => null);
  const ep = b?.endpoint;
  if (!validEndpoint(ep)) return json({ error: 'invalid' }, 400);
  const k = await subKey(ep);
  if (remove) await kv.delete(k);
  else await kv.put(k, '', { metadata: { e: ep, t: Date.now() } });
  return json({ ok: true });
}
export const POST = ({ request, locals }) => handle(request, locals, false);
export const DELETE = ({ request, locals }) => handle(request, locals, true);
