import { NextResponse } from "next/server";
import { getIntegrations, getLeads, getSeo, getStats, saveTelegram } from "@/content/store";
import { storageIsWritable } from "@/content/storage";
import { siteOrigin } from "@/data/seo";
import { healthReport } from "@/lib/report";
import { sendTelegramAll } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Чтобы случайный запрос снаружи не сыпал сообщениями чаще раза в пять минут. */
let lastRun = 0;

function allowed(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  // без своего ключа доверяем метке планировщика Vercel
  return /vercel-cron/i.test(request.headers.get("user-agent") ?? "");
}

export async function GET(request: Request) {
  if (!allowed(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (Date.now() - lastRun < 5 * 60 * 1000) {
    return NextResponse.json({ ok: true, skipped: "слишком часто" });
  }
  lastRun = Date.now();

  const { telegram } = await getIntegrations();

  /**
   * Планировщик будит нас дважды в сутки, а как часто слать отчёт — решает
   * настройка в админке. Час запаса нужен, чтобы дрожание расписания не
   * сдвигало отчёт на сутки вперёд: запуск в 09:00:02 при прошлой отправке
   * в 09:00:05 иначе не дотянул бы до ровных 48 часов.
   */
  const hours = telegram.healthHours;
  const due = Date.now() - telegram.healthAt >= (hours - 1) * 60 * 60 * 1000;

  if (!due) {
    return NextResponse.json({ ok: true, skipped: `следующий отчёт раз в ${hours} ч` });
  }

  const [seo, leads, stats] = await Promise.all([getSeo(), getLeads(), getStats()]);

  const report = await healthReport(siteOrigin(seo.siteUrl), {
    storageOk: storageIsWritable(),
    leads: leads.items,
    stats,
    hours,
  });

  if (!telegram.enabled || !telegram.token || !telegram.healthEnabled) {
    return NextResponse.json({ ok: report.ok, sent: false });
  }

  const results = await sendTelegramAll(telegram, report.text);
  const sent = results.some((item) => item.ok);

  // отметку ставим только при доставке: не дошло — попробуем в следующий запуск
  if (sent) await saveTelegram({ healthAt: Date.now() });

  return NextResponse.json({ ok: report.ok, sent, hours });
}
