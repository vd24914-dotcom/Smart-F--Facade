import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "sf_admin";

/** Пароль хранится в content/admin.json — его можно сменить прямо в админке. */
const passwordFile = path.join(process.cwd(), "content", "admin.json");

const DEFAULT_PASSWORD = "smartfacade2026";

export function currentPassword() {
  // пароль из настроек хостинга главнее файла: на сервере файл менять нельзя
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  try {
    const raw = fs.readFileSync(passwordFile, "utf8");
    const parsed = JSON.parse(raw) as { password?: string };
    if (parsed.password && parsed.password.trim()) return parsed.password.trim();
  } catch {
    // файла нет — пароль по умолчанию
  }
  return DEFAULT_PASSWORD;
}

export function savePassword(next: string) {
  const value = next.trim();
  if (value.length < 4) throw new Error("Пароль должен быть не короче 4 символов");
  if (process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error("Пароль задан в настройках хостинга — меняйте его там.");
  }
  fs.mkdirSync(path.dirname(passwordFile), { recursive: true });
  fs.writeFileSync(passwordFile, JSON.stringify({ password: value }, null, 2) + "\n", "utf8");
  return value;
}

/**
 * На боевом сервере админку нельзя открывать с паролем по умолчанию:
 * если пароль не задан в настройках хостинга — вход закрыт совсем.
 */
export function adminIsLocked() {
  if (process.env.NODE_ENV !== "production") return false;

  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  // пароль по умолчанию знают все — он не считается настроенным
  if (fromEnv) return fromEnv === DEFAULT_PASSWORD;

  try {
    const raw = fs.readFileSync(passwordFile, "utf8");
    const parsed = JSON.parse(raw) as { password?: string };
    return !parsed.password?.trim() || parsed.password.trim() === DEFAULT_PASSWORD;
  } catch {
    return true;
  }
}

export function tokenFor(pass: string) {
  return createHash("sha256").update(`${pass}::smart-facade-admin`).digest("hex");
}

/** Пробелы по краям срезаем — иначе пароль из буфера обмена «не подходит». */
export function checkPassword(input: string) {
  return input.trim() === currentPassword();
}

export function validToken() {
  return tokenFor(currentPassword());
}

export async function isAuthenticated() {
  if (adminIsLocked()) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === validToken();
}
