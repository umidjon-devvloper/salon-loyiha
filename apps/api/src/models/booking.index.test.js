/**
 * Integratsiya testi — HAQIQIY MongoDB kerak.
 *
 * Ishga tushirish:
 *   MONGO_URI=mongodb://127.0.0.1:27017/gozal_ayol_test node --test src/models
 *
 * MONGO_TEST_URI berilmasa test SKIP bo'ladi (CI ni sindirmasligi uchun).
 *
 * Tekshiriladi: 04-booking-algoritmi.md dagi 9-holat —
 * "Bir slotga 2 parallel so'rov → biri 201, ikkinchisi 409 SLOT_TAKEN"
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const URI = process.env.MONGO_TEST_URI || process.env.MONGO_URI;
const skip = URI ? false : 'MONGO_TEST_URI berilmagan';

let Booking;
let masterId;
let salonId;

const baseDoc = () => ({
  salon: salonId,
  master: masterId,
  items: [
    { service: new mongoose.Types.ObjectId(), name: 'Manikyur', price: 100000, durationMin: 60 },
  ],
  date: '2026-08-05',
  startMin: 840, // 14:00
  endMin: 900,
  totalPrice: 100000,
  totalDuration: 60,
  clientName: 'Dildora',
  clientPhone: '+998901234567',
});

describe('Booking unique partial index', { skip }, () => {
  before(async () => {
    await mongoose.connect(URI);
    ({ Booking } = await import('./Booking.js'));
    await Booking.collection.drop().catch(() => {});
    await Booking.syncIndexes();
    masterId = new mongoose.Types.ObjectId();
    salonId = new mongoose.Types.ObjectId();
  });

  after(async () => {
    await Booking.collection.drop().catch(() => {});
    await mongoose.disconnect();
  });

  test('bir xil slotga ikkinchi yozuv 11000 bilan rad etiladi', async () => {
    await Booking.create({ ...baseDoc(), code: 'GA-2345' });

    await assert.rejects(
      () => Booking.create({ ...baseDoc(), code: 'GA-2346' }),
      (err) => err.code === 11000,
    );
  });

  test("parallel ikki so'rovdan aynan bittasi o'tadi", async () => {
    await Booking.deleteMany({});
    const results = await Promise.allSettled([
      Booking.create({ ...baseDoc(), code: 'GA-3456' }),
      Booking.create({ ...baseDoc(), code: 'GA-3457' }),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    assert.equal(ok.length, 1, 'aynan bitta yozuv yaratilishi kerak');
    assert.equal(failed.length, 1);
    assert.equal(failed[0].reason.code, 11000);
  });

  test("bekor qilingan yozuv slotni bo'shatadi", async () => {
    await Booking.deleteMany({});
    const first = await Booking.create({ ...baseDoc(), code: 'GA-4567' });

    first.status = 'cancelled';
    first.cancelledBy = 'client';
    await first.save();

    // Endi o'sha slotga yozish mumkin bo'lishi kerak
    const second = await Booking.create({ ...baseDoc(), code: 'GA-4568' });
    assert.ok(second._id);
  });

  test('boshqa usta — bir xil vaqt muammosiz', async () => {
    await Booking.deleteMany({});
    await Booking.create({ ...baseDoc(), code: 'GA-5678' });

    const other = await Booking.create({
      ...baseDoc(),
      master: new mongoose.Types.ObjectId(),
      code: 'GA-5679',
    });
    assert.ok(other._id);
  });

  test('completed yozuv slotni band qilmaydi', async () => {
    await Booking.deleteMany({});
    await Booking.create({ ...baseDoc(), code: 'GA-6789', status: 'completed' });

    const next = await Booking.create({ ...baseDoc(), code: 'GA-6780' });
    assert.ok(next._id);
  });
});
