import { useEffect, useState } from 'react';

/** Har harfga so'rov ketmasin — mobil trafik va batareya uchun ham muhim */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
