import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { files, writeContent, storageIsWritable, type ContentFile } from "@/content/store";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const { file, data } = (await request.json()) as { file?: string; data?: unknown };

  if (!file || !(file in files)) {
    return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });
  }
  if (data === undefined) {
    return NextResponse.json({ error: "Нет данных" }, { status: 400 });
  }

  if (!storageIsWritable()) {
    return NextResponse.json(
      {
        error:
          "Сайт открыт на хостинге, который не разрешает сохранять файлы. " +
          "Правьте содержимое в админке на своём компьютере и отправляйте изменения на GitHub.",
      },
      { status: 503 }
    );
  }

  try {
    writeContent(file as ContentFile, data);
    // Сбрасываем кэш страниц сайта, чтобы правки были видны сразу
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
