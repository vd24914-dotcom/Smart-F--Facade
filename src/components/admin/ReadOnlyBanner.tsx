import { storageIsWritable } from "@/content/store";

/**
 * На хостингах вроде Vercel сайт не может записывать файлы.
 * Показываем это сразу, чтобы правки не «терялись» молча.
 */
export default function ReadOnlyBanner() {
  if (storageIsWritable()) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-[14px] font-bold text-amber-900">Только просмотр</p>
      <p className="mt-1 text-[13px] leading-[20px] text-amber-900">
        Этот сервер не разрешает сайту сохранять файлы, поэтому кнопка «Сохранить» здесь не
        сработает. Правьте содержимое в админке на своём компьютере и отправляйте изменения на
        GitHub — сайт обновится сам.
      </p>
    </div>
  );
}
