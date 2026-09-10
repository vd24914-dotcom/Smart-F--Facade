import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";

/**
 * Где лежит содержимое сайта.
 *
 * На компьютере — обычные файлы в папке content/, как и раньше.
 * На сервере (Vercel) файлы менять нельзя, поэтому используется облачное
 * хранилище Vercel Blob. Оно включается само, как только в настройках проекта
 * появляется ключ BLOB_READ_WRITE_TOKEN — руками ничего прописывать не нужно.
 *
 * Пока в облаке пусто, читаем из файлов, уехавших вместе с кодом, — поэтому
 * сайт работает сразу после публикации, ещё до первой правки в админке.
 */

const dir = path.join(process.cwd(), "content");

/** Папка внутри хранилища — чтобы не путать с загруженными картинками. */
const PREFIX = "content";

export function cloudEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/* ─────────────── адрес хранилища ─────────────── */

/** Общий адрес вида https://xxxx.public.blob.vercel-storage.com — ищем один раз. */
let cachedHost: string | null = null;

async function storageHost(): Promise<string | null> {
  const manual = process.env.BLOB_PUBLIC_BASE?.trim();
  if (manual) return manual.replace(/\/$/, "");
  if (cachedHost) return cachedHost;

  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ limit: 1 });
    if (!blobs.length) return null; // в хранилище пока ничего нет
    const url = new URL(blobs[0].url);
    cachedHost = `${url.protocol}//${url.host}`;
    return cachedHost;
  } catch {
    return null;
  }
}

/* ─────────────── чтение ─────────────── */

function readFile<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Читает файл из облака. Результат кэшируется и сбрасывается после сохранения
 * из админки, поэтому лишних обращений к хранилищу нет.
 */
async function fetchCloud<T>(file: string): Promise<T | null> {
  const host = await storageHost();
  if (!host) return null;

  try {
    // отметка времени не даёт отдать старую копию из промежуточных кэшей
    const res = await fetch(`${host}/${PREFIX}/${file}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function readCloud<T>(file: string): Promise<T | null> {
  return unstable_cache(() => fetchCloud<T>(file), ["content", file], { tags: ["content"] })();
}

/**
 * Читает содержимое: сначала облако, потом файл проекта.
 *
 * `fresh` — для разделов, которые меняются сами по себе (заявки, посещаемость):
 * их нельзя брать из кэша, иначе новая запись затрёт предыдущую.
 */
export async function readStored<T>(file: string, fallback: T, fresh = false): Promise<T> {
  if (cloudEnabled()) {
    const fromCloud = fresh ? await fetchCloud<T>(file) : await readCloud<T>(file);
    if (fromCloud !== null) return fromCloud;
  }
  return readFile<T>(file) ?? fallback;
}

/* ─────────────── запись ─────────────── */

export class ReadOnlyStorageError extends Error {
  constructor() {
    super(
      "Сохранять правки некуда: на сервере не подключено хранилище, " +
        "а файлы менять нельзя. Подключите Vercel Blob в настройках проекта."
    );
    this.name = "ReadOnlyStorageError";
  }
}

const READ_ONLY_CODES = new Set(["EROFS", "EACCES", "EPERM", "ENOENT"]);

function writeFile(file: string, data: unknown) {
  const target = path.join(dir, file);
  const tmp = `${target}.tmp`;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, target);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code && READ_ONLY_CODES.has(code)) throw new ReadOnlyStorageError();
    throw error;
  }
}

async function writeCloud(file: string, data: unknown) {
  const { put } = await import("@vercel/blob");
  const blob = await put(`${PREFIX}/${file}`, JSON.stringify(data, null, 2) + "\n", {
    access: "public",
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });

  // запомним адрес хранилища — пригодится для следующих чтений
  try {
    const url = new URL(blob.url);
    cachedHost = `${url.protocol}//${url.host}`;
  } catch {
    // адрес не разобрался — не страшно, найдём заново
  }
}

export async function writeStored(file: string, data: unknown) {
  if (cloudEnabled()) {
    await writeCloud(file, data);
    return;
  }
  writeFile(file, data);
}

/** Можно ли сейчас сохранять правки. */
export function storageIsWritable(): boolean {
  if (cloudEnabled()) return true;
  try {
    const probe = path.join(dir, ".write-probe");
    fs.writeFileSync(probe, "ok", "utf8");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}
