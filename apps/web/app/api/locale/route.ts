import { cookies } from "next/headers";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { SUPPORTED_LOCALES } from "@/lib/i18n/messages";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

const Body = z.object({ locale: z.enum(SUPPORTED_LOCALES) });

export async function POST(req: Request) {
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;
  cookies().set(LOCALE_COOKIE, parsed.data.locale, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365 });
  return ok({ locale: parsed.data.locale });
}
