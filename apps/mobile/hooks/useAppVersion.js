import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';

import { isUpdateRequired } from '@gozal/shared/utils/version';

import { api } from '../lib/api';

/**
 * Majburiy yangilanish tekshiruvi.
 *
 * Ilova har ochilganda `GET /app/version` so'raladi. Qurilmadagi versiya
 * `minVersion` dan past bo'lsa — oldinga o'tkazilmaydi.
 *
 * ⚠️ Nima uchun kerak: eski versiya API bilan mos kelmay qolsa (masalan
 * booking javob formati o'zgarsa), do'kondagi odamlarning telefonida u
 * jimgina buziladi. Majburiy yangilanish ekrani bo'lmasa, ularni
 * to'xtatishning iloji yo'q.
 */

export function useAppVersion() {
  const current = Constants.expoConfig?.version ?? '1.0.0';

  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: api.app.version,
    // Bir soatda bir marta yetarli; ilova qayta ochilganda ham tekshiriladi
    staleTime: 60 * 60_000,
    // Tarmoq yo'q bo'lsa ilovani bloklamaymiz
    retry: 1,
  });

  const updateRequired = data ? isUpdateRequired(current, data.minVersion) : false;

  return {
    current,
    updateRequired,
    maintenance: Boolean(data?.maintenance),
    maintenanceMessage: data?.maintenanceMessage,
    updateUrl: data?.updateUrl,
    latestVersion: data?.latestVersion,
  };
}

export default useAppVersion;
