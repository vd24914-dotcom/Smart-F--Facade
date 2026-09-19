/**
 * Загрузка файлов из админки.
 *
 * На Vercel сервер не принимает тела больше 4,5 МБ — большой скан или фото
 * возвращались с ошибкой «Request Entity Too Large». Поэтому в облаке файл
 * уходит из браузера прямо в хранилище: сервер лишь выписывает разрешение.
 * На своём компьютере (без облака) и для SVG, которые сервер чистит от
 * скриптов, остаётся прежний путь через /api/admin/upload.
 */

export type UploadKind = "image" | "doc";

type UploadConfig = { cloud: boolean; access: "public" | "private" };

const fallback: UploadConfig = { cloud: false, access: "public" };

let configPromise: Promise<UploadConfig> | null = null;

function getConfig(): Promise<UploadConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/admin/upload", { cache: "no-store" })
      .then(async (res): Promise<UploadConfig> => {
        if (!res.ok) return fallback;
        const json = (await res.json()) as Partial<UploadConfig>;
        return { cloud: json.cloud === true, access: json.access === "private" ? "private" : "public" };
      })
      .catch(() => fallback);
  }
  return configPromise;
}

/** Имя файла в хранилище: латиница, дефисы и отметка времени, чтобы не перезаписать чужое. */
export function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = (dot >= 0 ? name.slice(dot) : ".png").toLowerCase();
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${Date.now()}-${base || "file"}${ext}`;
}

async function viaServer(file: File, kind: UploadKind) {
  const body = new FormData();
  body.append("file", file);
  if (kind === "doc") body.append("kind", "doc");
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const text = await res.text();

  let json: { url?: string; error?: string } = {};
  try {
    json = JSON.parse(text);
  } catch {
    // сервер ответил не JSON — обычно это ограничение платформы на размер тела
    throw new Error(
      res.status === 413
        ? "Файл слишком большой для загрузки через сервер (до 4,5 МБ). Подключите хранилище Vercel Blob — тогда лимит снимается."
        : `Сервер ответил ошибкой: ${text.slice(0, 80) || res.status}`
    );
  }
  if (!res.ok || !json.url) throw new Error(json.error || "Не удалось загрузить");
  return json.url;
}

/** Загружает файл и возвращает его адрес. */
export async function uploadFile(file: File, kind: UploadKind = "image"): Promise<string> {
  const svg = file.type === "image/svg+xml";
  const config = await getConfig();

  if (!config.cloud || svg) return viaServer(file, kind);

  const { upload } = await import("@vercel/blob/client");
  const folder = kind === "doc" ? "docs" : "uploads";
  const blob = await upload(`${folder}/${safeName(file.name)}`, file, {
    access: config.access,
    handleUploadUrl: "/api/admin/upload",
    clientPayload: kind,
    contentType: file.type || undefined,
  });
  return blob.url;
}
