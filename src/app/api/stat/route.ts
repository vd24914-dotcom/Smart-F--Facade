import { NextResponse } from "next/server";
import { trackView } from "@/content/store";

/** Счётчик посещений: вызывается один раз при открытии страницы. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { first?: boolean };

  try {
    trackView(Boolean(body.first));
  } catch {
    // статистика не должна ломать сайт
  }

  return NextResponse.json({ ok: true });
}
