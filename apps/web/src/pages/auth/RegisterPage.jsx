import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Store, UserRound } from 'lucide-react';
import { registerSchema } from '@gozal/shared/schemas/auth.schema';

import { Container } from '../../components/layout/Container';
import { Card, CardBody, Button, Input, PhoneInput, PasswordInput } from '../../components/ui';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';

const roles = [
  {
    value: 'client',
    label: 'Mijozman',
    hint: 'Salonlarga navbat olaman',
    icon: UserRound,
  },
  {
    value: 'owner',
    label: 'Salon egasiman',
    hint: 'Salonimni joylashtiraman',
    icon: Store,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [formError, setFormError] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: '', password: '', fullName: '', role: 'client' },
  });

  const role = watch('role');

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Hisobingiz yaratildi');
      navigate(data.user.role === 'owner' ? '/kabinet' : '/', { replace: true });
    },
    onError: (err) => setFormError(err.message),
  });

  const onSubmit = (values) => {
    setFormError(null);
    mutation.mutate(values);
  };

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Ro&apos;yxatdan o&apos;tish</h1>
          <p className="mt-1.5 text-sm text-gray-500">Bu bir daqiqa vaqt oladi</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
                >
                  {formError}
                </div>
              )}

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-gray-700">
                  Kim sifatida kirasiz?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(({ value, label, hint, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('role', value, { shouldValidate: true })}
                      aria-pressed={role === value}
                      className={cn(
                        'rounded-xl border p-3 text-left transition',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500',
                        role === value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-brand-200',
                      )}
                    >
                      <Icon
                        className={cn(
                          'mb-1.5 h-5 w-5',
                          role === value ? 'text-brand-600' : 'text-gray-400',
                        )}
                      />
                      <span className="block text-sm font-medium text-gray-900">{label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <Input
                label="Ism familiya"
                required
                autoComplete="name"
                placeholder="Dildora Karimova"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    label="Telefon raqam"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.phone?.message}
                    hint="Salon shu raqam orqali bog'lanadi"
                  />
                )}
              />

              <PasswordInput
                label="Parol"
                required
                autoComplete="new-password"
                placeholder="Kamida 6 belgi"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
                Ro&apos;yxatdan o&apos;tish
              </Button>

              {role === 'owner' && (
                <p className="text-xs text-gray-500">
                  Salon yaratganingizdan so&apos;ng u administrator tekshiruvidan o&apos;tadi va
                  shundan keyin katalogda ko&apos;rinadi.
                </p>
              )}
            </form>
          </CardBody>
        </Card>

        <p className="mt-5 text-center text-sm text-gray-600">
          Hisobingiz bormi?{' '}
          <Link to="/kirish" className="font-medium text-brand-600 hover:text-brand-700">
            Kiring
          </Link>
        </p>
      </div>
    </Container>
  );
}
