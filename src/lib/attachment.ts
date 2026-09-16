import fs from "node:fs/promises";
import path from "node:path";
import { cloudEnabled, BLOB_ACCESS } from "@/content/storage";

/** 15 МБ — столько же принимает форма на сайте. */
export const MAX_LEAD_FILE = 15 * 1024 * 1024;

export const leadFileExt = [
  ".pdf", ".dwg", ".dxf", ".doc", ".docx", ".xls", ".xlsx",
  ".png", ".jpg", ".jpeg", ".webp", ".zip", ".rar", ".7z",
];

/** Имя файла без кириллицы и пробелов — по такому адресу его точно откроют. */
export function safeName(name: string) {
  const ext = path.extname(name).toLowerCase() || ".bin";
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${Date.now()}-${base || "file"}${ext}`;
}

/**
 * Кладёт приложенный чертёж туда же, куда его кладёт форма на сайте:
 * в облако на хостинге, в public/uploads на своём компьютере.
 * Возвращает null, если формат или размер не подошли.
 */
export async function storeLeadFile(
  data: Uint8Array,
  originalName: string,
  contentType = "application/octet-stream"
): Promise<{ url: string; name: string } | null> {
  const ext = path.extname(originalName).toLowerCase();
  if (!leadFileExt.includes(ext)) return null;
  if (data.byteLength === 0 || data.byteLength > MAX_LEAD_FILE) return null;

  const name = safeName(originalName);

  if (cloudEnabled()) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`leads/${name}`, Buffer.from(data), {
        access: BLOB_ACCESS,
        contentType,
        addRandomSuffix: false,
      });
      return { url: blob.url, name: originalName };
    } catch (error) {
      console.error("Чертёж не удалось загрузить в хранилище:", error);
      return null;
    }
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(data));
    return { url: `/uploads/${name}`, name: originalName };
  } catch (error) {
    console.error("Чертёж не удалось сохранить:", error);
    return null;
  }
}
