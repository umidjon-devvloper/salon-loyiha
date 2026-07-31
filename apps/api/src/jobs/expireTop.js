import { Salon } from '../models/index.js';

/**
 * Muddati tugagan TOP e'lonlarni o'chiradi.
 *
 * Serializer ham `topUntil` ni tekshiradi (belgi ko'rinmasligi uchun),
 * lekin SARALASH `isTop` maydoniga tayanadi — shuning uchun bu cron kerak:
 * busiz muddati tugagan salon katalog boshida turaverardi.
 */
export async function expireTop() {
  const result = await Salon.updateMany(
    { isTop: true, topUntil: { $lt: new Date() } },
    { $set: { isTop: false } },
  );

  return { updated: result.modifiedCount };
}

export default expireTop;
