import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtrlar URL search params'da saqlanadi — havolani ulashish, orqaga qaytish
 * va sahifani yangilash ishlaydi. Komponentda nusxa holat saqlanmaydi.
 *
 * Filtr o'zgarganda `page` avtomatik tashlanadi: 5-sahifada turib shaharni
 * almashtirgan odam bo'sh sahifaga tushib qolmasin.
 */
export function useFilterParams(defaults = {}) {
  const [params, setParams] = useSearchParams();

  const value = useMemo(
    () => ({ ...defaults, ...Object.fromEntries(params.entries()) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  );

  const patch = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);

      for (const [key, val] of Object.entries(changes)) {
        if (val === '' || val === null || val === undefined) next.delete(key);
        else next.set(key, String(val));
      }

      if (!('page' in changes)) next.delete('page');
      setParams(next);
    },
    [params, setParams],
  );

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  return [value, patch, reset];
}

export default useFilterParams;
