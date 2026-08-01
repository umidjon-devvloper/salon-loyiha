import { Salon, Category, Master } from '../models/index.js';
import env from '../config/env.js';
import { SALON_STATUS } from '../config/constants.js';

/**
 * Dinamik sitemap.
 *
 * Statik fayl bo'lmasligining sababi: salonlar har kuni qo'shiladi va
 * moderatsiyadan o'tadi. Qo'lda yangilanadigan sitemap bir haftada eskiradi
 * va yangi salonlar Google'ga umuman tushmaydi.
 */
const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/salonlar', priority: '0.9', changefreq: 'daily' },
  { path: '/mutaxassislar', priority: '0.8', changefreq: 'daily' },
  { path: '/biz-haqimizda', priority: '0.3', changefreq: 'monthly' },
  { path: '/oferta', priority: '0.3', changefreq: 'yearly' },
  { path: '/maxfiylik', priority: '0.3', changefreq: 'yearly' },
];

const escapeXml = (value) =>
  String(value).replace(
    /[<>&'"]/g,
    (c) => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`,
  );

const isoDate = (date) => new Date(date || Date.now()).toISOString().slice(0, 10);

export function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildSitemap(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(buildUrlEntry),
    '</urlset>',
  ].join('\n');
}

export async function generateSitemap() {
  const base = env.clientOrigins[0].replace(/\/$/, '');

  const [categories, salons, masters] = await Promise.all([
    Category.find({ isActive: true }).select('slug updatedAt').lean(),
    // ⚠️ Faqat `active`: tekshiruvdagi yoki bloklangan salon sitemapga tushsa,
    // Google 404 yoki bo'sh sahifani indekslaydi
    Salon.find({ status: SALON_STATUS.ACTIVE }).select('slug updatedAt isTop').lean(),
    Master.find({ isActive: true })
      .select('_id salon updatedAt')
      .populate({
        path: 'salon',
        select: 'status',
      })
      .lean(),
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => ({
      loc: `${base}${p.path}`,
      changefreq: p.changefreq,
      priority: p.priority,
    })),

    ...categories.map((c) => ({
      loc: `${base}/kategoriya/${c.slug}`,
      lastmod: isoDate(c.updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    })),

    ...salons.map((s) => ({
      loc: `${base}/salon/${s.slug}`,
      lastmod: isoDate(s.updatedAt),
      changefreq: 'weekly',
      // TOP salonlar biroz yuqori — ular faolroq yangilanadi
      priority: s.isTop ? '0.8' : '0.6',
    })),

    ...masters
      .filter((m) => m.salon?.status === SALON_STATUS.ACTIVE)
      .map((m) => ({
        loc: `${base}/mutaxassis/${m._id}`,
        lastmod: isoDate(m.updatedAt),
        changefreq: 'weekly',
        priority: '0.5',
      })),
  ];

  return buildSitemap(entries);
}

export default generateSitemap;
