export default function StatCard({
  title,
  value,
  subtext,
  trend,
  trendType = "neutral",
  icon: Icon,
  color = "blue",
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      accent: "from-blue-600 to-indigo-600",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      accent: "from-amber-500 to-orange-600",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "from-emerald-600 to-teal-600",
    },
    purple: {
      bg: "bg-purple-50 text-purple-600",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      accent: "from-purple-600 to-pink-600",
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  const trendBadgeStyle =
    trendType === "positive"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : trendType === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {title}
          </p>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${scheme.bg}`}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">{subtext}</span>
        {trend && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${trendBadgeStyle}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

