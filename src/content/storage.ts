import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";

/**
 * Где лежит содержимое сайта.
 *
 * На компьютере — обычные файлы в папке content/, как и раньше.
 * На сервере (Vercel) файлы менять нельзя, поэтому используется облачное
 * хранилище Vercel Blob. Оно включается само, как только проект подключён
 * к хранилищу — руками ничего прописывать не нужно.
 *
 * Vercel даёт доступ к хранилищу двумя способами, поддерживаем оба:
 *   BLOB_STORE_ID          — новый способ, вход по внутреннему ключу проекта
 *   BLOB_READ_WRITE_TOKEN  — прежний способ, отдельный ключ
 *
 * Пока в облаке пусто, читаем из файлов, уехавших вместе с кодом, — поэтому
 * сайт работает сразу после публикации, ещё до первой правки в админке.
 */

const dir = path.join(process.cwd(), "content");

/** Папка внутри хранилища — чтобы не путать с загруженными картинками. */
const PREFIX = "content";

/** Хранилище открытое (картинки видны по прямой ссылке) — иначе их не показать на сайте. */
export const BLOB_ACCESS = (process.env.BLOB_ACCESS?.trim() === "private" ? "private" : "public") as
  | "public"
  | "private";

/**
 * Содержимое сайта (заявки с телефонами, токен бота, настройки) хранится
 * закрыто: у открытого хранилища адрес файла можно угадать, и тогда
 * `content/leads.json` читает кто угодно. Картинки остаются открытыми —
 * их нужно показывать на сайте.
 *
 * Если закрытый режим по какой-то причине недоступен, запись и чтение
 * возвращаются к прежнему открытому — сайт не ломается.
 */
const CONTENT_ACCESS = (process.env.BLOB_CONTENT_ACCESS?.trim() === "public" ? "public" : "private") as
  | "public"
  | "private";

export function cloudEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim());
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
 * Хранилище отдаёт файл через сеть доставки, и сразу после записи чтение
 * какое-то время возвращает предыдущую версию. Из-за этого два сохранения
 * подряд затирали друг друга: второе читало устаревшую копию. Поэтому мы
 * помним последнюю записанную версию и отдаём её, пока облако не догонит.
 */
const justWritten = new Map<string, { data: unknown; at: number }>();
const FRESH_WINDOW = 2 * 60 * 1000;

function recentWrite<T>(file: string): T | null {
  const recent = justWritten.get(file);
  if (!recent) return null;
  if (Date.now() - recent.at > FRESH_WINDOW) {
    justWritten.delete(file);
    return null;
  }
  return recent.data as T;
}

async function fetchCloud<T>(file: string): Promise<T | null> {
  const recent = recentWrite<T>(file);
  if (recent !== null) return recent;

  // сначала закрытый режим, потом прежний открытый — пока не все файлы
  // переписаны, часть может лежать ещё по-старому
  const order: Array<"public" | "private"> =
    CONTENT_ACCESS === "private" ? ["private", "public"] : ["public", "private"];

  for (const access of order) {
    try {
      const { get } = await import("@vercel/blob");
      // useCache: false — берём последнюю версию, а не копию из кэша сети
      const result = await get(`${PREFIX}/${file}`, { access, useCache: false });
      if (!result || result.statusCode !== 200) continue;

      const text = await new Response(result.stream).text();
      return JSON.parse(text) as T;
    } catch {
      // файла ещё нет в хранилище или режим недоступен — пробуем второй способ
    }
  }
  return null;
}

/**
 * Читает файл из облака. Результат кэшируется и сбрасывается после сохранения
 * из админки, поэтому лишних обращений к хранилищу нет.
 */
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
  const body = JSON.stringify(data, null, 2) + "\n";
  const options = {
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  } as const;

  try {
    await put(`${PREFIX}/${file}`, body, { ...options, access: CONTENT_ACCESS });
  } catch (error) {
    if (CONTENT_ACCESS === "public") throw error;
    // закрытый режим недоступен — не теряем правку, пишем как раньше
    await put(`${PREFIX}/${file}`, body, { ...options, access: "public" });
  }
}

export async function writeStored(file: string, data: unknown) {
  if (cloudEnabled()) {
    await writeCloud(file, data);
    justWritten.set(file, { data, at: Date.now() });
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
