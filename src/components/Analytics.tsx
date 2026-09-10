import Script from "next/script";

/**
 * Счётчики посещаемости. Подключаются, только если в админке заполнен идентификатор,
 * поэтому на пустом сайте лишних запросов нет.
 */
export default function Analytics({
  googleId,
  yandexId,
}: {
  googleId: string;
  yandexId: string;
}) {
  const google = googleId.trim();
  const yandex = yandexId.trim().replace(/[^\d]/g, "");

  return (
    <>
      {google && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${google}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${google}');`}
          </Script>
        </>
      )}

      {yandex && (
        <>
          <Script id="ym-init" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<e.length;j++){if(e[j].src===r){return}}k=document.createElement(t),a=document.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document.scripts,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${yandex},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
          </Script>
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${yandex}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}
    </>
  );
}
