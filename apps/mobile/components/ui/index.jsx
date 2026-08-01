import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import tokens from '@gozal/shared/tokens';

/**
 * Mobil UI primitivlari.
 *
 * Web'dagi komponentlar ko'chirilmaydi — `<div>`, `<button>` va CSS hover
 * React Native'da yo'q. Lekin ranglar va radiuslar AYNI tokenlardan olinadi,
 * shuning uchun ikki ilova bir xil ko'rinadi.
 *
 * ⚠️ Bosiladigan element balandligi kamida 44px: barmoq uchun eng kichik
 * qulay o'lcham (Apple HIG). Web'dagi 36px tugma telefonda tegib bo'lmaydi.
 */
const brand = tokens.colors.brand;

const VARIANTS = {
  primary: {
    container: 'bg-brand-600 active:bg-brand-700',
    text: 'text-white',
    spinner: '#fff',
  },
  secondary: {
    container: 'bg-white border border-brand-200 active:bg-brand-50',
    text: 'text-brand-700',
    spinner: brand[700],
  },
  ghost: {
    container: 'active:bg-brand-50',
    text: 'text-brand-700',
    spinner: brand[700],
  },
  danger: {
    container: 'bg-rose-600 active:bg-rose-700',
    text: 'text-white',
    spinner: '#fff',
  },
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  const style = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl px-4 ${
        style.container
      } ${isDisabled ? 'opacity-50' : ''} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={style.spinner} />
      ) : (
        <Text className={`text-base font-semibold ${style.text}`}>{children}</Text>
      )}
    </Pressable>
  );
}

export function Input({ label, error, hint, value, onChangeText, className = '', ...props }) {
  return (
    <View className={className}>
      {label && <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9CA3AF"
        className={`min-h-[48px] rounded-xl border bg-white px-3.5 text-base text-gray-900 ${
          error ? 'border-rose-400' : 'border-gray-200 focus:border-brand-500'
        }`}
        {...props}
      />

      {error ? (
        <Text className="mt-1 text-sm text-rose-600">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-sm text-gray-400">{hint}</Text>
      ) : null}
    </View>
  );
}

/**
 * Telefon maydoni.
 *
 * `+998` prefiksi doimiy ko'rinib turadi va tahrirlanmaydi — foydalanuvchi
 * uni yozishi ham, o'chirib yuborishi ham mumkin emas. Klaviatura raqamli.
 */
export function PhoneInput({ label = 'Telefon raqam', value, onChangeText, error, hint }) {
  // Bazada '+998901234567' saqlanadi, ekranda esa faqat 9 raqam ko'rinadi
  const digits = (value || '').replace(/\D/g, '').replace(/^998/, '').slice(0, 9);

  const handleChange = (text) => {
    const next = text.replace(/\D/g, '').slice(0, 9);
    onChangeText(next ? `+998${next}` : '');
  };

  return (
    <View>
      {label && <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>}

      <View
        className={`min-h-[48px] flex-row items-center rounded-xl border bg-white px-3.5 ${
          error ? 'border-rose-400' : 'border-gray-200'
        }`}
      >
        <Text className="text-base text-gray-500">+998</Text>
        <TextInput
          value={digits}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={9}
          placeholder="90 123 45 67"
          placeholderTextColor="#9CA3AF"
          textContentType="telephoneNumber"
          className="ml-2 flex-1 text-base text-gray-900"
        />
      </View>

      {error ? (
        <Text className="mt-1 text-sm text-rose-600">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-sm text-gray-400">{hint}</Text>
      ) : null}
    </View>
  );
}

export function Card({ children, className = '' }) {
  return (
    <View className={`rounded-2xl border border-brand-100 bg-white p-4 ${className}`}>
      {children}
    </View>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <View className="items-center justify-center px-6 py-12">
      {Icon && (
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Icon size={26} color={brand[500]} />
        </View>
      )}
      <Text className="text-center text-base font-semibold text-gray-900">{title}</Text>
      {description && <Text className="mt-1 text-center text-sm text-gray-500">{description}</Text>}
      {action && <View className="mt-5">{action}</View>}
    </View>
  );
}

export function ErrorState({ message = "Ma'lumotni yuklab bo'lmadi", onRetry }) {
  return (
    <View className="items-center px-6 py-10">
      <Text className="text-center text-gray-600">{message}</Text>
      {onRetry && (
        <View className="mt-4">
          <Button variant="secondary" onPress={onRetry}>
            Qayta urinish
          </Button>
        </View>
      )}
    </View>
  );
}

export function Spinner({ className = '' }) {
  return (
    <View className={`items-center justify-center py-8 ${className}`}>
      <ActivityIndicator size="large" color={brand[500]} />
    </View>
  );
}
