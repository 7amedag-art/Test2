import { cookies } from "next/headers";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./messages";

export const LOCALE_COOKIE = "elp_locale";

export function getLocale(): Locale {
  const cookie = cookies().get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookie && SUPPORTED_LOCALES.includes(cookie)) return cookie;
  return DEFAULT_LOCALE;
}
