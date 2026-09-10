import { inlineSvg } from "@/lib/inline-svg";
import SplashControl from "@/components/SplashControl";

/**
 * Загрузочный экран: логотип «чертится» линиями, затем проявляется целиком
 * и заставка уходит. Вся анимация на CSS, поэтому работает и до загрузки скриптов;
 * если картинку не удалось разобрать — заставки просто не будет.
 */
export default function SplashScreen({ logo }: { logo: string }) {
  const svg = inlineSvg(logo);
  if (!svg) return null;

  return (
    <>
      <div className="splash" aria-hidden>
        <div className="splash__logo">
          <div className="splash__line" dangerouslySetInnerHTML={{ __html: svg.outline }} />
          <div className="splash__fill" dangerouslySetInnerHTML={{ __html: svg.fill }} />
        </div>
        <div className="splash__bar">
          <span />
        </div>
      </div>
      <SplashControl />
    </>
  );
}
