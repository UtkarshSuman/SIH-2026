/**
 * FEATURE: Tailwind class-merging helper (`cn`) used by every styled
 * component so conditional classes don't produce conflicting utility
 * classes (e.g. two different `px-*` values).
 * INSTALLATION: npm install clsx tailwind-merge
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}