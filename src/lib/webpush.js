// إشعارات المتصفّح (Web Push) دون مكتبات: مفاتيح VAPID تُولَّد مرّة واحدة وتُحفظ في مخزن KV،
// والإشعار يُرسل فارغاً، ثمّ يجلب عامل الخدمة عنوان الخبر من /api/push-latest.
const enc = new TextEncoder();
export const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const ALG = { name: 'ECDSA', namedCurve: 'P-256' };

export async function getVapid(kv, create = false) {
  let v = await kv.get('vapid:keys', 'json');
  if (!v && create) {
    const kp = await crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
    v = { pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), jwk: await crypto.subtle.exportKey('jwk', kp.privateKey) };
    const again = await kv.get('vapid:keys', 'json');
    if (again) return again;
    await kv.put('vapid:keys', JSON.stringify(v));
  }
  return v;
}

// خدمات الإشعار المعتمدة فقط (Google وApple وMozilla وMicrosoft).
const HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/;
export function validEndpoint(ep) {
  if (typeof ep !== 'string' || ep.length > 900) return false;
  try {
    const u = new URL(ep);
    return u.protocol === 'https:' && HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

export async function subKey(ep) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(ep));
  return 'sub:' + [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

async function authHeader(v, endpoint, cache) {
  const aud = new URL(endpoint).origin;
  if (cache[aud]) return cache[aud];
  cache._key ||= await crypto.subtle.importKey('jwk', v.jwk, ALG, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://axiomplusmedia.com/' })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cache._key, enc.encode(head + '.' + body));
  return (cache[aud] = `vapid t=${head}.${body}.${b64u(sig)}, k=${v.pub}`);
}

export async function sendPush(v, endpoint, cache) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: await authHeader(v, endpoint, cache), TTL: '21600', Urgency: 'high', 'Content-Length': '0' },
  });
  return res.status;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
