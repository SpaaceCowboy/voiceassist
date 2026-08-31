import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatCount(value: number) {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
    : String(value);
}
