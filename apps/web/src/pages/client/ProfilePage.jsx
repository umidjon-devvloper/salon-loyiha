import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarCheck, Heart, LogOut, Store } from 'lucide-react';
import { formatPhone } from '@gozal/shared/utils/format';

import { authApi } from '../../api/auth.api';
import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { Button, Card, CardBody, Input, PasswordInput, Select } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ fullName: '', city: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  const { data: cities = [] } = useQuery({
    queryKey: catalogKeys.cities,
    queryFn: catalogApi.cities,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName || '', city: user.city || 'Toshkent' });
  }, [user]);

  const save = useMutation({
    mutationFn: () => authApi.updateMe(form),
    onSuccess: (updated) => {
      toast.success('Saqlandi');
      setUser?.(updated);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(passwords),
    onSuccess: () => {
      toast.success('Parol o\u2019zgartirildi. Qayta kiring');
      setPasswords({ oldPassword: '', newPassword: '' });
      // Backend barcha sessiyalarni yopadi — foydalanuvchi qayta kirishi kerak
      logout();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Container className="max-w-2xl py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Profil</h1>

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-3">
            <Input
              label="Ism familiya"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />

            <Select
              label="Shahar"
              value={form.city}
              options={cities.map((c) => ({ value: c.name, label: c.name }))}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Telefon raqam</span>
              <p className="text-gray-900">{formatPhone(user?.phone)}</p>
              <p className="mt-1 text-xs text-gray-400">
                Raqamni o&apos;zgartirish uchun administratorga murojaat qiling
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                loading={save.isPending}
                disabled={form.fullName.trim().length < 2}
                onClick={() => save.mutate()}
              >
                Saqlash
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/profil/yozuvlarim">
            <Card className="h-full transition hover:border-brand-300">
              <CardBody className="flex items-center gap-3">
                <CalendarCheck className="h-5 w-5 shrink-0 text-brand-500" />
                <span className="font-medium text-gray-900">Yozuvlarim</span>
              </CardBody>
            </Card>
          </Link>

          <Link to="/profil/sevimlilar">
            <Card className="h-full transition hover:border-brand-300">
              <CardBody className="flex items-center gap-3">
                <Heart className="h-5 w-5 shrink-0 text-brand-500" />
                <span className="font-medium text-gray-900">Sevimlilar</span>
              </CardBody>
            </Card>
          </Link>

          {user?.role === 'owner' && (
            <Link to="/kabinet">
              <Card className="h-full transition hover:border-brand-300">
                <CardBody className="flex items-center gap-3">
                  <Store className="h-5 w-5 shrink-0 text-brand-500" />
                  <span className="font-medium text-gray-900">Salon kabineti</span>
                </CardBody>
              </Card>
            </Link>
          )}
        </div>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-gray-900">Parolni o&apos;zgartirish</h2>

            <PasswordInput
              label="Hozirgi parol"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
            />
            <PasswordInput
              label="Yangi parol"
              hint="Kamida 6 belgi. O'zgartirilgach qayta kirasiz"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />

            <div className="flex justify-end">
              <Button
                variant="secondary"
                loading={changePassword.isPending}
                disabled={!passwords.oldPassword || passwords.newPassword.length < 6}
                onClick={() => changePassword.mutate()}
              >
                O&apos;zgartirish
              </Button>
            </div>
          </CardBody>
        </Card>

        <Button variant="ghost" fullWidth onClick={logout}>
          <LogOut className="h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </Container>
  );
}

export default ProfilePage;
