import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, School, Home, Train, Shield, Coffee, TrendingUp, Users, ChevronRight, Zap, X, GitCompare } from 'lucide-react';
import { NJ_ENRICHED, NJ_COUNTIES } from '../constants';
import { logVisit } from '../lib/analytics';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
}

function findTownCounty(townName: string): string | null {
  for (const [county, data] of Object.entries(NJ_COUNTIES)) {
    if ((data as any).towns.some((t: string) => t.toLowerCase() === townName.toLowerCase())) {
      return county;
    }
  }
  return null;
}

const fmtDollar = (n: number | null) => {
  if (!n) return 'N/A';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n;
};

const scoreColor = (v: number) =>
  v >= 70 ? 'text-emerald-400' : v >= 45 ? 'text-amber-400' : 'text-red-400';

const tagBg = (v: number) =>
  v >= 70 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
  v >= 45 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
  'bg-red-500/20 text-red-300 border-red-500/30';

export default function HomebaseTownPage() {
  const { townSlug } = useParams<{ townSlug: string }>();
  const navigate = useNavigate();
  const [vibe, setVibe] = useState<string | null>(null);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [localScene, setLocalScene] = useState<string[]>([]);
  const [groqData, setGroqData] = useState<Record<string, any> | null>(null);

  const townName = slugToName(townSlug || '');
  const data = NJ_ENRICHED[townName];
  const county = findTownCounty(townName);

  useEffect(() => {
    document.title = `${townName}, NJ — Homebase`;
    logVisit(`/homebase/${townSlug}`);
  }, [townName, townSlug]);

  useEffect(() => {
    if ((!data && !groqData) || !GROQ_API_KEY) return;
    const merged = data || groqData || {};
    const cacheKey = `hb_vibe_${townSlug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setVibe(cached); return; }

    setVibeLoading(true);
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 180,
        messages: [{
          role: 'user',
          content: `Write 2-3 sentences capturing the real character and vibe of ${townName}, NJ as a place to live. Be specific and honest — mention who typically lives here, what the streets feel like, and what makes it distinct from neighboring towns. Context: median home $${Math.round((merged.homeVal || 0) / 1000)}K, school rating ${merged.schoolLabel}, walkability ${merged.walkScore}/100, median income $${Math.round((merged.income || 0) / 1000)}K, population ${(merged.pop || 0).toLocaleString()}. No fluff, no generic phrases.`
        }]
      })
    })
      .then(r => r.json())
      .then(res => {
        const text = res.choices?.[0]?.message?.content?.trim() || '';
        if (text) { setVibe(text); localStorage.setItem(cacheKey, text); }
      })
      .catch(() => {})
      .finally(() => setVibeLoading(false));
  }, [townSlug, data, groqData]);

  // Groq local scene — only fetch if not already in static data
  useEffect(() => {
    if (data?.hottestThings && data.hottestThings.length > 0) { setLocalScene(data.hottestThings); return; }
    if (!GROQ_API_KEY) return;
    const cacheKey = `hb_scene_${townSlug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setLocalScene(JSON.parse(cached)); } catch {} return; }

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `List 6 specific popular spots, restaurants, parks, or local attractions in ${townName}, NJ that locals actually love. Be specific — real place names, not generic descriptions. Reply ONLY with a JSON array of strings, e.g. ["Place Name", ...]. No explanation.`
        }]
      })
    })
      .then(r => r.json())
      .then(d => {
        const text = d.choices?.[0]?.message?.content?.trim() || '';
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setLocalScene(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      })
      .catch(() => {});
  }, [townSlug, data]);

  // Groq fallback — generate core metrics for towns not in NJ_ENRICHED
  useEffect(() => {
    if (data || !county || !GROQ_API_KEY) return;
    const cacheKey = `hb_data_${townSlug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setGroqData(JSON.parse(cached)); } catch {} return; }

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 250,
        messages: [{
          role: 'user',
          content: `Estimate realistic 2024 data for ${townName}, ${county} County, NJ. Reply ONLY with valid JSON:
{"homeVal":number,"income":number,"commute":number,"pop":number,"schoolLabel":"A+"|"A"|"A-"|"B+"|"B"|"B-"|"C+"|"C"|"D","schoolRating":number,"safetyScore":number,"safetyLabel":"Very Safe"|"Safe"|"Average"|"Below Avg","walkScore":number,"walkLabel":string,"taxRate":number,"avgTax":number,"eduPct":number,"saleToList":number}
Use realistic NJ data. No explanation.`
        }]
      })
    })
      .then(r => r.json())
      .then(d => {
        const text = d.choices?.[0]?.message?.content?.trim() || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setGroqData(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      })
      .catch(() => {});
  }, [townSlug, data, county]);

  if (!data && !county) {
    return (
      <div className="min-h-screen bg-[#090f1a] flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-4">🏘️</div>
        <h1 className="text-2xl font-bold mb-2">Town not found</h1>
        <p className="text-white/50 mb-6">We don't have data for "{townName}" yet.</p>
        <Link to="/homebase" className="px-5 py-2.5 bg-[#0471A4] text-white rounded-xl text-sm font-bold hover:bg-[#035480] transition-all">
          Back to Search
        </Link>
      </div>
    );
  }

  // Merge static data with Groq fallback for missing towns
  const d = data || groqData || {};
  const isGroqFallback = !data && !!groqData;

  const schoolScore = d?.schoolRating || 50;
  const safetyScore = d?.safetyScore || 50;
  const walkScore = d?.walkScore || 50;
  const marketHeat = d?.saleToList || 100;

  return (
    <div className="min-h-screen bg-[#090f1a] font-sans">

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <button
          onClick={() => navigate('/homebase')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-mono"
        >
          <ArrowLeft size={16} />
          Homebase NJ
        </button>
        <div className="flex items-center gap-3">
          {county && <ComparePanel currentTownName={townName} currentCounty={county} variant="top" />}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 70% at 70% 20%, rgba(4,113,164,0.5) 0%, transparent 65%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 20% 80%, rgba(91,168,204,0.15) 0%, transparent 60%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-start gap-10">

            {/* Left: Town info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} className="text-[#8ECAE6]" />
                <span className="font-mono text-[12px] text-white/50 uppercase tracking-widest">
                  {county ? `${county} County` : 'New Jersey'} · New Jersey
                </span>
              </div>

              <h1 className="text-[clamp(48px,7vw,88px)] leading-[0.9] tracking-tight mb-6">
                <span className="font-serif font-bold text-white">{townName}</span>
              </h1>

              {/* Vibe */}
              <div className="mb-8 max-w-lg">
                {vibeLoading ? (
                  <div className="flex items-center gap-2 text-white/40 text-sm font-mono animate-pulse">
                    <Zap size={12} className="text-[#8ECAE6]" />
                    Generating town profile...
                  </div>
                ) : vibe ? (
                  <p className="text-white/75 text-[15px] leading-relaxed italic">"{vibe}"</p>
                ) : null}
              </div>

              {/* Key stat pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Schools', value: d?.schoolLabel || 'N/A', score: schoolScore },
                  { label: 'Safety', value: d?.safetyLabel || 'N/A', score: safetyScore },
                  { label: 'Walk Score', value: `${d?.walkScore ?? 'N/A'}/100`, score: walkScore },
                  { label: 'Median Home', value: fmtDollar(d?.homeVal), score: 60 },
                  { label: 'Tax Rate', value: d?.taxRate ? `${d.taxRate}%` : 'N/A', score: 60 },
                  { label: 'Commute NYC', value: d?.commute ? `${d.commute} min` : 'N/A', score: 60 },
                ].map(p => (
                  <div key={p.label} className={`px-3 py-1.5 rounded-full border text-xs font-mono ${tagBg(p.score)}`}>
                    <span className="opacity-60">{p.label}: </span>
                    <span className="font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Map */}
            <div className="lg:w-[460px] shrink-0">
              {county && (
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(townName + ', ' + county + ' County, NJ')}&output=embed&z=14`}
                  className="w-full rounded-2xl"
                  style={{ height: 360, border: 'none' }}
                  loading="lazy"
                  allowFullScreen
                />
              )}
              <p className="text-center text-white/20 text-[10px] font-mono mt-2">
                {townName}, {county} County, NJ · {localScene.length > 0 ? `${Math.min(localScene.length, 4)} local spots marked` : 'loading spots...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

          {/* Schools */}
          <Section icon={<School size={20} />} title="Schools" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="District Rating" value={d?.schoolLabel || 'N/A'} sub="Niche.com rating" highlight={schoolScore >= 80} />
              <StatCard label="Score" value={`${d?.schoolRating ?? 'N/A'}/100`} sub="Composite score" />
              <StatCard label="Degree Holders" value={d?.eduPct ? `${d.eduPct}%` : 'N/A'} sub="Bachelor's+" />
              <StatCard label="Population" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Residents" />
            </div>
            <ScoreBar value={schoolScore} label="School Quality" />
          </Section>

          {/* Housing Market */}
          <Section icon={<Home size={20} />} title="Housing Market" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Median Home" value={fmtDollar(d?.homeVal)} sub="Estimated value" highlight />
              <StatCard label="Sale-to-List" value={d?.saleToList ? `${d.saleToList}%` : 'N/A'} sub="Market heat" />
              <StatCard label="Avg Property Tax" value={d?.avgTax ? `$${d.avgTax.toLocaleString()}/yr` : 'N/A'} sub={d?.taxRate ? `${d.taxRate}% rate` : ''} />
              <StatCard label="Median Income" value={fmtDollar(d?.income)} sub="Household/yr" />
            </div>
            {d?.saleToList && (() => {
              const base = d.saleToList;
              const history = d.marketHistory || {
                '90d': base,
                '6m': Math.round((base - 1) * 10) / 10,
                '1y': Math.round((base - 2) * 10) / 10,
                '3y': Math.round((base - 4) * 10) / 10,
                '5y': Math.round((base - 6) * 10) / 10,
              };
              const isDerived = !d.marketHistory;
              return (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Sale-to-List History</p>
                    {isDerived && <span className="text-[9px] font-mono text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded">est.</span>}
                  </div>
                  <div className="flex items-end gap-3 h-20">
                    {Object.entries(history).map(([period, val]: [string, any]) => {
                      const pct = Math.max(0, Math.min(100, ((val - 95) / 20) * 100));
                      return (
                        <div key={period} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-slate-500">{val}%</span>
                          <div className="w-full rounded-t-sm bg-[#0471A4]/80 transition-all" style={{ height: `${Math.max(8, pct * 0.6)}px` }} />
                          <span className="text-[9px] font-mono text-slate-400 uppercase">{period}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </Section>

          {/* Getting Around */}
          <Section icon={<Train size={20} />} title="Getting Around" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Avg Commute" value={d?.commute ? `${d.commute} min` : 'N/A'} sub="To NYC (transit)" highlight />
              <StatCard label="Walk Score" value={`${d?.walkScore ?? 'N/A'}/100`} sub={d?.walkLabel || ''} />
              <StatCard label="Regional Access" value={`${d?.highway ?? 'N/A'}/100`} sub="Highway/transit score" />
            </div>
            <ScoreBar value={d?.walkScore || 0} label="Walkability" />
          </Section>

          {/* Safety */}
          <Section icon={<Shield size={20} />} title="Safety" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Safety Rating" value={d?.safetyLabel || 'N/A'} sub="Composite score" highlight={safetyScore >= 80} />
              <StatCard label="Safety Score" value={`${d?.safetyScore ?? 'N/A'}/100`} sub="vs NJ average" />
              <StatCard label="Town Size" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Population" />
            </div>
            <ScoreBar value={safetyScore} label="Safety" />
          </Section>

          {/* Local Scene */}
          <Section icon={<Coffee size={20} />} title="Local Scene" color="#0471A4">
            {localScene.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm font-mono animate-pulse py-4">
                <Zap size={12} className="text-[#0471A4]" />
                Finding local spots...
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4 font-mono">What's popular in {townName} right now</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localScene.map((thing: string, i: number) => (
                    <a
                      key={i}
                      href={`https://www.google.com/search?q=${encodeURIComponent(thing + ' ' + townName + ' NJ')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#0471A4]/30 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#0471A4]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#0471A4] group-hover:bg-[#0471A4]/20 transition-colors">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#0471A4] transition-colors">{thing}</span>
                      <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0471A4] transition-colors" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Market Pulse */}
          <Section icon={<TrendingUp size={20} />} title="Market Pulse" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Market Heat"
                value={marketHeat >= 105 ? 'Hot 🔥' : marketHeat >= 102 ? 'Warm' : 'Cool'}
                sub={`${marketHeat}% sale-to-list`}
                highlight={marketHeat >= 105}
              />
              <StatCard label="Avg Tax/yr" value={d?.avgTax ? `$${d.avgTax.toLocaleString()}` : 'N/A'} sub={`${d?.taxRate ?? 'N/A'}% tax rate`} />
              <StatCard label="Income vs Home" value={d?.income && d?.homeVal ? `${(d.homeVal / d.income).toFixed(1)}x` : 'N/A'} sub="Price-to-income ratio" />
            </div>
          </Section>

          {/* Who Lives Here */}
          <Section icon={<Users size={20} />} title="Who Lives Here" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Median Income" value={fmtDollar(d?.income)} sub="Household/yr" highlight />
              <StatCard label="Education" value={d?.eduPct ? `${d.eduPct}%` : 'N/A'} sub="Bachelor's degree+" />
              <StatCard label="Population" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Residents" />
              <StatCard label="Commute" value={d?.commute ? `${d.commute} min` : 'N/A'} sub="Avg travel time" />
            </div>
          </Section>

          {/* CTA */}
          <div className="rounded-2xl overflow-visible">
            <div className="bg-gradient-to-r from-[#090f1a] to-[#0d1f36] rounded-2xl p-8 text-center">
              <h3 className="font-serif font-bold text-2xl text-white mb-2">Considering {townName}?</h3>
              <p className="text-white/50 text-sm mb-6 font-mono">Compare it side-by-side with other NJ towns to find your best fit.</p>
              {county && <ComparePanel currentTownName={townName} currentCounty={county} variant="bottom" />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ComparePanel({ currentTownName, currentCounty, variant }: {
  currentTownName: string;
  currentCounty: string;
  variant: 'top' | 'bottom';
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{name: string; county: string}[]>([
    { name: currentTownName, county: currentCounty }
  ]);
  const ref = useRef<HTMLDivElement>(null);

  const allTowns = useMemo(() =>
    Object.entries(NJ_COUNTIES).flatMap(([county, data]) =>
      (data as any).towns.map((town: string) => ({ name: town, county }))
    ), []
  );

  const filtered = useMemo(() => {
    if (search.length < 2) return [];
    return allTowns
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) && !selected.some(s => s.name === t.name))
      .slice(0, 10);
  }, [search, selected, allTowns]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCompare = () => {
    const slugs = selected.map(t => nameToSlug(t.name)).join(',');
    navigate(`/homebase?towns=${slugs}`);
  };

  const button = variant === 'top' ? (
    <button
      onClick={() => setOpen(o => !o)}
      className="flex items-center gap-2 px-4 py-1.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
    >
      <GitCompare size={12} />
      Compare Towns
    </button>
  ) : (
    <button
      onClick={() => setOpen(o => !o)}
      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0471A4] text-white rounded-xl text-sm font-bold hover:bg-[#035480] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
    >
      Compare Towns
      <ChevronRight size={16} />
    </button>
  );

  const panel = open && (
    variant === 'top' ? (
      // Compact dark panel — top variant
      <div className="absolute right-0 top-full mt-2 w-[420px] bg-[#0d1a26] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <p className="text-white/50 text-xs font-mono mb-3 uppercase tracking-wider">Add towns to compare</p>
          <div className="relative flex flex-wrap gap-2 min-h-[44px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#0471A4]/60 transition-all">
            {selected.map(t => (
              <span key={t.name} className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0471A4]/30 text-[#8ECAE6] rounded-lg text-xs font-mono font-bold">
                {t.name}
                {t.name !== currentTownName && (
                  <button onClick={() => setSelected(s => s.filter(x => x.name !== t.name))} className="hover:text-white transition-colors"><X size={10} /></button>
                )}
              </span>
            ))}
            <input
              autoFocus
              className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder-white/20"
              placeholder="Search a town..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <div className="mt-2 bg-[#0a1520] border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map(t => (
                <button key={t.name} onClick={() => { setSelected(s => [...s, t]); setSearch(''); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex justify-between items-center transition-colors">
                  <span>{t.name}</span>
                  <span className="text-white/30 text-xs font-mono">{t.county}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-white/40 text-xs font-mono">{selected.length}/8 towns</span>
          <button
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="px-4 py-2 bg-[#0471A4] text-white text-xs font-bold rounded-xl hover:bg-[#035480] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Compare {selected.length} Towns →
          </button>
        </div>
      </div>
    ) : (
      // Spacious homepage-style panel — bottom variant
      <div className="mt-6 bg-[#090f1a] rounded-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10" style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 0%, rgba(4,113,164,0.3) 0%, transparent 70%)' }}>
          <h4 className="font-serif font-bold text-2xl text-white mb-1">Compare Towns</h4>
          <p className="text-white/40 text-sm font-mono mb-5">Search and add NJ towns to compare side-by-side</p>
          <div className="flex flex-wrap gap-2 min-h-[52px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#0471A4]/60 transition-all items-center">
            {selected.map(t => (
              <span key={t.name} className="flex items-center gap-1.5 px-3 py-1 bg-[#0471A4]/30 text-[#8ECAE6] rounded-xl text-sm font-mono font-bold">
                {t.name}
                {t.name !== currentTownName && (
                  <button onClick={() => setSelected(s => s.filter(x => x.name !== t.name))} className="hover:text-white transition-colors ml-1"><X size={12} /></button>
                )}
              </span>
            ))}
            <input
              autoFocus
              className="flex-1 min-w-[180px] bg-transparent text-white text-base outline-none placeholder-white/20"
              placeholder="Search for a town (e.g. Summit, Montclair)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filtered.length > 0 && (
            <div className="mt-3 bg-white border border-slate-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto shadow-xl">
              {filtered.map(t => (
                <button key={t.name} onClick={() => { setSelected(s => [...s, t]); setSearch(''); }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-[#0471A4] flex justify-between items-center transition-colors border-b border-slate-50 last:border-0">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-slate-400 text-xs font-mono">{t.county} County {NJ_ENRICHED[t.name] ? '· ✓ data' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-white/30 text-xs font-mono">{selected.length} of 8 towns selected</span>
          <button
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="px-5 py-2.5 bg-[#0471A4] text-white text-sm font-bold rounded-xl hover:bg-[#035480] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            View Comparison →
          </button>
        </div>
      </div>
    )
  );

  return (
    <div ref={ref} className="relative">
      {button}
      {panel}
    </div>
  );
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${highlight ? 'bg-blue-50 border-[#0471A4]/20' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-[#0471A4]' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? '#10b981' : value >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
