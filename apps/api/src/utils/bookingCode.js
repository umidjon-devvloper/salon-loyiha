/**
 * Mijoz telefonda aytadigan qisqa kod: 'GA-4821'.
 *
 * Chalkashadigan belgilar (0/O, 1/I) ishlatilmaydi — kod og'zaki aytiladi.
 * 32^4 ≈ 1 mln variant. Takrorlanmasligini `Booking.code` ustidagi unique
 * index kafolatlaydi; chaqiruvchi `11000` xatosida qayta urinadi
 * (`booking.service.js`, createBooking).
 */
// 0/O va 1/I chalkashmasligi uchun ular olib tashlangan: 32 belgi
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'GA';

export function generateBookingCode(length = 4) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${PREFIX}-${out}`;
}

export default generateBookingCode;
