import { Booking } from '../models/index.js';
import { todayStr } from '@gozal/shared/utils/time';
import { BOOKING_STATUS } from '../config/constants.js';

/**
 * O'tgan kunlardagi yozuvlarni yopadi.
 *
 * Nima uchun kerak: yopilmagan yozuv slotni band qilib turmaydi (sana o'tgan),
 * lekin mijozning "faol yozuvlar" chegarasini (5 ta) to'ldirib qo'yadi va
 * kabinetda cheksiz o'sib boradi.
 *
 * ⚠️ FAQAT o'tgan kunlar: bugungi yozuv hali bo'lmagan bo'lishi mumkin.
 */
export async function autoComplete() {
  const today = todayStr();

  const [completed, cancelled] = await Promise.all([
    // Tasdiqlangan va vaqti o'tgan → yakunlangan
    Booking.updateMany(
      { status: BOOKING_STATUS.CONFIRMED, date: { $lt: today } },
      { $set: { status: BOOKING_STATUS.COMPLETED } },
    ),

    // Egasi tasdiqlamagan va vaqti o'tgan → bekor
    Booking.updateMany(
      { status: BOOKING_STATUS.PENDING, date: { $lt: today } },
      {
        $set: {
          status: BOOKING_STATUS.CANCELLED,
          cancelledBy: 'admin',
          cancelReason: 'Salon tasdiqlamadi',
        },
      },
    ),
  ]);

  return { completed: completed.modifiedCount, cancelled: cancelled.modifiedCount };
}

export default autoComplete;
