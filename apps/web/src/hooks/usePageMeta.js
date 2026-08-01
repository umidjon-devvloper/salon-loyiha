import { useEffect } from 'react';

/**
 * Sahifa sarlavhasi va meta teglari.
 *
 * ⚠️ SPA bo'lgani uchun bu teglar BRAUZERDA qo'yiladi — Google JS ni
 * bajaradi va ko'radi, lekin Telegram/Facebook havola ko'rigi (preview)
 * bajarmaydi. Salon sahifalarining chiroyli ko'rinishi kerak bo'lsa,
 * v2 da SSR yoki prerender qo'shiladi. v1 uchun bu yetarli.
 */
const SITE = "Go'zal Ayol";
const DEFAULT_DESCRIPTION =
  "Go'zallik salonlari va mutaxassislarga onlayn navbat oling. Bo'sh vaqtni ko'ring, bir necha bosishda band qiling.";

function setTag(selector, attrs) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement(
      attrs.property ? 'meta' : selector.startsWith('link') ? 'link' : 'meta',
    );
    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'content' && key !== 'href') tag.setAttribute(key, value);
    }
    document.head.appendChild(tag);
  }

  if (attrs.content !== undefined) tag.setAttribute('content', attrs.content);
  if (attrs.href !== undefined) tag.setAttribute('href', attrs.href);
}

export function usePageMeta({ title, description, image, noIndex = false } = {}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} — ${SITE}`
      : `${SITE} — go'zallik salonlariga onlayn yozilish`;
    const text = description || DEFAULT_DESCRIPTION;
    const url = window.location.href;

    document.title = fullTitle;

    setTag('meta[name="description"]', { name: 'description', content: text });
    setTag('link[rel="canonical"]', { rel: 'canonical', href: url });

    setTag('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    setTag('meta[property="og:description"]', { property: 'og:description', content: text });
    setTag('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setTag('meta[property="og:url"]', { property: 'og:url', content: url });
    setTag('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE });

    if (image) {
      const absolute = image.startsWith('http') ? image : `${window.location.origin}${image}`;
      setTag('meta[property="og:image"]', { property: 'og:image', content: absolute });
    }

    // Kabinet va admin sahifalari indekslanmasin
    setTag('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow',
    });
  }, [title, description, image, noIndex]);
}

export default usePageMeta;
