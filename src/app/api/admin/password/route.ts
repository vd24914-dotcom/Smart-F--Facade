import { NextResponse } from "next/server";
import { COOKIE, checkPassword, isAuthenticated, savePassword, tokenFor } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { current, next } = (await request.json()) as { current?: string; next?: string };

  if (!current || !checkPassword(current)) {
    return NextResponse.json({ error: "Текущий пароль неверный" }, { status: 400 });
  }
  if (!next || next.trim().length < 4) {
    return NextResponse.json({ error: "Новый пароль — минимум 4 символа" }, { status: 400 });
  }

  try {
    const saved = savePassword(next);
    const response = NextResponse.json({ ok: true });
    // старый cookie перестаёт подходить, поэтому сразу выдаём новый
    response.cookies.set(COOKIE, tokenFor(saved), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить пароль";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
