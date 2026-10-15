import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amountMinor: number | string | undefined | null,
  currency: string = "inr",
): string {
  const numeric = typeof amountMinor === "string" ? parseFloat(amountMinor) : Number(amountMinor || 0);
  const major = numeric / 100;
  const normalizedCur = (currency || "inr").toUpperCase();

  try {
    return new Intl.NumberFormat(normalizedCur === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: normalizedCur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch (e) {
    const symbols: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    const sym = symbols[normalizedCur] || `${normalizedCur} `;
    return `${sym}${major.toFixed(2)}`;
  }
}
