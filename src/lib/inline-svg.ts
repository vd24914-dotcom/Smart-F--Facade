import fs from "node:fs";
import path from "node:path";

const cache = new Map<string, { outline: string; fill: string } | null>();

const SHAPES = "path|circle|rect|polygon|polyline|ellipse|line";

async function download(url: string) {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("не удалось скачать");
  return res.text();
}

/** Адрес самого сайта — нужен, чтобы дочитать файл из public/ уже с сервера. */
function ownOrigin(): string | null {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  const current = process.env.VERCEL_URL?.trim();
  if (current) return `https://${current.replace(/^https?:\/\//, "")}`;
  return null;
}

/** Читает файл из папки public/. На сервере её рядом с кодом может не быть. */
function readPublic(src: string) {
  const root = path.join(process.cwd(), "public");
  const file = path.join(root, src.replace(/^\//, ""));
  // не выпускаем чтение за пределы public/
  if (!file.startsWith(root)) throw new Error("вне public");
  return fs.readFileSync(file, "utf8");
}

/**
 * Готовит из SVG две версии: контур для «черчения» и обычную заливку.
 * Файл читается один раз и остаётся в памяти.
 *
 * Картинка может лежать в трёх местах, и все три поддерживаются:
 * в папке public/, в облачном хранилище (полная ссылка) и — на сервере,
 * где папки public/ рядом с кодом нет, — на самом сайте по своему адресу.
 */
export async function inlineSvg(src: string): Promise<{ outline: string; fill: string } | null> {
  if (!src || !src.toLowerCase().endsWith(".svg")) return null;
  const remote = /^https?:\/\//i.test(src);
  if (!remote && !src.startsWith("/")) return null;
  if (cache.has(src)) return cache.get(src) ?? null;

  try {
    let raw: string;

    if (remote) {
      // логотип, загруженный через админку, лежит в облачном хранилище
      raw = await download(src);
    } else {
      try {
        raw = readPublic(src);
      } catch {
        // на хостинге папка public/ отдаётся отдельно и функции недоступна —
        // забираем тот же файл по адресу сайта
        const origin = ownOrigin();
        if (!origin) throw new Error("нет адреса сайта");
        raw = await download(`${origin}${src}`);
      }
    }

    const body = raw
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      // DOCTYPE из редакторов вроде CorelDRAW нельзя вставлять внутрь страницы
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/(<svg[^>]*?)\swidth="[^"]*"/i, "$1")
      .replace(/(<svg[^>]*?)\sheight="[^"]*"/i, "$1");

    // pathLength="1" делает длину каждой линии единицей — так штрихи чертятся ровно
    const outline = body.replace(new RegExp(`<(${SHAPES})\\b`, "g"), '<$1 pathLength="1"');

    const result = { outline, fill: body };
    cache.set(src, result);
    return result;
  } catch {
    cache.set(src, null);
    return null;
  }
}
