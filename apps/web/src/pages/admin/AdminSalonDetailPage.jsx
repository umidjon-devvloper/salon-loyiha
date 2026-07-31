import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, BadgeCheck, ExternalLink } from 'lucide-react';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';

import { adminApi, adminKeys } from '../../api/admin.api';
import {
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmModal,
  ErrorState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '../../components/ui';

export function AdminSalonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectStatus, setRejectStatus] = useState('draft');
  const [topOpen, setTopOpen] = useState(false);
  const [top, setTop] = useState({ plan: 'month', amount: 150000, note: '' });
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState({ rating: 0, reviewCount: 0 });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: salon,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminKeys.salon(id),
    queryFn: () => adminApi.salon(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.salon(id) });
    queryClient.invalidateQueries({ queryKey: ['admin-salons'] });
    queryClient.invalidateQueries({ queryKey: adminKeys.stats });
  };

  const action = useMutation({
    mutationFn: ({ type, payload }) => {
      if (type === 'status') return adminApi.setSalonStatus(id, payload);
      if (type === 'verify') return adminApi.verifySalon(id, payload);
      if (type === 'top') return adminApi.setSalonTop(id, payload);
      if (type === 'rating') return adminApi.setSalonRating(id, payload);
      return adminApi.deleteSalon(id);
    },
    onSuccess: (_, variables) => {
      toast.success('Bajarildi');
      setRejectOpen(false);
      setTopOpen(false);
      setRatingOpen(false);
      if (variables.type === 'delete') {
        setDeleteOpen(false);
        navigate('/admin/salonlar', { replace: true });
        return;
      }
      invalidate();
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/salonlar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Salonlar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{salon.name}</h1>
            <Badge tone={salon.status === 'active' ? 'emerald' : 'slate'}>{salon.status}</Badge>
            {salon.isTop && <Badge tone="brand">TOP</Badge>}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {salon.city}, {salon.district} · {formatPhone(salon.phone)}
          </p>
        </div>

        <Link to={`/salon/${salon.slug}`} target="_blank">
          <Button variant="secondary" size="sm">
            <ExternalLink className="h-4 w-4" />
            Ommaviy sahifa
          </Button>
        </Link>
      </div>

      {salon.rejectReason && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Rad etish sababi: {salon.rejectReason}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Xizmatlar</p>
            <p className="text-xl font-semibold text-gray-900">{salon.counts.services}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Mutaxassislar</p>
            <p className="text-xl font-semibold text-gray-900">{salon.counts.masters}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Yozuvlar</p>
            <p className="text-xl font-semibold text-gray-900">{salon.counts.bookings}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900">Egasi</h2>
          <p className="text-gray-600">
            {salon.owner?.fullName} · {formatPhone(salon.owner?.phone)}
          </p>
          {salon.address && <p className="text-gray-600">Manzil: {salon.address}</p>}
          {salon.description && <p className="text-gray-600">{salon.description}</p>}
          <p className="text-gray-500">
            Narx oralig&apos;i: {formatPrice(salon.minPrice)} – {formatPrice(salon.maxPrice)}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap gap-2">
          {salon.status !== 'active' && (
            <Button
              loading={action.isPending}
              onClick={() => action.mutate({ type: 'status', payload: { status: 'active' } })}
            >
              Tasdiqlash
            </Button>
          )}

          {salon.status === 'pending' && (
            <Button
              variant="secondary"
              onClick={() => {
                setRejectStatus('draft');
                setRejectOpen(true);
              }}
            >
              Qaytarish
            </Button>
          )}

          {salon.status !== 'blocked' && (
            <Button
              variant="danger"
              onClick={() => {
                setRejectStatus('blocked');
                setRejectOpen(true);
              }}
            >
              Bloklash
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => action.mutate({ type: 'verify', payload: !salon.isVerified })}
          >
            <BadgeCheck className="h-4 w-4" />
            {salon.isVerified ? 'Tasdiq belgisini olish' : 'Tasdiqlangan qilish'}
          </Button>

          <Button variant="secondary" onClick={() => setTopOpen(true)}>
            {salon.isTop ? 'TOP muddatini uzaytirish' : 'TOP qilish'}
          </Button>

          {salon.isTop && (
            <Button
              variant="ghost"
              onClick={() => action.mutate({ type: 'top', payload: { plan: null } })}
            >
              TOP dan olish
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              setRating({ rating: salon.rating, reviewCount: salon.reviewCount });
              setRatingOpen(true);
            }}
          >
            Reyting
          </Button>

          <Button variant="ghost" className="ml-auto" onClick={() => setDeleteOpen(true)}>
            O&apos;chirish
          </Button>
        </CardBody>
      </Card>

      {/* Rad etish / bloklash — sabab majburiy, u salon egasiga ko'rinadi */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={rejectStatus === 'blocked' ? 'Salonni bloklash' : 'Tuzatishga qaytarish'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Yopish
            </Button>
            <Button
              variant="danger"
              loading={action.isPending}
              disabled={!rejectReason.trim()}
              onClick={() =>
                action.mutate({
                  type: 'status',
                  payload: { status: rejectStatus, rejectReason },
                })
              }
            >
              Tasdiqlash
            </Button>
          </>
        }
      >
        <Input
          label="Sababi"
          required
          hint="Salon egasi kabinetida shu matnni ko'radi"
          placeholder="Masalan: xizmat narxlari kiritilmagan"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        open={topOpen}
        onClose={() => setTopOpen(false)}
        title="TOP e'lon"
        description="Pul platformadan tashqarida olinadi — bu yerda faqat qayd qilinadi"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTopOpen(false)}>
              Yopish
            </Button>
            <Button
              loading={action.isPending}
              onClick={() =>
                action.mutate({
                  type: 'top',
                  payload: { plan: top.plan, amount: Number(top.amount), note: top.note },
                })
              }
            >
              Yoqish
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Tarif"
            value={top.plan}
            options={[
              { value: 'week', label: '7 kun' },
              { value: 'month', label: '30 kun' },
            ]}
            onChange={(e) => setTop({ ...top, plan: e.target.value })}
          />
          <Input
            label="To'langan summa, so'm"
            type="number"
            min={0}
            value={top.amount}
            onChange={(e) => setTop({ ...top, amount: e.target.value })}
          />
          <Input
            label="Izoh"
            placeholder="Naqd to'landi"
            value={top.note}
            onChange={(e) => setTop({ ...top, note: e.target.value })}
          />
          {salon.topUntil && (
            <p className="text-sm text-gray-500">
              Hozirgi muddat tugamagan bo&apos;lsa, yangi kunlar ustiga qo&apos;shiladi.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        title="Reyting"
        description="v1 da reyting qo'lda kiritiladi — sharh tizimi keyingi bosqichda"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRatingOpen(false)}>
              Yopish
            </Button>
            <Button
              loading={action.isPending}
              onClick={() =>
                action.mutate({
                  type: 'rating',
                  payload: {
                    rating: Number(rating.rating),
                    reviewCount: Number(rating.reviewCount),
                  },
                })
              }
            >
              Saqlash
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Reyting (0–5)"
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={rating.rating}
            onChange={(e) => setRating({ ...rating, rating: e.target.value })}
          />
          <Input
            label="Baholar soni"
            type="number"
            min={0}
            value={rating.reviewCount}
            onChange={(e) => setRating({ ...rating, reviewCount: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => action.mutate({ type: 'delete' })}
        loading={action.isPending}
        danger
        title="Salonni o'chirasizmi?"
        description="Yozuvi bor salonni o'chirib bo'lmaydi — buning o'rniga bloklang."
        confirmText="O'chirish"
      />
    </div>
  );
}

export default AdminSalonDetailPage;
