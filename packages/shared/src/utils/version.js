/**
 * Semantik versiyalarni solishtirish.
 *
 * ⚠️ String solishtirish XATO beradi: '1.2.10' < '1.2.9' chiqadi, chunki
 * leksikografik tartibda '1' < '9'. Majburiy yangilanish tekshiruvida bu
 * 10-versiyadagi foydalanuvchini "eski" deb hisoblab, uni ilovadan
 * butunlay to'sib qo'yadi.
 */
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = Number.isFinite(pa[i]) ? pa[i] : 0;
    const y = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (x !== y) return x > y ? 1 : -1;
  }

  return 0;
}

/** Qurilmadagi versiya minimal talabdan pastmi? */
export function isUpdateRequired(current, minVersion) {
  if (!minVersion) return false;
  return compareVersions(current, minVersion) < 0;
}

export default { compareVersions, isUpdateRequired };
