import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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
          "Сохранять некуда: к сайту не подключено хранилище. " +
          "На Vercel откройте Storage → Create Database → Blob, подключите его к проекту и сделайте Redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    await writeContent(file as ContentFile, data);
    // Сбрасываем кэш содержимого и страниц сайта, чтобы правки были видны сразу
    revalidateTag("content");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
