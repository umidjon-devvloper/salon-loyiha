import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

/** Xato holati — nima bo'lganini aytadi va qayta urinish tugmasini beradi */
export function ErrorState({ message = 'Ma\u2019lumotni yuklab bo\u2019lmadi', onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
        <TriangleAlert className="h-7 w-7 text-rose-500" />
      </div>
      <p className="text-sm text-gray-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Qayta urinish
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
