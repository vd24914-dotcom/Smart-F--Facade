import { NextResponse } from "next/server";
import { COOKIE, checkPassword, validToken, adminIsLocked } from "@/lib/auth";

export async function POST(request: Request) {
  // на боевом сервере без своего пароля вход закрыт совсем
  if (adminIsLocked()) {
    return NextResponse.json(
      { error: "Админка на этом сервере выключена: не задан свой пароль." },
      { status: 403 }
    );
  }

  const { password } = (await request.json()) as { password?: string };

  if (!password || !checkPassword(password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, validToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
