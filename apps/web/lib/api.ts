import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? null, error: null });
}

export function fail(code: string, status = 400, detail?: unknown) {
  return NextResponse.json(
    { data: null, meta: null, error: { code, detail: detail ?? null } },
    { status },
  );
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>):
  Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, response: fail("validation_error", 422, parsed.error.flatten()) };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, response: fail("invalid_json", 400) };
  }
}
