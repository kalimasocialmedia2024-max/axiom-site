// المفتاح العامّ الذي يحتاجه المتصفّح للاشتراك في الإشعارات.
import { getVapid, json } from '../../lib/webpush.js';
export async function GET({ locals }) {
  const kv = locals?.runtime?.env?.SUBSCRIBERS;
  if (!kv) return json({ error: 'unavailable' }, 503);
  const v = await getVapid(kv, true);
  return json({ key: v.pub });
}
