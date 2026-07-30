import { cn } from '../../lib/cn';

/** Spinner emas, skeleton — sahifa qanday to'lishini oldindan ko'rsatadi */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-gray-100', className)} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export default Skeleton;
