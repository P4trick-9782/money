import { BASE_CCY, CURRENCIES, KEYS } from "@/constants/categories";
import { loadJson, saveJson } from "./storage";

export type RateCache = { base: string; rates: Record<string, number>; fetchedAt: string };

let cache: RateCache | null = null;

export async function loadRates() {
  cache = await loadJson<RateCache | null>(KEYS.rates, null);
  return cache;
}

export async function fetchRates() {
  const quotes = CURRENCIES.filter((c) => c.code !== BASE_CCY).map((c) => c.code).join(",");
  const res = await fetch(`https://api.frankfurter.app/latest?base=${BASE_CCY}&symbols=${quotes}`);
  if (!res.ok) return cache;
  const data = await res.json();
  cache = { base: BASE_CCY, rates: { ...data.rates, [BASE_CCY]: 1 }, fetchedAt: new Date().toISOString() };
  await saveJson(KEYS.rates, cache);
  return cache;
}

export function toTWD(amount: number, ccy?: string) {
  if (!ccy || ccy === BASE_CCY) return Number(amount) || 0;
  const rate = cache?.rates?.[ccy];
  if (!rate) return Number(amount) || 0;
  return (Number(amount) || 0) / rate;
}
