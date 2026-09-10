import fs from "node:fs";
import path from "node:path";

const cache = new Map<string, { outline: string; fill: string } | null>();

const SHAPES = "path|circle|rect|polygon|polyline|ellipse|line";

/**
 * Читает SVG из public/ и готовит две версии: контур для «черчения»
 * и обычную заливку. Файл читается один раз и остаётся в памяти.
 */
export function inlineSvg(src: string): { outline: string; fill: string } | null {
  if (!src || !src.startsWith("/") || !src.toLowerCase().endsWith(".svg")) return null;
  if (cache.has(src)) return cache.get(src) ?? null;

  try {
    const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    // не выпускаем чтение за пределы public/
    const root = path.join(process.cwd(), "public");
    if (!file.startsWith(root)) throw new Error("вне public");

    const raw = fs.readFileSync(file, "utf8");

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
