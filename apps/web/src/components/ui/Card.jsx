import { cn } from '../../lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-brand-100 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4 sm:p-6', className)}>{children}</div>;
}

export default Card;
