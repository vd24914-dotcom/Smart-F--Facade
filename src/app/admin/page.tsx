import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { getProjects, getPartners, getLeads, getStats } from "@/content/store";
import { navGroups } from "@/components/admin/nav-data";
import PasswordCard from "@/components/admin/PasswordCard";
import TrafficCard from "@/components/admin/TrafficCard";

/** Короткое пояснение к каждому разделу — что там правится. */
const about: Record<string, string> = {
  "/admin/leads": "Все обращения с сайта: телефон, комментарий, статус. Выгрузка в CSV.",
  "/admin/telegram": "Бот, уведомления о заявках и отчёт о состоянии сайта.",
  "/admin/home": "Первый экран, материалы, опыт группы, документы, форма заявки.",
  "/admin/about": "Текст о компании с фото и преимущества.",
  "/admin/services": "Услуги с иконками и текст страницы «Услуги».",
  "/admin/projects": "Объекты: фото, фильтры, описание, характеристики, SEO.",
  "/admin/partners": "Логотипы представителей и партнёров.",
  "/admin/contacts": "Разделы на странице контактов и тексты формы.",
  "/admin/general": "Меню, логотипы, подвал, телефоны и соцсети.",
  "/admin/seo": "Заголовки и описания для поиска, счётчики, подтверждение сайта.",
};

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAuth();

  const projects = await getProjects();
  const { items: leads } = await getLeads();
  const traffic = await getStats();
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const { representatives, partners } = await getPartners();

  const stats = [
    { label: "Новых заявок", value: newLeads, href: "/admin/leads", accent: newLeads > 0 },
    { label: "Всего заявок", value: leads.length, href: "/admin/leads" },
    { label: "Проектов", value: projects.length, href: "/admin/projects" },
    { label: "Логотипов", value: representatives.length + partners.length, href: "/admin/partners" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.2px] text-slate-900">Обзор</h1>
        <p className="mt-1 text-[14px] leading-[21px] text-slate-500">
          Разделы справа. Правки появляются на сайте сразу после кнопки «Сохранить».
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:border-slate-400 ${
              stat.accent ? "border-navy/40" : "border-slate-200/80"
            }`}
          >
            <div className={`text-[28px] font-extrabold leading-none ${stat.accent ? "text-navy" : "text-slate-900"}`}>
              {stat.value}
            </div>
            <div className="mt-2 text-[13px] text-slate-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <TrafficCard stats={traffic} />

      {navGroups
        .filter((group) => group.items.some((item) => about[item.href]))
        .map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{group.title}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items
                .filter((item) => about[item.href])
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-400"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-navy">
                      <item.icon className="size-5" strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-slate-900">{item.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-[19px] text-slate-500">{about[item.href]}</span>
                    </span>
                    <ArrowRight
                      className="mt-2.5 size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                ))}
            </div>
          </section>
        ))}

      <div className="max-w-[720px]">
        <PasswordCard />
      </div>
    </div>
  );
}
