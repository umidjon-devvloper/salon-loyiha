import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loginSchema } from '@gozal/shared/schemas/auth.schema';

import { Container } from '../../components/layout/Container';
import { Card, CardBody, Button, PhoneInput, PasswordInput } from '../../components/ui';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const [formError, setFormError] = useState(null);

  // Kirishdan oldin qaysi sahifaga bormoqchi edi — o'sha yerga qaytaramiz
  const redirectTo = location.state?.from?.pathname || '/';

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`Xush kelibsiz, ${data.user.fullName}`);
      navigate(redirectTo, { replace: true });
    },
    onError: (err) => {
      // Telefon/parol xatosi maydon ostida emas, forma tepasida ko'rsatiladi:
      // qaysi biri noto'g'ri ekani ataylab aytilmaydi
      setFormError(err.message);
    },
  });

  const onSubmit = (values) => {
    setFormError(null);
    mutation.mutate(values);
  };

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Kirish</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Telefon raqamingiz va parolingizni kiriting
          </p>
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

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    label="Telefon raqam"
                    required
                    autoFocus
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.phone?.message}
                  />
                )}
              />

              <PasswordInput
                label="Parol"
                required
                autoComplete="current-password"
                placeholder="Parolingiz"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
                Kirish
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-5 text-center text-sm text-gray-600">
          Hisobingiz yo&apos;qmi?{' '}
          <Link to="/royxatdan-otish" className="font-medium text-brand-600 hover:text-brand-700">
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-gray-400">
          Parolni unutdingizmi? Administratorga murojaat qiling — SMS orqali tiklash hozircha yo&apos;q.
        </p>
      </div>
    </Container>
  );
}
