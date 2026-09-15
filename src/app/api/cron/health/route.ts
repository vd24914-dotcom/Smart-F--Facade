import { NextResponse } from "next/server";
import { getIntegrations, getLeads, getSeo, getStats } from "@/content/store";
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
  const [seo, leads, stats] = await Promise.all([getSeo(), getLeads(), getStats()]);

  const report = await healthReport(siteOrigin(seo.siteUrl), {
    storageOk: storageIsWritable(),
    leads: leads.items,
    stats,
  });

  if (!telegram.enabled || !telegram.token || !telegram.healthEnabled) {
    return NextResponse.json({ ok: report.ok, sent: false });
  }

  const results = await sendTelegramAll(telegram, report.text);
  return NextResponse.json({ ok: report.ok, sent: results.some((item) => item.ok) });
}
