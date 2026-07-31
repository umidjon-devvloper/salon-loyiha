import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Button, Input, Modal, Select } from '../ui';

const SORT_OPTIONS = [
  { value: 'top', label: 'Avval TOP salonlar' },
  { value: 'rating', label: 'Reyting bo\u2019yicha' },
  { value: 'price_asc', label: 'Avval arzoni' },
  { value: 'price_desc', label: 'Avval qimmati' },
  { value: 'new', label: 'Avval yangilari' },
];

/**
 * Filtr qiymatlari URL search params'da yashaydi (havolani ulashish uchun),
 * shuning uchun bu komponent o'zida holat saqlamaydi — narx maydonlaridan tashqari.
 * Narx har bosilgan raqamda so'rov yubormasin deb, Enter yoki fokus ketganda qo'llanadi.
 */
function Fields({ value, onChange, onReset, showSort = true }) {
  const { data: cities = [] } = useQuery({
    queryKey: catalogKeys.cities,
    queryFn: catalogApi.cities,
    staleTime: Infinity,
  });

  const [minPrice, setMinPrice] = useState(value.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(value.maxPrice ?? '');

  useEffect(() => setMinPrice(value.minPrice ?? ''), [value.minPrice]);
  useEffect(() => setMaxPrice(value.maxPrice ?? ''), [value.maxPrice]);

  const districts = cities.find((c) => c.name === value.city)?.districts ?? [];

  const applyPrice = () => {
    if (
      (minPrice || '') === (value.minPrice ?? '') &&
      (maxPrice || '') === (value.maxPrice ?? '')
    ) {
      return;
    }
    onChange({ minPrice: minPrice || '', maxPrice: maxPrice || '' });
  };

  return (
    <div className="space-y-4">
      <Select
        label="Shahar"
        placeholder="Barcha shaharlar"
        value={value.city ?? ''}
        options={cities.map((c) => ({ value: c.name, label: c.name }))}
        onChange={(e) => onChange({ city: e.target.value, district: '' })}
      />

      <Select
        label="Tuman"
        placeholder={value.city ? 'Barcha tumanlar' : 'Avval shaharni tanlang'}
        value={value.district ?? ''}
        disabled={!districts.length}
        options={districts.map((d) => ({ value: d, label: d }))}
        onChange={(e) => onChange({ district: e.target.value })}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Narx, so&apos;m</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="dan"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            aria-label="Eng past narx"
          />
          <span className="text-gray-400">—</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="gacha"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            aria-label="Eng baland narx"
          />
        </div>
      </div>

      {showSort && (
        <Select
          label="Saralash"
          value={value.sort ?? 'top'}
          options={SORT_OPTIONS}
          onChange={(e) => onChange({ sort: e.target.value })}
        />
      )}

      <Button variant="ghost" size="sm" fullWidth onClick={onReset}>
        <X className="h-4 w-4" />
        Filtrni tozalash
      </Button>
    </div>
  );
}

/** Desktopda yon panel, mobilda pastdan chiqadigan oyna */
export function FilterPanel({ value, onChange, onReset, activeCount = 0, showSort = true }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filtr
          {activeCount > 0 && (
            <span className="ml-1 rounded-md bg-brand-600 px-1.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Filtr"
          footer={
            <Button fullWidth onClick={() => setOpen(false)}>
              Natijalarni ko&apos;rish
            </Button>
          }
        >
          <Fields value={value} onChange={onChange} onReset={onReset} showSort={showSort} />
        </Modal>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Filtr</h2>
          <Fields value={value} onChange={onChange} onReset={onReset} showSort={showSort} />
        </div>
      </aside>
    </>
  );
}

export default FilterPanel;
