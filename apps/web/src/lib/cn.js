import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Shartli klasslar + Tailwind ziddiyatlarini to'g'ri yechish */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
