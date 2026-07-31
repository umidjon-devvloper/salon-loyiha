import { Booking } from '../models/index.js';
import { BOOKING_STATUS } from '../config/constants.js';

/**
 * To'lanmagan yozuvlarni bekor qiladi va slotni bo'shatadi.
 *
 * ⚠️ Har 2 daqiqada ishlaydi. Bu boshqa cronlardan tez-tez chaqiriladi,
 * chunki ushlab turilgan slot REAL mijozni yo'qotadi: u bo'sh vaqtni
 * ko'rmaydi va boshqa salonga ketadi.
 */
export async function expireHolds() {
  const result = await Booking.updateMany(
    { status: BOOKING_STATUS.AWAITING_PAYMENT, holdUntil: { $lt: new Date() } },
    {
      $set: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledBy: 'admin',
        cancelReason: "To'lov qilinmadi",
        holdUntil: null,
      },
    },
  );

  return { cancelled: result.modifiedCount };
}

export default expireHolds;
