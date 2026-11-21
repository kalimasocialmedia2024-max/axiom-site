// ينظّف طابور "أخبار واردة من المصادر": يحذف كلّ خبر وارد لم يُلمس منذ 3 أيام ولم يُنشر.
// لا يمسّ المنشور، ولا ما نقله المحرّر إلى مرحلة أخرى (بانتظار رئيس التحرير وغيرها).
import { query, mutate } from './lib.mjs';

const DAYS = 3;
const cutoff = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();

const ids = await query(
  `*[_type == "article" && workflow == "incoming" && _id in path("drafts.**") && _updatedAt < $cutoff
     && !(string::split(_id, "drafts.")[1] in *[_type == "article" && !(_id in path("drafts.**"))]._id)][0...500]._id`,
  { cutoff }
);

for (let i = 0; i < ids.length; i += 100) {
  await mutate(ids.slice(i, i + 100).map((id) => ({ delete: { id } })));
}
console.log(`حُذف ${ids.length} خبراً وارداً أقدم من ${DAYS} أيام.`);

// ضمانة الصورة: كلّ مادّة منشورة بلا صورة تأخذ صورة توضيحية عامّة بحسب قسمها،
// إلى أن يضع المحرّر صورة خاصّة بها.
const FALLBACK = {
  local: 'image-2c702349da69b01b111a61dedf977fdd900e5666-768x1024-jpg',
  regional: 'image-c2ad0a5eeedaf8c8776a551f44fe9cef2640b120-13622x6663-jpg',
  economy: 'image-e33b119ecf12cead3378cd2a231557177b98b82d-5187x3444-jpg',
  health: 'image-d9465569b1872643a0c941850ce3f127a08c2af9-600x519-png',
  sports: 'image-897911309bb64814dad1bf5246ae8be7bfb8928a-3656x2039-jpg',
  variety: 'image-30dcf91029d8c25f9b4bc0635decf3dc541fa2bc-2116x2580-jpg',
  'world-press': 'image-4e7817f35d8987346d9fa17ff0047b0881c16b84-3000x3806-jpg',
};
const bare = await query(`*[_type == "article" && !(_id in path("drafts.**")) && !defined(mainImage.asset) && !defined(feedImage)]{_id, section}`);
const fix = bare.map((a) => ({
  patch: {
    id: a._id,
    set: { mainImage: { _type: 'image', asset: { _type: 'reference', _ref: FALLBACK[a.section] || FALLBACK.regional }, caption: 'صورة توضيحية', credit: 'Wikimedia Commons' } },
  },
}));
await mutate(fix);
console.log(`أُضيفت صورة توضيحية إلى ${fix.length} مادّة منشورة.`);
