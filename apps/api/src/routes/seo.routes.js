import { Router } from 'express';

import { generateSitemap } from '../services/sitemap.service.js';

/**
 * SEO fayllari.
 * Nginx `/sitemap.xml` ni shu yerga proksilaydi (deploy hujjatiga qarang).
 */
const router = Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await generateSitemap();

    res.type('application/xml');
    // Har so'rovda bazani bezovta qilmaymiz: sitemapga soatlik yangilik yetarli
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('❌ sitemap yaratilmadi:', err.message);
    res.status(503).type('text/plain').send('sitemap vaqtincha mavjud emas');
  }
});

export default router;
