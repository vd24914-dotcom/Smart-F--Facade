import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { addLead, getIntegrations } from "@/content/store";
import { cloudEnabled, BLOB_ACCESS } from "@/content/storage";
import { isValidArea, isValidName, isValidPhone, normalizePhone } from "@/lib/validate";

/** Простая защита от спама: не больше 5 заявок за 10 минут с одного IP. */
const recent = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

const MAX_FILE = 15 * 1024 * 1024;

const allowedExt = [
  ".pdf", ".dwg", ".dxf", ".doc", ".docx", ".xls", ".xlsx",
  ".png", ".jpg", ".jpeg", ".webp", ".zip", ".rar", ".7z",
];

function tooMany(ip: string) {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  recent.set(ip, list);
  return list.length > LIMIT;
}

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function safeName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${Date.now()}-${base || "file"}${ext}`;
}

/** Кладёт чертёж в облако (или в public/uploads на своём компьютере). */
async function storeAttachment(file: File): Promise<{ url: string; name: string } | null> {
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExt.includes(ext)) return null;
  if (file.size === 0 || file.size > MAX_FILE) return null;

  const data = Buffer.from(await file.arrayBuffer());
  const name = safeName(file.name);

  if (cloudEnabled()) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`leads/${name}`, data, {
        access: BLOB_ACCESS,
        contentType: file.type || "application/octet-stream",
        addRandomSuffix: false,
      });
      return { url: blob.url, name: file.name };
    } catch (error) {
      console.error("Чертёж не удалось загрузить в хранилище:", error);
      return null;
    }
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), data);
    return { url: `/uploads/${name}`, name: file.name };
  } catch (error) {
    console.error("Чертёж не удалось сохранить:", error);
    return null;
  }
}

/** Возвращает true, если сообщение действительно ушло в телеграм. */
async function notifyTelegram(text: string) {
  const { telegram } = await getIntegrations();
  if (!telegram.enabled || !telegram.token || !telegram.chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegram.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegram.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  const type = request.headers.get("content-type") ?? "";
  let body: Record<string, unknown> = {};
  let attachment: { url: string; name: string } | null = null;
  let drawing: File | null = null;

  if (type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Не удалось прочитать форму" }, { status: 400 });
    }
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") body[key] = value;
    }
    const file = form.get("file");
    if (file instanceof File && file.size > 0) drawing = file;
  } else {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  // ловушка для ботов: скрытое поле должно оставаться пустым
  if (clean(body.company_url, 100) || clean(body.website, 100)) {
    return NextResponse.json({ ok: true });
  }
  // в старой форме ловушкой было поле «company» — там оно скрытое,
  // а в форме расчёта это обычное поле, поэтому различаем по источнику
  const source = clean(body.source, 60) || "form";
  const isCalc = source === "calc" || type.includes("multipart/form-data");
  if (!isCalc && clean(body.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 60);
  const area = clean(body.area, 40);

  // те же проверки, что и в форме: страницу можно обойти, этот код — нет
  if (!name || !phone) {
    return NextResponse.json({ error: "Укажите имя и телефон" }, { status: 400 });
  }
  if (!isValidName(name)) {
    return NextResponse.json({ error: "Укажите имя — минимум две буквы" }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Проверьте номер: нужен настоящий телефон, например +998 90 123-45-67" },
      { status: 400 }
    );
  }
  if (!isValidArea(area)) {
    return NextResponse.json({ error: "Площадь — число, например 1200" }, { status: 400 });
  }

  // Лимит считаем только по заявкам, прошедшим проверку: опечатка в телефоне
  // не должна отнимать у человека попытки.
  if (tooMany(ip)) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
  }

  // Чертёж кладём в хранилище последним — чтобы не писать файлы от ботов.
  if (drawing) {
    attachment = await storeAttachment(drawing);
    if (!attachment) {
      return NextResponse.json(
        { error: "Файл не подошёл: проверьте формат и размер (до 15 МБ)." },
        { status: 400 }
      );
    }
  }

  const details = isCalc
    ? (
        [
          ["Компания", clean(body.company, 160)],
          ["Тип объекта", clean(body.objectType, 120)],
          ["Площадь фасада, м²", area],
          ["Необходимый материал", clean(body.material, 160)],
          ["Стадия проекта", clean(body.stage, 120)],
        ] as [string, string][]
      )
        .filter(([, value]) => value)
        .map(([label, value]) => ({ label, value }))
    : [];

  const message =
    clean(body.message, 2000) ||
    details.map((item) => `${item.label}: ${item.value}`).join("\n");

  const draft = {
    name,
    phone: normalizePhone(phone),
    message,
    source,
    page: clean(body.page, 200),
    locale: clean(body.locale, 5) || "ru",
    ...(details.length ? { details } : {}),
    ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name } : {}),
  };

  // на хостинге без записи файлов заявка может только уйти в телеграм — это нормально,
  // но если не сработало ни то, ни другое, честно сообщаем об ошибке
  let saved = true;
  try {
    await addLead(draft);
  } catch (error) {
    saved = false;
    console.error("Заявку не удалось записать в файл:", error);
  }

  const lines = [
    `<b>${isCalc ? "Запрос расчёта — Smart Facade" : "Новая заявка — Smart Facade"}</b>`,
    `Имя: ${escape(draft.name)}`,
    `Телефон: ${escape(draft.phone)}`,
    ...details.map((item) => `${item.label}: ${escape(item.value)}`),
    ...(!isCalc && draft.message ? [`Комментарий: ${escape(draft.message)}`] : []),
    ...(attachment ? [`Файл: ${escape(attachment.name)}\n${attachment.url}`] : []),
    `Страница: ${escape(draft.page || "—")}`,
  ];

  const sent = await notifyTelegram(lines.join("\n"));

  if (!saved && !sent) {
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Позвоните нам, пожалуйста." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
