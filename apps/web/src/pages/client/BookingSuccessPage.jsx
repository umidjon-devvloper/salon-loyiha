import { Link, useLocation, useParams } from 'react-router-dom';
import { CalendarCheck, Phone } from 'lucide-react';
import { formatDateUz, formatDurationUz } from '@gozal/shared/utils/time';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';

import { Container } from '../../components/layout/Container';
import { Button, Card, CardBody } from '../../components/ui';

/**
 * Tasdiq ekrani.
 *
 * Yozuv ma'lumoti navigatsiya holatida keladi. Sahifa yangilansa u yo'qoladi —
 * unda kodni ko'rsatib, "yozuvlarim" ga yo'naltiramiz. Kod mijoz salonga
 * telefon qilganda aytadigan yagona narsa, shuning uchun u har doim ko'rinadi.
 */
export function BookingSuccessPage() {
  const { code } = useParams();
  const booking = useLocation().state?.booking;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <CalendarCheck className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900">Yozuvingiz qabul qilindi</h1>
        <p className="mt-2 text-sm text-gray-600">
          Salon tez orada qo&apos;ng&apos;iroq qilib tasdiqlaydi. Yozuv kodingiz:
        </p>
        <p className="mt-2 text-2xl font-bold tracking-wider text-brand-700">{code}</p>

        {booking && (
          <Card className="mt-6 text-left">
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Salon</span>
                <span className="font-medium text-gray-900">{booking.salon?.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Mutaxassis</span>
                <span className="font-medium text-gray-900">{booking.master?.fullName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Vaqt</span>
                <span className="font-medium text-gray-900">
                  {formatDateUz(booking.date)}, {booking.start}–{booking.end}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-brand-50 pt-2">
                <span className="text-gray-500">Jami</span>
                <span className="font-semibold text-brand-700">
                  {formatPrice(booking.totalPrice)} · {formatDurationUz(booking.totalDuration)}
                </span>
              </div>

              {booking.salon?.phone && (
                <a
                  href={`tel:${booking.salon.phone}`}
                  className="flex items-center justify-center gap-2 border-t border-brand-50 pt-3 font-medium text-brand-700"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(booking.salon.phone)}
                </a>
              )}
            </CardBody>
          </Card>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/profil/yozuvlarim">
            <Button fullWidth>Yozuvlarim</Button>
          </Link>
          <Link to="/salonlar">
            <Button variant="secondary" fullWidth>
              Katalogga qaytish
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default BookingSuccessPage;
