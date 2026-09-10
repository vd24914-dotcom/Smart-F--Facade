import { storageIsWritable } from "@/content/store";

/**
 * Сайт на хостинге не может записывать файлы — для правок нужно хранилище.
 * Показываем это сразу, чтобы изменения не «терялись» молча.
 */
export default function ReadOnlyBanner() {
  if (storageIsWritable()) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-[14px] font-bold text-amber-900">Только просмотр</p>
      <p className="mt-1 text-[13px] leading-[20px] text-amber-900">
        Кнопка «Сохранить» здесь не сработает: к сайту не подключено хранилище. Откройте проект на
        Vercel → вкладка <b>Storage</b> → <b>Create Database</b> → <b>Blob</b>, подключите хранилище
        к проекту и нажмите <b>Redeploy</b>. После этого админка начнёт сохранять правки прямо
        отсюда, с любого компьютера или телефона.
      </p>
    </div>
  );
}
