import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Facade",
  description: "Фасадные материалы и решения",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Язык страницы приходит из middleware — так <html lang> совпадает с локалью URL
  const lang = (await headers()).get("x-locale") ?? "ru";

  return (
    <html lang={lang}>
      <head>
        {/* тот же смысл, что и color-scheme в CSS: запрещаем браузеру
            принудительно затемнять светлую тему */}
        <meta name="color-scheme" content="light dark" />
        {/* Сайт всегда открывается светлым. Тёмная тема включается только кнопкой
            и запоминается — системная тема Windows на это не влияет. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('sf-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
