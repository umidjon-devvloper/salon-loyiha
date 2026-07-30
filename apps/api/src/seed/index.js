/**
 * Seed skript.
 *
 *   pnpm seed                 admin + 12 kategoriya + settings
 *   pnpm seed -- --demo       yuqoridagilar + demo salonlar/ustalar/xizmatlar/yozuvlar
 *   pnpm seed -- --reset      avval demo ma'lumotni tozalaydi (production'da ishlamaydi)
 *
 * IDEMPOTENT: bir necha marta ishga tushirilsa ham nusxa yaratmaydi.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ROLES, SALON_STATUS, DEFAULT_CITY } from '../config/constants.js';
import {
  User,
  Category,
  Salon,
  Master,
  Service,
  Booking,
  Settings,
  defaultWeek,
} from '../models/index.js';
import { todayStr } from '@gozal/shared/utils/time';
import { normalizePhone } from '@gozal/shared/utils/format';
import { generateBookingCode } from '../utils/bookingCode.js';

import { CATEGORIES } from './categories.js';
import { DEMO_SALONS, buildDemoBookings, uniqueSlug } from './demo.data.js';

const args = process.argv.slice(2);
const WITH_DEMO = args.includes('--demo');
const RESET = args.includes('--reset');

const log = (...a) => console.log('  ', ...a);

// ── 1. Admin ────────────────────────────────────────────────────

async function seedAdmin() {
  if (!env.ADMIN_PHONE || !env.ADMIN_PASSWORD) {
    log('⚠️  ADMIN_PHONE / ADMIN_PASSWORD .env da yo\'q — admin yaratilmadi');
    return null;
  }

  const phone = normalizePhone(env.ADMIN_PHONE);
  if (!phone) {
    log('⚠️  ADMIN_PHONE noto\'g\'ri formatda — admin yaratilmadi');
    return null;
  }

  const existing = await User.findOne({ phone });
  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      await existing.save();
      log(`admin roli berildi: ${phone}`);
    } else {
      log(`admin allaqachon bor: ${phone}`);
    }
    return existing;
  }

  const admin = await User.create({
    phone,
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 10),
    fullName: env.ADMIN_NAME,
    role: ROLES.ADMIN,
  });
  log(`✅ admin yaratildi: ${phone}`);
  return admin;
}

// ── 2. Kategoriyalar ────────────────────────────────────────────

async function seedCategories() {
  let created = 0;
  for (const [i, c] of CATEGORIES.entries()) {
    const res = await Category.updateOne(
      { slug: c.slug },
      {
        $set: { 'name.uz': c.uz, 'name.ru': c.ru, icon: c.icon, order: i },
        $setOnInsert: { slug: c.slug, isActive: true },
      },
      { upsert: true },
    );
    if (res.upsertedCount) created++;
  }
  log(`kategoriyalar: ${CATEGORIES.length} ta (yangi: ${created})`);
  return Category.find().lean();
}

// ── 3. Sozlamalar ───────────────────────────────────────────────

async function seedSettings() {
  const settings = await Settings.getGlobal();
  log(`sozlamalar: booking fee ${settings.bookingFee.fixedAmount} so'm, hold ${settings.holdMinutes} daq`);
}

// ── 4. Demo ma'lumot (faqat dev) ────────────────────────────────

async function resetDemo() {
  const owners = await User.find({ phone: { $regex: '^\\+99890111000' } }).select('_id').lean();
  const ownerIds = owners.map((o) => o._id);
  const salons = await Salon.find({ owner: { $in: ownerIds } }).select('_id').lean();
  const salonIds = salons.map((s) => s._id);

  await Promise.all([
    Booking.deleteMany({ salon: { $in: salonIds } }),
    Service.deleteMany({ salon: { $in: salonIds } }),
    Master.deleteMany({ salon: { $in: salonIds } }),
    Salon.deleteMany({ _id: { $in: salonIds } }),
    User.deleteMany({ _id: { $in: ownerIds } }),
  ]);
  log(`🗑  demo tozalandi: ${salonIds.length} salon`);
}

async function seedDemo(categories) {
  const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));
  const slugs = new Set((await Salon.find().select('slug').lean()).map((s) => s.slug));

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const masters = [];
  const servicesBySalon = new Map();

  for (const data of DEMO_SALONS) {
    if (await Salon.exists({ name: data.name })) {
      log(`salon allaqachon bor, o'tkazib yuborildi: ${data.name}`);
      continue;
    }

    const owner = await User.findOneAndUpdate(
      { phone: data.phone },
      {
        $setOnInsert: {
          phone: data.phone,
          passwordHash,
          fullName: `${data.name} egasi`,
          role: ROLES.OWNER,
          city: DEFAULT_CITY,
        },
      },
      { upsert: true, new: true },
    );

    const salon = await Salon.create({
      owner: owner._id,
      name: data.name,
      slug: uniqueSlug(data.name, slugs),
      description: data.description,
      categories: data.categorySlugs.map((s) => catBySlug.get(s)).filter(Boolean),
      city: DEFAULT_CITY,
      district: data.district,
      address: `${data.district} tumani, demo manzil`,
      phone: data.phone,
      workingHours: defaultWeek(),
      rating: data.rating,
      reviewCount: data.reviewCount,
      isTop: data.isTop,
      topUntil: data.isTop ? new Date(Date.now() + 30 * 86_400_000) : null,
      isVerified: true,
      status: SALON_STATUS.ACTIVE,
    });

    // Ustalar. Birinchisi — "asosiy usta"
    const created = await Master.insertMany(
      data.masters.map((m, idx) => ({
        salon: salon._id,
        fullName: m.fullName,
        experienceYears: m.experienceYears,
        isPrimary: idx === 0,
        order: idx,
        rating: data.rating,
      })),
    );

    // Xizmatlar
    const services = await Service.insertMany(
      data.services.map((s, idx) => ({
        salon: salon._id,
        category: catBySlug.get(s.category) || catBySlug.get('boshqalar'),
        name: s.name,
        price: s.price,
        priceTo: s.priceTo ?? null,
        isPriceFrom: s.isPriceFrom ?? false,
        durationMin: s.durationMin,
        bufferMin: s.bufferMin ?? 0,
        order: idx,
      })),
    );

    // Narx filtri uchun kesh
    const prices = services.map((s) => s.price);
    salon.minPrice = Math.min(...prices);
    salon.maxPrice = Math.max(...services.map((s) => s.priceTo || s.price));
    await salon.save();

    for (const m of created) {
      masters.push({ id: m._id, salonId: salon._id, workingHours: salon.workingHours });
    }
    servicesBySalon.set(String(salon._id), services);

    log(`✅ ${data.name}: ${created.length} usta, ${services.length} xizmat`);
  }

  if (!masters.length) return;

  // Yozuvlar
  const drafts = buildDemoBookings({
    today: todayStr(),
    masters,
    servicesBySalon,
    count: 20,
  });

  let ok = 0;
  for (const d of drafts) {
    try {
      await Booking.create({
        code: generateBookingCode(),
        client: null,
        source: d.source,
        salon: d.salonId,
        master: d.masterId,
        items: d.items,
        date: d.date,
        startMin: d.startMin,
        endMin: d.endMin,
        totalPrice: d.totalPrice,
        totalDuration: d.totalDuration,
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        note: d.note,
        status: d.status,
        confirmedAt: d.status === 'confirmed' ? new Date() : null,
      });
      ok++;
    } catch (err) {
      if (err.code !== 11000) throw err; // kod to'qnashuvi — e'tiborsiz
    }
  }
  log(`✅ ${ok} ta demo yozuv`);
}

// ── Ishga tushirish ─────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seed boshlandi (${env.NODE_ENV})\n`);
  await connectDB();

  if (RESET) {
    if (env.isProd) {
      console.error('❌ --reset production\'da ishlatilmaydi');
      process.exit(1);
    }
    await resetDemo();
  }

  await seedAdmin();
  const categories = await seedCategories();
  await seedSettings();

  if (WITH_DEMO) {
    if (env.isProd) {
      console.error('❌ --demo production\'da ishlatilmaydi');
      process.exit(1);
    }
    console.log('\n  — demo ma\'lumot —');
    await seedDemo(categories);
    log('demo salon egasi paroli: demo1234');
  }

  // Indekslar bazada haqiqatan yaratilganini kafolatlaymiz
  await Promise.all(
    [User, Category, Salon, Master, Service, Booking, Settings].map((m) => m.syncIndexes()),
  );
  log('indekslar sinxronlandi');

  console.log('\n✅ Seed tugadi\n');
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Seed xatosi:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
