import * as bookingService from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

/** Controller faqat so'rov/javob bilan ishlaydi */

const q = (req) => req.validated?.query ?? req.query;

// ── Bo'sh vaqtlar (ochiq) ───────────────────────────────────────

export const availability = asyncHandler(async (req, res) => {
  const { masterId, date, serviceIds } = q(req);
  ok(res, await bookingService.getAvailableSlots({ masterId, dateStr: date, serviceIds }));
});

export const availabilityDays = asyncHandler(async (req, res) => {
  const { masterId, month, serviceIds } = q(req);
  ok(res, await bookingService.getMonthAvailability({ masterId, month, serviceIds }));
});

// ── Mijoz yozuvlari ─────────────────────────────────────────────

export const create = asyncHandler(async (req, res) => {
  created(res, await bookingService.createBooking({ userId: req.user.id, ...req.body }));
});

export const listMine = asyncHandler(async (req, res) => {
  const { upcoming, status } = q(req);
  ok(res, await bookingService.listMyBookings({ userId: req.user.id, upcoming, status }));
});

export const getMine = asyncHandler(async (req, res) => {
  ok(res, await bookingService.getMyBooking({ userId: req.user.id, id: req.params.id }));
});

export const cancelMine = asyncHandler(async (req, res) => {
  ok(
    res,
    await bookingService.cancelByClient({
      userId: req.user.id,
      id: req.params.id,
      reason: req.body.reason,
    }),
  );
});
