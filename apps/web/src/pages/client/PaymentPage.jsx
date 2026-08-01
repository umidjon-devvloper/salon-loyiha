import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CircleAlert, CircleCheck, Clock, Loader2 } from 'lucide-react';
import { formatDateUz } from '@gozal/shared/utils/time';
import { formatPrice } from '@gozal/shared/utils/format';

import { Container } from '../../components/layout/Container';
import { Button, Card, CardBody } from '../../components/ui';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';

/**
 * Payme'dan qaytgach ochiladigan sahifa.
 * `/tolov/:id` — mijoz to'lovni tugatgan (yoki bekor qilgan) bo'lishi mumkin,
 * ikkalasida ham holatni faqat backend aytadi.
 */
export function PaymentPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, booking, timedOut } = usePaymentStatus(id);

  // Payme bekor qilingan holatda ham shu manzilga qaytaradi
  const cancelledByUser = params.get('status') === 'cancel';

  if (state === 'checking') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">To&apos;lov tekshirilmoqda</h1>
          <p className="mt-2 text-sm text-gray-500">Bir necha sekund kuting, sahifani yopmang.</p>
        </div>
      </Container>
    );
  }

  if (state === 'paid' && booking) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CircleCheck className="h-8 w-8 text-emerald-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900">To&apos;lov qabul qilindi</h1>
          <p className="mt-2 text-sm text-gray-600">
            Salon tez orada qo&apos;ng&apos;iroq qilib tasdiqlaydi. Yozuv kodingiz:
          </p>
          <p className="mt-2 text-2xl font-bold tracking-wider text-brand-700">{booking.code}</p>

          <Card className="mt-6 text-left">
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Salon</span>
                <span className="font-medium text-gray-900">{booking.salon?.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Vaqt</span>
                <span className="font-medium text-gray-900">
                  {formatDateUz(booking.date)}, {booking.start}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-brand-50 pt-2">
                <span className="text-gray-500">Salonda to&apos;laysiz</span>
                <span className="font-semibold text-brand-700">
                  {formatPrice(booking.totalPrice)}
                </span>
              </div>
            </CardBody>
          </Card>

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

  // Webhook kechikdi: pul yechilgan bo'lishi mumkin, shuning uchun
  // "to'lanmadi" deb ayta olmaymiz
  if (state === 'pending' || timedOut) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>

          <h1 className="text-lg font-semibold text-gray-900">To&apos;lov tasdiqlanmoqda</h1>
          <p className="mt-2 text-sm text-gray-600">
            To&apos;lov tizimidan javob biroz kechikmoqda. Agar pul yechilgan bo&apos;lsa, yozuv bir
            necha daqiqada tasdiqlanadi — &quot;Yozuvlarim&quot; bo&apos;limidan tekshiring.
          </p>

          <Link to="/profil/yozuvlarim" className="mt-6 inline-block">
            <Button>Yozuvlarim</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <CircleAlert className="h-8 w-8 text-rose-600" />
        </div>

        <h1 className="text-lg font-semibold text-gray-900">
          {cancelledByUser ? 'To\u2019lov bekor qilindi' : 'To\u2019lov amalga oshmadi'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Vaqt band qilinmadi va boshqa mijozlarga ochiq. Qayta urinib ko&apos;rishingiz mumkin.
        </p>

        <Link to="/salonlar" className="mt-6 inline-block">
          <Button>Salonlarni ko&apos;rish</Button>
        </Link>
      </div>
    </Container>
  );
}

export default PaymentPage;
