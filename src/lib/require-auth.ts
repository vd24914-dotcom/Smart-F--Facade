import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/admin/login");
}
