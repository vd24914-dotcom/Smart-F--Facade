import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { files, readContentFresh, writeContent, type ContentFile } from "@/content/store";
import { cloudEnabled } from "@/content/storage";

/**
 * Перезаписывает все разделы содержимого, чтобы они легли в хранилище
 * закрыто. Нужно один раз: старые файлы были открыты по прямой ссылке,
 * а в них — телефоны из заявок и токен бота.
 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }
  if (!cloudEnabled()) {
    return NextResponse.json({ error: "Облачное хранилище не подключено" }, { status: 400 });
  }

  const done: string[] = [];
  const failed: string[] = [];

  for (const file of Object.keys(files) as ContentFile[]) {
    try {
      const data = await readContentFresh(file);
      if (data === null || data === undefined) continue;
      await writeContent(file, data);
      done.push(file);
    } catch {
      failed.push(file);
    }
  }

  revalidateTag("content");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: failed.length === 0, done, failed });
}
