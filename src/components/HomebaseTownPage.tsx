import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, School, Home, Train, Shield, Coffee, TrendingUp, Users, ChevronRight, Zap } from 'lucide-react';
import { NJ_ENRICHED, NJ_COUNTIES } from '../constants';
import { logVisit } from '../lib/analytics';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function slugToName(slug: string): string {
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

  const townName = slugToName(townSlug || '');
  const data = NJ_ENRICHED[townName];
  const county = findTownCounty(townName);

  useEffect(() => {
    document.title = `${townName}, NJ — Homebase`;
    logVisit(`/homebase/${townSlug}`);
  }, [townName, townSlug]);

  useEffect(() => {
    if (!data || !GROQ_API_KEY) return;
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
          content: `Write 2-3 sentences capturing the real character and vibe of ${townName}, NJ as a place to live. Be specific and honest — mention who typically lives here, what the streets feel like, and what makes it distinct from neighboring towns. Context: median home $${Math.round((data.homeVal || 0) / 1000)}K, school rating ${data.schoolLabel}, walkability ${data.walkScore}/100, median income $${Math.round((data.income || 0) / 1000)}K, population ${(data.pop || 0).toLocaleString()}. No fluff, no generic phrases.`
        }]
      })
    })
      .then(r => r.json())
      .then(d => {
        const text = d.choices?.[0]?.message?.content?.trim() || '';
        if (text) { setVibe(text); localStorage.setItem(cacheKey, text); }
      })
      .catch(() => {})
      .finally(() => setVibeLoading(false));
  }, [townSlug, data]);

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

  const schoolScore = data?.schoolRating || 50;
  const safetyScore = data?.safetyScore || 50;
  const walkScore = data?.walkScore || 50;
  const marketHeat = data?.saleToList || 100;

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
          <Link
            to={`/homebase?compare=${townSlug}`}
            className="px-4 py-1.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
          >
            + Compare Towns
          </Link>
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
                  { label: 'Schools', value: data?.schoolLabel || 'N/A', score: schoolScore },
                  { label: 'Safety', value: data?.safetyLabel || 'N/A', score: safetyScore },
                  { label: 'Walk Score', value: `${data?.walkScore ?? 'N/A'}/100`, score: walkScore },
                  { label: 'Median Home', value: fmtDollar(data?.homeVal), score: 60 },
                  { label: 'Tax Rate', value: data?.taxRate ? `${data.taxRate}%` : 'N/A', score: 60 },
                  { label: 'Commute NYC', value: data?.commute ? `${data.commute} min` : 'N/A', score: 60 },
                ].map(p => (
                  <div key={p.label} className={`px-3 py-1.5 rounded-full border text-xs font-mono ${tagBg(p.score)}`}>
                    <span className="opacity-60">{p.label}: </span>
                    <span className="font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Map embed */}
            <div className="lg:w-[420px] shrink-0">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '300px' }}>
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(townName + ', NJ')}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title={`Map of ${townName}, NJ`}
                />
              </div>
              <p className="text-center text-white/20 text-[10px] font-mono mt-2">
                {townName}, {county} County, NJ
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
              <StatCard label="District Rating" value={data?.schoolLabel || 'N/A'} sub="Niche.com rating" highlight={schoolScore >= 80} />
              <StatCard label="Score" value={`${data?.schoolRating ?? 'N/A'}/100`} sub="Composite score" />
              <StatCard label="Degree Holders" value={data?.eduPct ? `${data.eduPct}%` : 'N/A'} sub="Bachelor's+" />
              <StatCard label="Population" value={data?.pop ? data.pop.toLocaleString() : 'N/A'} sub="Residents" />
            </div>
            <ScoreBar value={schoolScore} label="School Quality" />
          </Section>

          {/* Housing Market */}
          <Section icon={<Home size={20} />} title="Housing Market" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Median Home" value={fmtDollar(data?.homeVal)} sub="Current estimate" highlight />
              <StatCard label="Sale-to-List" value={data?.saleToList ? `${data.saleToList}%` : 'N/A'} sub="Market heat" />
              <StatCard label="Avg Property Tax" value={data?.avgTax ? `$${data.avgTax.toLocaleString()}/yr` : 'N/A'} sub={data?.taxRate ? `${data.taxRate}% rate` : ''} />
              <StatCard label="Median Income" value={fmtDollar(data?.income)} sub="Household/yr" />
            </div>
            {data?.marketHistory && (
              <div className="mt-6">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Sale-to-List History</p>
                <div className="flex items-end gap-3 h-20">
                  {Object.entries(data.marketHistory).map(([period, val]: [string, any]) => {
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
            )}
          </Section>

          {/* Getting Around */}
          <Section icon={<Train size={20} />} title="Getting Around" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Avg Commute" value={data?.commute ? `${data.commute} min` : 'N/A'} sub="To NYC (transit)" highlight />
              <StatCard label="Walk Score" value={`${data?.walkScore ?? 'N/A'}/100`} sub={data?.walkLabel || ''} />
              <StatCard label="Regional Access" value={`${data?.highway ?? 'N/A'}/100`} sub="Highway/transit score" />
            </div>
            <ScoreBar value={data?.walkScore || 0} label="Walkability" />
          </Section>

          {/* Safety */}
          <Section icon={<Shield size={20} />} title="Safety" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Safety Rating" value={data?.safetyLabel || 'N/A'} sub="Composite score" highlight={safetyScore >= 80} />
              <StatCard label="Safety Score" value={`${data?.safetyScore ?? 'N/A'}/100`} sub="vs NJ average" />
              <StatCard label="Town Size" value={data?.pop ? data.pop.toLocaleString() : 'N/A'} sub="Population" />
            </div>
            <ScoreBar value={safetyScore} label="Safety" />
          </Section>

          {/* Local Scene */}
          {data?.hottestThings && data.hottestThings.length > 0 && (
            <Section icon={<Coffee size={20} />} title="Local Scene" color="#0471A4">
              <p className="text-sm text-slate-500 mb-4 font-mono">What's popular in {townName} right now</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.hottestThings.map((thing: string, i: number) => (
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
            </Section>
          )}

          {/* Market Pulse */}
          <Section icon={<TrendingUp size={20} />} title="Market Pulse" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Market Heat"
                value={marketHeat >= 105 ? 'Hot 🔥' : marketHeat >= 102 ? 'Warm' : 'Cool'}
                sub={`${marketHeat}% sale-to-list`}
                highlight={marketHeat >= 105}
              />
              <StatCard label="Avg Tax/yr" value={data?.avgTax ? `$${data.avgTax.toLocaleString()}` : 'N/A'} sub={`${data?.taxRate ?? 'N/A'}% tax rate`} />
              <StatCard label="Income vs Home" value={data?.income && data?.homeVal ? `${(data.homeVal / data.income).toFixed(1)}x` : 'N/A'} sub="Price-to-income ratio" />
            </div>
          </Section>

          {/* Who Lives Here */}
          <Section icon={<Users size={20} />} title="Who Lives Here" color="#0471A4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Median Income" value={fmtDollar(data?.income)} sub="Household/yr" highlight />
              <StatCard label="Education" value={data?.eduPct ? `${data?.eduPct}%` : 'N/A'} sub="Bachelor's degree+" />
              <StatCard label="Population" value={data?.pop ? data.pop.toLocaleString() : 'N/A'} sub="Residents" />
              <StatCard label="Commute" value={data?.commute ? `${data.commute} min` : 'N/A'} sub="Avg travel time" />
            </div>
          </Section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#090f1a] to-[#0d1f36] rounded-2xl p-8 text-center">
            <h3 className="font-serif font-bold text-2xl text-white mb-2">Considering {townName}?</h3>
            <p className="text-white/50 text-sm mb-6 font-mono">Compare it side-by-side with other NJ towns to find your best fit.</p>
            <Link
              to="/homebase"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0471A4] text-white rounded-xl text-sm font-bold hover:bg-[#035480] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Compare Towns
              <ChevronRight size={16} />
            </Link>
          </div>

        </div>
      </div>
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
