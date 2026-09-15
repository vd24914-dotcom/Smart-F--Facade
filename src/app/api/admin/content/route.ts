import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { readContentFresh, files, type ContentFile } from "@/content/store";

/**
 * Выгрузка раздела содержимого как есть — для резервной копии и сверки.
 * Пример: /api/admin/content?file=texts
 */
export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const file = new URL(request.url).searchParams.get("file") as ContentFile | null;
  if (!file || !(file in files)) {
    return NextResponse.json(
      { error: `Укажите раздел: ${Object.keys(files).join(", ")}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ file, data: await readContentFresh(file) });
}
