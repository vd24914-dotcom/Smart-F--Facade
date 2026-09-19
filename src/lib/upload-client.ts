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

/** Столько сервер Vercel принимает за один запрос — с небольшим запасом. */
const SERVER_LIMIT = 4 * 1024 * 1024;

/**
 * Ужимает фотографию, чтобы она прошла через сервер: уменьшает до 2200 px по
 * длинной стороне и сохраняет в JPEG, при необходимости снижая качество.
 * Маленькие файлы и SVG не трогаем.
 */
async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SERVER_LIMIT || !/^image\/(png|jpe?g|webp)$/i.test(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const quality = Math.max(0.55, 0.88 - attempt * 0.08);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= SERVER_LIMIT) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
    scale *= 0.8;
  }
  throw new Error("Не удалось уменьшить картинку до 4 МБ — попробуйте файл поменьше.");
}

async function viaServer(file: File, kind: UploadKind) {
  if (kind === "image") {
    file = await shrinkImage(file);
  } else if (file.size > SERVER_LIMIT) {
    throw new Error(
      "Файл тяжелее 4 МБ, а прямая загрузка в хранилище недоступна. Добавьте в Vercel переменную " +
        "BLOB_READ_WRITE_TOKEN (Storage → Blob → Settings → Tokens) и сделайте Redeploy — или уменьшите файл."
    );
  }

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

  try {
    const { upload } = await import("@vercel/blob/client");
    const folder = kind === "doc" ? "docs" : "uploads";
    const blob = await upload(`${folder}/${safeName(file.name)}`, file, {
      access: config.access,
      handleUploadUrl: "/api/admin/upload",
      clientPayload: kind,
      contentType: file.type || undefined,
    });
    return blob.url;
  } catch {
    // разрешение не выписалось (нет ключа, сеть) — идём прежним путём через сервер
    return viaServer(file, kind);
  }
}
