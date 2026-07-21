import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

interface MonthEntry {
  period: string;
  newListings: number | null;
  homesSold: number | null;
  daysOnMarket: number | null;
  medianPrice: number | null;
  activeListings: number | null;
}

interface TownSeasonality {
  name: string;
  months: MonthEntry[];
}

type SeasonalityDB = Record<string, TownSeasonality>;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ACCENT = '#6366a3'; // muted indigo

function findData(slug: string, db: SeasonalityDB): TownSeasonality | null {
  if (db[slug]) return db[slug];
  const stripped = slug.replace(/-[a-z]+$/, '');
  if (db[stripped]) return db[stripped];
  return null;
}

interface Props {
  townSlug: string;
  saleToList?: number;
}

export default function MarketIntelligence({ townSlug, saleToList }: Props) {
  const [db, setDb] = useState<SeasonalityDB | null>(null);
  const [selectedYear, setSelectedYear] = useState<2024 | 2025>(2025);

  useEffect(() => {
    import('../data/njSeasonality.json').then(mod => {
      setDb(mod.default as SeasonalityDB);
    });
  }, []);

  const townData = useMemo(() => (db ? findData(townSlug, db) : null), [db, townSlug]);

  const byYear = useMemo(() => {
    if (!townData) return null;
    const y2024: (MonthEntry | null)[] = Array(12).fill(null);
    const y2025: (MonthEntry | null)[] = Array(12).fill(null);
    townData.months.forEach(m => {
      const [year, month] = m.period.split('-').map(Number);
      if (year === 2024) y2024[month - 1] = m;
      if (year === 2025) y2025[month - 1] = m;
    });
    return { y2024, y2025 };
  }, [townData]);

  const insights = useMemo(() => {
    if (!byYear) return null;
    const { y2024, y2025 } = byYear;

    const avgListings = MONTHS.map((_, i) => {
      const vals = [y2024[i]?.newListings, y2025[i]?.newListings].filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    });

    const avgDom = MONTHS.map((_, i) => {
      const vals = [y2024[i]?.daysOnMarket, y2025[i]?.daysOnMarket].filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    });

    const validListings = avgListings.filter((v): v is number => v != null);
    const validDom = avgDom.filter((v): v is number => v != null);
    if (!validListings.length || !validDom.length) return null;

    const peakListings = Math.max(...validListings);
    const avgDomOverall = validDom.reduce((a, b) => a + b) / validDom.length;

    const scored = MONTHS.map((label, i) => {
      const l = avgListings[i];
      const d = avgDom[i];
      if (l == null || d == null) return null;
      return { label, idx: i, listings: l, dom: d, score: (l / peakListings) * 0.5 + (d / (avgDomOverall || 1)) * 0.5 };
    }).filter((v): v is NonNullable<typeof v> => v != null);

    const buyerWindow = [...scored].sort((a, b) => b.score - a.score).slice(0, 3).sort((a, b) => a.idx - b.idx);
    const peakSeason = [...scored].sort((a, b) => b.listings - a.listings).slice(0, 3).sort((a, b) => a.idx - b.idx);

    return { peakListings, buyerWindow, peakSeason };
  }, [byYear]);

  if (!townData || !byYear || !insights) return null;

  const activeMonths = selectedYear === 2024 ? byYear.y2024 : byYear.y2025;
  const CHART_H = 110;
  const maxVal = Math.max(...activeMonths.map(m => m?.newListings ?? 0), 1);

  const heatLabel = saleToList
    ? saleToList >= 105 ? 'Hot 🔥' : saleToList >= 102 ? 'Warm ↗' : 'Cool ↘'
    : null;

  const latestDom = [...byYear.y2025].reverse().find(m => m?.daysOnMarket != null)?.daysOnMarket ?? null;

  const buyerWindowLabel = insights.buyerWindow.length === 3 && insights.buyerWindow[2].idx - insights.buyerWindow[0].idx <= 3
    ? `${insights.buyerWindow[0].label} – ${insights.buyerWindow[2].label}`
    : insights.buyerWindow.map(m => m.label).join(', ');

  return (
    <div className="rounded-2xl p-6" style={{ border: `1px solid ${ACCENT}30` }}>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
          <TrendingUp size={20} />
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900">When to Buy</h2>
      </div>

      {/* Current snapshot row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${saleToList && saleToList >= 105 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Right Now</div>
          <div className={`text-xl font-bold ${saleToList && saleToList >= 105 ? 'text-indigo-800' : 'text-slate-900'}`}>
            {heatLabel ?? '—'}
          </div>
          {saleToList && <div className="text-[13px] text-slate-400 font-mono mt-0.5">{saleToList}% sale-to-list</div>}
        </div>

        <div className="p-4 rounded-xl border bg-slate-50 border-slate-100">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Days on Market</div>
          <div className="text-xl font-bold text-slate-900">{latestDom ?? '—'}</div>
          <div className="text-[13px] text-slate-400 font-mono mt-0.5">median days, recent</div>
        </div>

        <div className="p-4 rounded-xl border bg-slate-50 border-slate-100">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Peak Season</div>
          <div className="text-base font-bold text-slate-900">{insights.peakSeason.map(m => m.label).join(' · ')}</div>
          <div className="text-[13px] text-slate-400 font-mono mt-0.5">most homes listed</div>
        </div>
      </div>

      {/* Chart header with year toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-mono text-slate-400 uppercase tracking-wider">New Listings by Month</p>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {([2024, 2025] as const).map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1 rounded-md text-[13px] font-mono font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end gap-1 w-full" style={{ height: CHART_H + 32 }}>
          {MONTHS.map((label, i) => {
            const val = activeMonths[i]?.newListings ?? null;
            const barH = val != null ? Math.max(3, (val / maxVal) * CHART_H) : 2;
            const isBuyer = insights.buyerWindow.some(m => m.idx === i);

            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative flex items-end w-full justify-center" style={{ height: CHART_H }}>
                  {/* Best window dot */}
                  {isBuyer && (
                    <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-10" style={{ bottom: barH + 6, backgroundColor: ACCENT }} />
                  )}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 font-bold text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-sm"
                    style={{ bottom: isBuyer ? barH + 18 : barH + 4 }}
                  >
                    {val ?? '—'}
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-colors duration-150 group-hover:opacity-80"
                    style={{
                      height: barH,
                      backgroundColor: isBuyer ? ACCENT : `${ACCENT}45`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400 group-hover:text-slate-700 transition-colors">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: `${ACCENT}45` }} />
          <span className="text-sm font-mono text-slate-400">All months</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: ACCENT }} />
          <span className="text-sm font-mono text-slate-600">Best buyer window — good supply · homes sitting longest</span>
        </div>
      </div>

      {/* Insight callout */}
      {insights.buyerWindow.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-indigo-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-800 mb-1">
                Start your search: {buyerWindowLabel}
              </div>
              <div className="text-[13px] font-mono text-slate-500 leading-relaxed">
                Not just when the most homes list — but when inventory is solid <span className="font-semibold text-slate-600">and</span> homes are sitting on the market longer than average. Less frenzy, more leverage.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
