import { redirect } from "next/navigation";

/** Раздел «Картинки» разделён по страницам сайта — отправляем в «Общее». */
export default function MediaRedirect() {
  redirect("/admin/general");
}
