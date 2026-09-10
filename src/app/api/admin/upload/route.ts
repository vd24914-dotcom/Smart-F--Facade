import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { isAuthenticated } from "@/lib/auth";
import { cloudEnabled, BLOB_ACCESS } from "@/content/storage";

const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const maxBytes = 8 * 1024 * 1024;

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

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
  }
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Можно загружать только PNG, JPG, WEBP, SVG или GIF" }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 400 });
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

  // На сервере файлы класть некуда — отправляем в облачное хранилище.
  if (cloudEnabled()) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${name}`, data, {
        access: BLOB_ACCESS,
        contentType: file.type,
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
    const dir = path.join(process.cwd(), "public", "uploads");
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

  return NextResponse.json({ url: `/uploads/${name}` });
}
