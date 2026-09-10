import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // картинки, загруженные через админку, лежат в облачном хранилище Vercel
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
    // разрешаем SVG-логотипы; файлы отдаются в песочнице, скрипты внутри не выполняются
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
