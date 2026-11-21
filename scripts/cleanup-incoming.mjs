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
