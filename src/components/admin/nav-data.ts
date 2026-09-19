import {
  Building2,
  FileText,
  Handshake,
  Home,
  Inbox,
  LayoutDashboard,
  MapPin,
  Search,
  Send,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Разделы админки, сгруппированные по смыслу: работа, страницы сайта, настройки.
 * Лежат отдельно от компонентов, чтобы их могла читать и серверная страница «Обзор».
 */
export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Работа",
    items: [
      { href: "/admin", label: "Обзор", icon: LayoutDashboard },
      { href: "/admin/leads", label: "Заявки", icon: Inbox },
      { href: "/admin/telegram", label: "Телеграм", icon: Send },
    ],
  },
  {
    title: "Страницы сайта",
    items: [
      { href: "/admin/home", label: "Главная", icon: Home },
      { href: "/admin/about", label: "О нас", icon: Building2 },
      { href: "/admin/services", label: "Услуги", icon: Wrench },
      { href: "/admin/projects", label: "Проекты", icon: FileText },
      { href: "/admin/partners", label: "Партнёры", icon: Handshake },
      { href: "/admin/contacts", label: "Контакты", icon: MapPin },
    ],
  },
  {
    title: "Настройки",
    items: [
      { href: "/admin/general", label: "Общее", icon: Settings },
      { href: "/admin/seo", label: "SEO", icon: Search },
    ],
  },
];

export const isActivePath = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
