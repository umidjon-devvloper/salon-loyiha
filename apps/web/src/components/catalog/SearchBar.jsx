import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import { Button } from '../ui';

/**
 * Bosh sahifadagi qidiruv.
 * Bitta maydon: xizmat, salon yoki mutaxassis nomi — foydalanuvchi
 * qaysi turdagi natija kerakligini oldindan tanlashi shart emas.
 */
export function SearchBar({ autoFocus = false }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const value = q.trim();
    if (value.length < 2) return;
    navigate(`/qidiruv?q=${encodeURIComponent(value)}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-2xl border border-brand-100 bg-white p-2 shadow-sm sm:flex-row"
      role="search"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Xizmat, salon yoki mutaxassis"
          aria-label="Qidiruv"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-11 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <Button type="submit" size="lg" className="sm:w-40" disabled={q.trim().length < 2}>
        Qidirish
      </Button>
    </form>
  );
}

export default SearchBar;
