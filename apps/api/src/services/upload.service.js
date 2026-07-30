import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

import env from '../config/env.js';
import { IMAGE_SIZES } from '../config/constants.js';

/**
 * Yuklangan rasm HAR DOIM qayta yoziladi (sharp orqali) —
 * shunda EXIF (jumladan GPS koordinatalari) tozalanadi va
 * "rasm" niqobidagi zararli fayl serverda saqlanmaydi.
 *
 * Har bir rasmdan ikkita fayl chiqadi:
 *   <folder>/<name>.webp        — to'liq (max eni 1600px)
 *   <folder>/thumb/<name>.webp  — kartochka uchun (400×300)
 *
 * Bazada faqat fayl nomi saqlanadi, to'liq URL javob yasashda qo'shiladi.
 */

/** Fayl nomi bashorat qilinmasin — aks holda begona rasmlar taxmin bilan topiladi */
export function buildFileName(prefix) {
  const safePrefix = String(prefix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const rand = crypto.randomBytes(6).toString('hex');
  return `${safePrefix || 'img'}-${Date.now()}-${rand}.webp`;
}

function dirOf(folder) {
  return path.resolve(env.UPLOAD_DIR, folder);
}

async function ensureDirs(folder) {
  await fs.mkdir(dirOf(folder), { recursive: true });
  await fs.mkdir(path.join(dirOf(folder), 'thumb'), { recursive: true });
}

/**
 * Bitta rasmni saqlaydi va fayl nomini qaytaradi.
 * @param {Buffer} buffer  multer memoryStorage dan
 */
export async function saveImage(buffer, { folder = 'salons', prefix = 'img' } = {}) {
  await ensureDirs(folder);

  const filename = buildFileName(prefix);
  const full = IMAGE_SIZES.full;
  const thumb = IMAGE_SIZES.thumb;

  await Promise.all([
    sharp(buffer)
      .rotate() // EXIF orientatsiyasini qo'llaydi, keyin metadata tashlanadi
      .resize({ width: full.width, withoutEnlargement: true })
      .webp({ quality: full.quality })
      .toFile(path.join(dirOf(folder), filename)),

    sharp(buffer)
      .rotate()
      .resize({ width: thumb.width, height: thumb.height, fit: 'cover' })
      .webp({ quality: thumb.quality })
      .toFile(path.join(dirOf(folder), 'thumb', filename)),
  ]);

  return filename;
}

export async function saveImages(files, options) {
  const names = [];
  for (const file of files) {
    names.push(await saveImage(file.buffer, options));
  }
  return names;
}

/**
 * Rasmni o'chiradi. Fayl topilmasa xato tashlamaydi —
 * baza va disk sinxron bo'lmasligi mumkin, bu o'chirishni to'xtatmasin.
 */
export async function removeImage(folder, filename) {
  if (!filename) return;

  // Fayl nomi zod bilan tekshirilgan, lekin bu yerda ham himoya qoldiriladi:
  // bu funksiya diskdan fayl o'chiradi, xato qimmatga tushadi
  const safe = path.basename(String(filename));

  await Promise.all([
    fs.rm(path.join(dirOf(folder), safe), { force: true }),
    fs.rm(path.join(dirOf(folder), 'thumb', safe), { force: true }),
  ]);
}

export default { saveImage, saveImages, removeImage, buildFileName };
