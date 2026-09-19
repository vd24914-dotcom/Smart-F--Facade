import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import type { HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth";
import { cloudEnabled, BLOB_ACCESS } from "@/content/storage";

const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const maxBytes = 12 * 1024 * 1024;

/** Документы для карточек «Документы и сертификаты» — их можно открыть с сайта. */
const docExt = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"];
const docTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const docMaxBytes = 20 * 1024 * 1024;

function safeName(name: string) {
  const ext = path.extname(name).toLowerCase() || ".png";
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${Date.now()}-${base || "image"}${ext}`;
}

/** Админке нужно знать, идёт ли файл в облако напрямую и с каким доступом. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }
  return NextResponse.json({ cloud: cloudEnabled(), access: BLOB_ACCESS });
}

/**
 * Прямая загрузка в хранилище: браузер просит разрешение, мы проверяем вход,
 * тип и размер, а сам файл до сервера не доезжает — так снимается лимит
 * Vercel в 4,5 МБ на тело запроса.
 */
async function clientUpload(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  // разрешение выписываем только вошедшему; отчёт о готовности присылает само хранилище
  if (body.type === "blob.generate-client-token" && !(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  try {
    const { handleUpload } = await import("@vercel/blob/client");
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const isDoc = clientPayload === "doc";
        if (!pathname.startsWith(isDoc ? "docs/" : "uploads/")) {
          throw new Error("Файл можно положить только в папку загрузок");
        }
        if (isDoc && !docExt.includes(path.extname(pathname).toLowerCase())) {
          throw new Error("Можно загружать PDF, DOC, DOCX, XLS, XLSX, PNG или JPG");
        }
        return {
          allowedContentTypes: isDoc ? docTypes : allowed.filter((type) => type !== "image/svg+xml"),
          maximumSizeInBytes: isDoc ? docMaxBytes : maxBytes,
          addRandomSuffix: false,
          tokenPayload: clientPayload ?? "",
        };
      },
      onUploadCompleted: async () => {
        // адрес файла админка получает сразу из ответа хранилища — здесь делать нечего
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  // JSON — это переговоры о прямой загрузке в облако; форма — файл через сервер
  if (!(request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    return clientUpload(request);
  }

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
  }

  // kind=doc — документ (PDF и т.п.), иначе картинка
  const isDoc = form.get("kind") === "doc";

  if (isDoc) {
    if (!docExt.includes(path.extname(file.name).toLowerCase())) {
      return NextResponse.json(
        { error: "Можно загружать PDF, DOC, DOCX, XLS, XLSX, PNG или JPG" },
        { status: 400 }
      );
    }
    if (file.size > docMaxBytes) {
      return NextResponse.json({ error: "Файл больше 20 МБ" }, { status: 400 });
    }
  } else {
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Можно загружать только PNG, JPG, WEBP, SVG или GIF" }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Файл больше 12 МБ" }, { status: 400 });
    }
  }

  let data = Buffer.from(await file.arrayBuffer());

  // SVG чистим: убираем скрипты, обработчики событий и внешние ссылки
  if (file.type === "image/svg+xml") {
    const svg = data
      .toString("utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");
    data = Buffer.from(svg, "utf8");
  }

  const name = safeName(file.name);
  const folder = isDoc ? "docs" : "uploads";

  // На сервере файлы класть некуда — отправляем в облачное хранилище.
  if (cloudEnabled()) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`${folder}/${name}`, data, {
        access: BLOB_ACCESS,
        contentType: file.type || "application/octet-stream",
        addRandomSuffix: false,
      });
      return NextResponse.json({ url: blob.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить файл";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // На своём компьютере — как раньше, в папку public/uploads
  try {
    const dir = path.join(process.cwd(), "public", folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), data);
  } catch {
    return NextResponse.json(
      {
        error:
          "Картинку некуда положить: к сайту не подключено хранилище. " +
          "На Vercel откройте Storage → Create Database → Blob, подключите его к проекту и сделайте Redeploy.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ url: `/${folder}/${name}` });
}
