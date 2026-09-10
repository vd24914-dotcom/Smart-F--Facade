import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { getProjects, getPartners, getContacts, getLeads, getStats } from "@/content/store";
import PasswordCard from "@/components/admin/PasswordCard";
import TrafficCard from "@/components/admin/TrafficCard";

const cards = [
  { href: "/admin/leads", title: "Заявки", text: "Все обращения с сайта: телефон, комментарий, статус. Выгрузка в CSV и уведомления в телеграм." },
  { href: "/admin/general", title: "Общее", text: "Меню, логотипы, подвал, телефоны и соцсети — то, что видно на каждой странице." },
  { href: "/admin/home", title: "Главная", text: "Первый экран, цифры, блок «О нас», заголовки блоков и форма заявки. Текст и фото каждого блока рядом." },
  { href: "/admin/about", title: "О нас", text: "Текст о компании с фото и преимущества: иконка, заголовок и описание в одной карточке." },
  { href: "/admin/services", title: "Услуги", text: "Названия услуг вместе с их иконками и текст страницы «Услуги»." },
  { href: "/admin/projects", title: "Проекты", text: "Добавить, изменить или удалить объект: фото, фильтры, описание, характеристики, SEO." },
  { href: "/admin/partners", title: "Партнёры", text: "Логотипы представителей и партнёров: добавить, заменить, переставить." },
  { href: "/admin/beforeafter", title: "До / После", text: "Пары фотографий объекта до и после работ." },
  { href: "/admin/contacts", title: "Контакты", text: "Разделы на странице контактов и тексты формы заявки." },
  { href: "/admin/seo", title: "SEO", text: "Заголовки и описания страниц для поиска, картинка для соцсетей, счётчики и подтверждение сайта." },
];

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAuth();

  const projects = await getProjects();
  const { items: leads } = await getLeads();
  const traffic = await getStats();
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const { representatives, partners } = await getPartners();
  const { blocks } = await getContacts();

  const stats = [
    { label: "Новых заявок", value: newLeads },
    { label: "Всего заявок", value: leads.length },
    { label: "Проектов", value: projects.length },
    { label: "Логотипов представителей", value: representatives.length },
    { label: "Логотипов партнёров", value: partners.length },
    { label: "Разделов в контактах", value: blocks.length },
  ];

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-slate-900">Что можно менять</h1>
      <p className="mt-1 text-[14px] text-slate-500">
        Правки сохраняются в файлы проекта и появляются на сайте сразу после кнопки «Сохранить».
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[26px] font-extrabold text-slate-900">{stat.value}</div>
            <div className="text-[13px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <TrafficCard stats={traffic} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-900"
          >
            <h2 className="text-[16px] font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-[13px] leading-[20px] text-slate-600">{card.text}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 max-w-[720px]">
        <PasswordCard />
      </div>
    </div>
  );
}
