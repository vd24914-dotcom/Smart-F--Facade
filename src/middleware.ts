import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const current = locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (current) {
    // Передаём язык в корневой layout, чтобы проставить <html lang>
    const headers = new Headers(request.headers);
    headers.set("x-locale", current);
    return NextResponse.next({ request: { headers } });
  }

  // Пытаемся угадать язык по заголовку браузера, иначе — русский
  const header = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const guessed = locales.find((locale) => header.startsWith(locale)) ?? defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${guessed}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
