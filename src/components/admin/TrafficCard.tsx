import type { StatsContent } from "@/content/store";

function lastDays(days: StatsContent["days"], count: number) {
  const out: { key: string; label: string; views: number; visits: number }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const day = days[key] ?? { views: 0, visits: 0 };
    out.push({
      key,
      label: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      views: day.views,
      visits: day.visits,
    });
  }
  return out;
}

/** Простая посещаемость: просмотры страниц и визиты по дням. */
export default function TrafficCard({ stats }: { stats: StatsContent }) {
  const days = lastDays(stats.days, 14);
  const max = Math.max(1, ...days.map((d) => d.views));
  const sum = (key: "views" | "visits", n: number) =>
    days.slice(-n).reduce((acc, d) => acc + d[key], 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <h2 className="text-[16px] font-bold text-slate-900">Посещаемость</h2>
        <span className="text-[13px] text-slate-500">
          сегодня: <b className="text-slate-900">{sum("views", 1)}</b> просмотров /{" "}
          <b className="text-slate-900">{sum("visits", 1)}</b> визитов
        </span>
        <span className="text-[13px] text-slate-500">
          за 7 дней: <b className="text-slate-900">{sum("views", 7)}</b> /{" "}
          <b className="text-slate-900">{sum("visits", 7)}</b>
        </span>
      </div>

      <div className="mt-5 flex h-[120px] items-end gap-1.5">
        {days.map((day) => (
          <div key={day.key} className="group flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-slate-400 opacity-0 transition group-hover:opacity-100">
              {day.views}
            </span>
            <span
              className="w-full rounded-t bg-slate-900/80 transition group-hover:bg-slate-900"
              style={{ height: `${Math.max(3, (day.views / max) * 100)}%` }}
            />
            <span className="text-[10px] text-slate-400">{day.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[12px] text-slate-400">
        Считается на сервере проекта: просмотры страниц и визиты (один визит — одна сессия браузера).
      </p>
    </div>
  );
}
