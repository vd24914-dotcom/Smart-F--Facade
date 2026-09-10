import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // разрешаем SVG-логотипы; файлы отдаются в песочнице, скрипты внутри не выполняются
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
