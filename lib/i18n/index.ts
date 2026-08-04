import "server-only";
import { cookies } from "next/headers";
import { en } from "./en";
import { mm } from "./mm";

export type Dictionary = typeof en;
export type Locale = "en" | "mm";

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "mm";

const dictionaries: Record<Locale, Dictionary> = { en, mm };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : value === "mm" ? "mm" : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
