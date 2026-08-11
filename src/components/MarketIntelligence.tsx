import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'; // useRef/useCallback used by PriceTrendChart
import { Calendar, TrendingUp, TrendingDown, AlertCircle, Minus } from 'lucide-react';

const ACCENT = '#6366a3';

function fmtPrice(p: number) {
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  return `$${Math.round(p / 1000)}k`;
}

export function PriceTrendChart({ townSlug, color = '#166534' }: { townSlug: string; color?: string }) {
  const [db, setDb] = useState<SeasonalityDB | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartW, setChartW] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('../data/njSeasonality.json').then(mod => setDb(mod.default as SeasonalityDB));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => setChartW(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const townData = useMemo(() => (db ? findData(townSlug, db) : null), [db, townSlug]);

  const priceTrend = useMemo(() => {
    if (!townData) return null;
    const pts = townData.months
      .filter(m => m.medianPrice != null)
      .sort((a, b) => a.period.localeCompare(b.period));
    if (pts.length < 3) return null;
    const prices = pts.map(m => m.medianPrice!);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const latestPrice = prices[prices.length - 1];
    const [ly, lm] = pts[pts.length - 1].period.split('-');
    const prevPt = pts.find(p => p.period === `${parseInt(ly) - 1}-${lm}`);
    const yoyPct = prevPt ? ((latestPrice - prevPt.medianPrice!) / prevPt.medianPrice!) * 100 : null;
    const yearMarkers: { label: string; idx: number }[] = [];
    pts.forEach((p, i) => { if (p.period.endsWith('-01')) yearMarkers.push({ label: p.period.slice(0, 4), idx: i }); });
    return { pts, prices, minP, maxP, latestPrice, yoyPct, yearMarkers };
  }, [townData]);

  if (!priceTrend) return null;

  const { pts, prices, minP, maxP, latestPrice, yoyPct, yearMarkers } = priceTrend;
  const H = 160; const YPAD = 6; const BOTTOM = 4;
  const xOf = (i: number) => (i / (pts.length - 1)) * chartW;
  const yOf = (p: number) => YPAD + (1 - (p - minP) / (maxP - minP || 1)) * (H - YPAD - BOTTOM);
  const polyline = pts.map((_, i) => `${xOf(i)},${yOf(prices[i])}`).join(' ');
  const fillPoly = `0,${H} ${polyline} ${chartW},${H}`;
  const hIdx = hoveredIdx ?? pts.length - 1;
  const hPt = pts[hIdx];
  const hPrice = prices[hIdx];
  const hX = xOf(hIdx);
  const hY = yOf(hPrice);
  const isUp = yoyPct != null && yoyPct > 0.5;
  const isDown = yoyPct != null && yoyPct < -0.5;
  const midP = (minP + maxP) / 2;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-[13px] font-mono text-slate-400 uppercase tracking-wider mb-3">Median Sale Price</p>
      <div className="flex gap-8 items-start">
        {/* Stats column */}
        <div className="flex flex-col gap-4 w-32 shrink-0">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">Current</div>
            <div className="text-xl font-bold text-slate-800 leading-none">{fmtPrice(latestPrice)}</div>
          </div>
          {yoyPct != null && (
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">YoY</div>
              <div className={`text-sm font-bold flex items-center gap-1 ${isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-500'}`}>
                {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
                {yoyPct > 0 ? '+' : ''}{yoyPct.toFixed(1)}%
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">Period Low</div>
            <div className="text-sm font-bold text-slate-600">{fmtPrice(minP)}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">Period High</div>
            <div className="text-sm font-bold text-slate-600">{fmtPrice(maxP)}</div>
          </div>
        </div>
        {/* Chart column — fills remaining width */}
        <div className="flex-1 min-w-0">
          <div className="h-6 flex items-center mb-1">
            {hoveredIdx !== null ? (
              <>
                <span className="text-base font-bold text-slate-800">{fmtPrice(hPrice)}</span>
                <span className="ml-2 text-xs font-mono text-slate-400">{hPt.period.slice(0, 7)}</span>
              </>
            ) : (
              <span className="text-xs font-mono text-slate-300">hover to explore</span>
            )}
          </div>
          <div ref={containerRef} className="relative w-full" style={{ height: H }}>
            <svg
              width={chartW}
              height={H}
              className="absolute inset-0"
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round((x / chartW) * (pts.length - 1));
                setHoveredIdx(Math.max(0, Math.min(idx, pts.length - 1)));
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="priceGradPTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[maxP, midP, minP].map((p, gi) => (
                <line key={gi} x1={0} y1={yOf(p)} x2={chartW} y2={yOf(p)} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              {yearMarkers.map(({ idx }) => (
                <line key={idx} x1={xOf(idx)} y1={YPAD} x2={xOf(idx)} y2={H - BOTTOM} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
              ))}
              <polygon points={fillPoly} fill="url(#priceGradPTC)" />
              <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <line x1={hX} y1={YPAD} x2={hX} y2={H - BOTTOM} stroke={color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3,2" />
              <circle cx={hX} cy={hY} r="4" fill={color} stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative w-full h-4 mt-0.5">
            {yearMarkers.map(({ label, idx }) => (
              <span key={label} className="absolute text-[10px] font-mono text-slate-300 pointer-events-none -translate-x-1/2" style={{ left: xOf(idx) }}>
                {label}
              </span>
            ))}
          </div>
          <p className="text-[11px] font-mono text-slate-300 mt-1">Rolling 3-month median · Redfin data</p>
        </div>
      </div>
    </div>
  );
}

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
const YEARS = [2023, 2024, 2025, 2026] as const;
type Year = typeof YEARS[number];

function findData(slug: string, db: SeasonalityDB): TownSeasonality | null {
  if (db[slug]) return db[slug];
  const stripped = slug.replace(/-[a-z]+$/, '');
  if (db[stripped]) return db[stripped];
  return null;
}

interface Props {
  townSlug: string;
  saleToList?: number;
  proxyName?: string;
}

export default function MarketIntelligence({ townSlug, saleToList, proxyName }: Props) {
  const [db, setDb] = useState<SeasonalityDB | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year>(2025);

  useEffect(() => {
    import('../data/njSeasonality.json').then(mod => {
      setDb(mod.default as SeasonalityDB);
    });
  }, []);

  const townData = useMemo(() => (db ? findData(townSlug, db) : null), [db, townSlug]);

  const byYear = useMemo(() => {
    if (!townData) return null;
    const map: Record<number, (MonthEntry | null)[]> = {
      2023: Array(12).fill(null),
      2024: Array(12).fill(null),
      2025: Array(12).fill(null),
      2026: Array(12).fill(null),
    };
    townData.months.forEach(m => {
      const [year, month] = m.period.split('-').map(Number);
      if (map[year]) map[year][month - 1] = m;
    });
    return map;
  }, [townData]);

  const insights = useMemo(() => {
    if (!byYear) return null;
    // Use 2023–2025 full years for buyer window calc
    const fullYears = [byYear[2023], byYear[2024], byYear[2025]];

    const avgListings = MONTHS.map((_, i) => {
      const vals = fullYears.flatMap(y => [y[i]?.newListings]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    });

    const avgDom = MONTHS.map((_, i) => {
      const vals = fullYears.flatMap(y => [y[i]?.daysOnMarket]).filter((v): v is number => v != null);
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

  const activeMonths = byYear[selectedYear];
  const CHART_H = 110;
  const maxVal = Math.max(...activeMonths.map(m => m?.newListings ?? 0), 1);

  const heatLabel = saleToList
    ? saleToList >= 105 ? 'Hot 🔥' : saleToList >= 102 ? 'Warm ↗' : 'Cool ↘'
    : null;

  const latestDom = [...byYear[2025]].reverse().find(m => m?.daysOnMarket != null)?.daysOnMarket ?? null;

  const buyerWindowLabel = insights.buyerWindow.length === 3 && insights.buyerWindow[2].idx - insights.buyerWindow[0].idx <= 3
    ? `${insights.buyerWindow[0].label} – ${insights.buyerWindow[2].label}`
    : insights.buyerWindow.map(m => m.label).join(', ');

  return (
    <div className="rounded-2xl p-6" style={{ border: `1px solid ${ACCENT}30` }}>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
            <TrendingUp size={20} />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">When to Buy</h2>
        </div>
        {proxyName && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
            <AlertCircle size={10} className="text-amber-500 shrink-0" />
            <span className="text-[11px] font-mono text-amber-700">Based on nearby {proxyName} — no data for this town</span>
          </div>
        )}
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
          {YEARS.map(yr => {
            const hasData = byYear[yr].some(m => m?.newListings != null);
            if (!hasData) return null;
            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-md text-[13px] font-mono font-semibold transition-all ${
                  selectedYear === yr
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {yr === 2026 ? '2026 YTD' : yr}
              </button>
            );
          })}
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
                    style={{ height: barH, backgroundColor: isBuyer ? ACCENT : `${ACCENT}45` }}
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
