import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { applyChanges, type Change } from "@/lib/patch";
import {
  files,
  writeContent,
  readContentFresh,
  storageIsWritable,
  type ContentFile,
} from "@/content/store";

type Body = {
  file?: string;
  /** старый способ: весь файл целиком */
  data?: unknown;
  /** новый способ: только то, что человек изменил на этой странице */
  changes?: Change[];
};

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { file, data, changes } = (await request.json()) as Body;

  if (!file || !(file in files)) {
    return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });
  }
  if (data === undefined && !changes) {
    return NextResponse.json({ error: "Нет данных" }, { status: 400 });
  }

  if (!storageIsWritable()) {
    return NextResponse.json(
      {
        error:
          "Сохранять некуда: к сайту не подключено хранилище. " +
          "На Vercel откройте Storage → Create Database → Blob, подключите его к проекту и сделайте Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const key = file as ContentFile;

    if (changes) {
      // ничего не поменяли — не трогаем файл
      if (changes.length === 0) return NextResponse.json({ ok: true, changed: 0 });

      // берём самую свежую версию и накладываем только изменённые места,
      // чтобы правки из других разделов не пропали
      const current = await readContentFresh(key);
      await writeContent(key, applyChanges(current ?? {}, changes));
      revalidateTag("content");
      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true, changed: changes.length });
    }

    await writeContent(key, data);
    revalidateTag("content");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
