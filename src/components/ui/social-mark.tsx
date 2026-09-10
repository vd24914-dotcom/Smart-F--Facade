import Image from "next/image";
import { Camera, Globe, MessageCircle, Play, Send } from "lucide-react";
import type { SocialLink } from "@/data/socials";

/**
 * Значок соцсети. Если в админке загрузили свою картинку — показываем её,
 * иначе рисуем простой значок, подобранный по названию ссылки.
 */
function fallbackIcon(social: SocialLink) {
  const key = `${social.label} ${social.url}`.toLowerCase();
  if (key.includes("whatsapp") || key.includes("wa.me")) return MessageCircle;
  if (key.includes("telegram") || key.includes("t.me")) return Send;
  if (key.includes("instagram")) return Camera;
  if (key.includes("youtube") || key.includes("tiktok") || key.includes("rutube")) return Play;
  return Globe;
}

export default function SocialMark({
  social,
  className = "size-5",
}: {
  social: SocialLink;
  className?: string;
}) {
  if (social.icon?.trim()) {
    return (
      <Image
        src={social.icon}
        alt=""
        width={48}
        height={48}
        className={`${className} object-contain`}
      />
    );
  }

  const Icon = fallbackIcon(social);
  return <Icon className={className} aria-hidden />;
}
