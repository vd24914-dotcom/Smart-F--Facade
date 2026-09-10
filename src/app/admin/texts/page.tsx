import { redirect } from "next/navigation";

/** Раздел «Тексты» разделён по страницам сайта — отправляем на «Главную». */
export default function TextsRedirect() {
  redirect("/admin/home");
}
