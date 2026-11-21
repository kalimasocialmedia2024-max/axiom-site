// آخر خبر أُرسل إشعاره: يقرؤه عامل الخدمة ليعرض عنوانه.
import { json } from '../../lib/webpush.js';
export async function GET({ locals }) {
  const kv = locals?.runtime?.env?.SUBSCRIBERS;
  const d = kv ? await kv.get('push:latest', 'json') : null;
  return json(d || { id: 'axiom', title: 'جديد على AXIOM+', url: '/' });
}
