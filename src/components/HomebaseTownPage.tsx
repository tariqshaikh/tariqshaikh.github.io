import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, School, Home, Train, Shield, Coffee, TrendingUp, Users, ChevronRight, Zap, X, GitCompare } from 'lucide-react';
import { NJ_ENRICHED, NJ_COUNTIES } from '../constants';
import { logVisit } from '../lib/analytics';
import MarketIntelligence, { PriceTrendChart } from './MarketIntelligence';

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
  const [roadDetail, setRoadDetail] = useState<string | null>(null);
  const [roadDetailLoading, setRoadDetailLoading] = useState(false);
  const [commuteDest, setCommuteDest] = useState<'nyc' | 'philly' | 'shore'>('nyc');
  const [shoreTown, setShoreTown] = useState('Seaside Heights');
  const [shoreInput, setShoreInput] = useState('Seaside Heights');
  const [extraCommutes, setExtraCommutes] = useState<{ philly: number | null; shore: number | null; forTown: string } | null>(null);
  const [extraCommutesLoading, setExtraCommutesLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('schools');
  const [hasRedfin, setHasRedfin] = useState(false);
  const [redfinSlug, setRedfinSlug] = useState<string | null>(null);
  const [redfinProxyName, setRedfinProxyName] = useState<string | null>(null);

  const townName = slugToName(townSlug || '');
  const data = NJ_ENRICHED[townName];
  const county = findTownCounty(townName);

  function smoothScrollTo(el: HTMLElement, duration = 1100) {
    const navOffset = 125;
    const target = el.getBoundingClientRect().top + window.scrollY - navOffset;
    const start = window.scrollY;
    const distance = target - start;
    let startTime: number | null = null;
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const fetchExtraCommutes = (shoreDestination = 'Seaside Heights') => {
    if (extraCommutesLoading || !GROQ_API_KEY) return;
    const cacheKey = `hb_xcommute_${townSlug}_${shoreDestination.toLowerCase().replace(/\s+/g, '-')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setExtraCommutes(JSON.parse(cached)); } catch {} return; }
    setExtraCommutesLoading(true);
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 80,
        messages: [{ role: 'user', content: `Estimate typical drive time in minutes from ${townName}, NJ to: 1) Philadelphia Center City, PA and 2) ${shoreDestination}, NJ. Reply ONLY as valid JSON: {"philly": 75, "shore": 45}. Single numbers only, no ranges.` }]
      })
    })
      .then(r => r.json())
      .then(res => {
        const text = res.choices?.[0]?.message?.content?.trim() || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const result = { philly: parsed.philly ?? null, shore: parsed.shore ?? null, forTown: shoreDestination };
          setExtraCommutes(result);
          localStorage.setItem(cacheKey, JSON.stringify(result));
        }
      })
      .catch(() => {})
      .finally(() => setExtraCommutesLoading(false));
  };

  const fetchRoadDetail = () => {
    if (roadDetail || roadDetailLoading || !county || !GROQ_API_KEY) return;
    const cacheKey = `hb_roads_${townSlug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setRoadDetail(cached); return; }
    setRoadDetailLoading(true);
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 120,
        messages: [{ role: 'user', content: `List 3–5 specific highways, routes, and NJ Transit rail or bus lines that directly serve ${townName}, ${county} County, NJ. Be specific to this exact town. Reply ONLY as a JSON array of strings, e.g. ["Route 287", "Garden State Pkwy", "NJ Transit Morris & Essex Line"]. No explanation.` }]
      })
    })
      .then(r => r.json())
      .then(res => {
        const text = res.choices?.[0]?.message?.content?.trim() || '';
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed: string[] = JSON.parse(match[0]);
          const joined = parsed.join(' · ');
          setRoadDetail(joined);
          localStorage.setItem(cacheKey, joined);
        }
      })
      .catch(() => {})
      .finally(() => setRoadDetailLoading(false));
  };

  useEffect(() => {
    document.title = `${townName}, NJ — Homebase`;
    logVisit(`/homebase/${townSlug}`);
  }, [townName, townSlug]);

  // Auto-fetch road detail on load — no click required
  useEffect(() => {
    fetchRoadDetail();
  }, [county]);

  // Check Redfin coverage; fall back to nearest county neighbor if missing
  useEffect(() => {
    const toSlug = (n: string) => n.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    import('../data/njSeasonality.json').then(mod => {
      const db = mod.default as Record<string, any>;
      const slug = townSlug || '';
      const stripped = slug.replace(/-[a-z]+$/, '');
      if (db[slug] || db[stripped]) {
        setHasRedfin(true);
        setRedfinSlug(slug);
        setRedfinProxyName(null);
      } else if (county) {
        const countyTowns = (NJ_COUNTIES[county] as any)?.towns || [];
        const neighbor = countyTowns.find((t: string) => {
          const s = toSlug(t);
          return (db[s] || db[s.replace(/-[a-z]+$/, '')]) && s !== slug;
        });
        if (neighbor) {
          setHasRedfin(true);
          setRedfinSlug(toSlug(neighbor));
          setRedfinProxyName(neighbor);
        }
      }
    });
  }, [townSlug, county]);

  useEffect(() => {
    const sectionIds = ['schools', 'who-lives-here', 'prices', 'when-to-buy', 'getting-around', 'safety', 'local-scene'];
    const THRESHOLD = 140; // px from top of viewport — accounts for both sticky nav bars
    const handleScroll = () => {
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(`section-${id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= THRESHOLD) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <div className="lg:w-[500px] shrink-0">
              {county && (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(townName + ', ' + county + ' County, NJ')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto px-3 py-1 rounded-lg text-xs font-mono text-white/40 hover:text-white/70 transition-colors"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(townName + ', ' + county + ' County, NJ')}&output=embed&z=14`}
                    className="w-full rounded-2xl"
                    style={{ height: 440, border: 'none' }}
                    loading="lazy"
                    allowFullScreen
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white">
        {/* Section nav bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-center gap-1 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { id: 'schools', label: 'Schools', icon: <School size={18} />, color: '#059669' },
                { id: 'who-lives-here', label: 'Who Lives Here', icon: <Users size={18} />, color: '#475569' },
                { id: 'prices', label: 'Prices', icon: <Home size={18} />, color: '#166534' },
                { id: 'when-to-buy', label: 'When to Buy', icon: <TrendingUp size={18} />, color: '#6366a3' },
                { id: 'getting-around', label: 'Getting Around', icon: <Train size={18} />, color: '#d97706' },
                { id: 'safety', label: 'Safety', icon: <Shield size={18} />, color: '#b91c1c' },
                { id: 'local-scene', label: 'Local Scene', icon: <Coffee size={18} />, color: '#0e7490' },
              ].map(({ id, label, icon, color }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      const el = document.getElementById(`section-${id}`);
                      if (el) {
                        el.style.transition = 'box-shadow 0.2s ease-in';
                        el.style.boxShadow = `0 0 0 2px ${color}`;
                        setTimeout(() => {
                          el.style.transition = 'box-shadow 1.1s ease-out';
                          el.style.boxShadow = 'none';
                        }, 300);
                        smoothScrollTo(el);
                      }
                    }}
                    className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-mono font-semibold transition-all whitespace-nowrap cursor-pointer hover:bg-slate-200"
                  >
                    <span style={{ color: '#94a3b8' }}>{icon}</span>
                    <span className="text-slate-400">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10 space-y-5">

          {/* Schools */}
          <Section id="section-schools" icon={<School size={20} />} title="Schools" color="#059669">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="District Rating" value={d?.schoolLabel || 'N/A'} sub="Niche.com rating" highlight={schoolScore >= 80} />
              <StatCard label="Score" value={`${d?.schoolRating ?? 'N/A'}/100`} sub="Composite score" />
              <StatCard label="Degree Holders" value={d?.eduPct ? `${d.eduPct}%` : 'N/A'} sub="Bachelor's+" />
              <StatCard label="Population" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Residents" />
            </div>
            <ScoreBar value={schoolScore} label="School Quality" />
          </Section>

          {/* Who Lives Here */}
          <Section id="section-who-lives-here" icon={<Users size={20} />} title="Who Lives Here" color="#475569">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Median Income" value={fmtDollar(d?.income)} sub="Household/yr" highlight />
              <StatCard label="Education" value={d?.eduPct ? `${d.eduPct}%` : 'N/A'} sub="Bachelor's degree+" />
              <StatCard label="Population" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Residents" />
            </div>
          </Section>

          {/* Prices & Competition */}
          <Section id="section-prices" icon={<Home size={20} />} title="Prices & Competition" color="#166534">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Median Home" value={fmtDollar(d?.homeVal)} sub="Estimated value" highlight />
              {hasRedfin && <StatCard label="Sale-to-List" value={d?.saleToList ? `${d.saleToList}%` : 'N/A'} sub="Market heat" />}
              <StatCard label="Avg Property Tax" value={d?.avgTax ? `$${d.avgTax.toLocaleString()}/yr` : 'N/A'} sub={d?.taxRate ? `${d.taxRate}% rate` : ''} />
              <StatCard label="Median Income" value={fmtDollar(d?.income)} sub="Household/yr" />
            </div>
            {hasRedfin && d?.saleToList && (
              <SaleToListChart
                history={d.marketHistory || {
                  '90d': d.saleToList,
                  '6m': Math.round((d.saleToList - 1) * 10) / 10,
                  '1y': Math.round((d.saleToList - 2) * 10) / 10,
                  '3y': Math.round((d.saleToList - 4) * 10) / 10,
                  '5y': Math.round((d.saleToList - 6) * 10) / 10,
                }}
                isDerived={!d.marketHistory}
              />
            )}
            <PriceTrendChart townSlug={redfinSlug || townSlug || ''} />
          </Section>

          {/* When to Buy */}
          <div id="section-when-to-buy" className="scroll-mt-14">
            <MarketIntelligence
              townSlug={redfinSlug || townSlug || ''}
              saleToList={hasRedfin && !redfinProxyName ? d?.saleToList : undefined}
              proxyName={redfinProxyName ?? undefined}
            />
          </div>

          {/* Getting Around */}
          <Section id="section-getting-around" icon={<Train size={20} />} title="Getting Around" color="#d97706">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Commute widget */}
              <div className="col-span-2 md:col-span-1 rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="flex items-center border-b border-slate-100 px-3 py-2 gap-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex-1">Commute</span>
                  <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {(['nyc', 'philly', 'shore'] as const).map(dest => (
                      <button
                        key={dest}
                        onClick={() => {
                          setCommuteDest(dest);
                          if (dest !== 'nyc') fetchExtraCommutes(shoreTown);
                        }}
                        className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold transition-all ${
                          commuteDest === dest ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {dest === 'nyc' ? 'NYC' : dest === 'philly' ? 'PHL' : 'Shore'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  {commuteDest === 'nyc' && (
                    <>
                      <div className="text-2xl font-bold text-slate-900">{d?.commute ? `${d.commute} min` : '—'}</div>
                      <div className="text-[13px] font-mono text-slate-400 mt-0.5">To Penn Station, NYC</div>
                    </>
                  )}
                  {commuteDest === 'philly' && (
                    extraCommutesLoading
                      ? <div className="text-sm font-mono text-slate-400 animate-pulse flex items-center gap-1.5"><Zap size={10} className="text-[#d97706]" /> Estimating...</div>
                      : <>
                          <div className="text-2xl font-bold text-slate-900">{extraCommutes?.philly ? `${extraCommutes.philly} min` : '—'}</div>
                          <div className="text-[13px] font-mono text-slate-400 mt-0.5">To Center City, Philadelphia</div>
                        </>
                  )}
                  {commuteDest === 'shore' && (
                    <>
                      <input
                        value={shoreInput}
                        onChange={e => setShoreInput(e.target.value)}
                        onBlur={() => {
                          const v = shoreInput.trim();
                          if (v && v !== shoreTown) { setShoreTown(v); setExtraCommutes(null); fetchExtraCommutes(v); }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const v = shoreInput.trim();
                            if (v && v !== shoreTown) { setShoreTown(v); setExtraCommutes(null); fetchExtraCommutes(v); }
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="text-[13px] font-mono px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#d97706] w-full mb-2"
                        placeholder="Seaside Heights"
                      />
                      {extraCommutesLoading
                        ? <div className="text-sm font-mono text-slate-400 animate-pulse flex items-center gap-1.5"><Zap size={10} className="text-[#d97706]" /> Estimating...</div>
                        : <>
                            <div className="text-2xl font-bold text-slate-900">{extraCommutes?.shore ? `${extraCommutes.shore} min` : '—'}</div>
                            <div className="text-[13px] font-mono text-slate-400 mt-0.5">Drive to {shoreTown}</div>
                          </>
                      }
                    </>
                  )}
                </div>
              </div>
              <StatCard label="Walk Score" value={`${d?.walkScore ?? 'N/A'}/100`} sub={d?.walkLabel || ''} />
              <StatCard label="Regional Access" value={`${d?.highway ?? 'N/A'}/100`} sub="Highway & transit score" />
            </div>
            {(roadDetail || roadDetailLoading) && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Roads & Transit</div>
                {roadDetailLoading
                  ? <div className="flex items-center gap-2 text-slate-400 text-xs font-mono animate-pulse"><Zap size={10} className="text-[#d97706]" /> Looking up routes...</div>
                  : <div className="text-sm text-slate-600 font-mono">{roadDetail}</div>
                }
              </div>
            )}
            <ScoreBar value={d?.walkScore || 0} label="Walkability" />
          </Section>

          {/* Safety */}
          <Section
            id="section-safety"
            icon={<Shield size={20} />}
            title="Safety"
            color="#b91c1c"
            badge={
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                <Zap size={10} className="text-amber-500" />
                <span className="text-xs font-mono text-amber-700">AI estimated · not from official crime data</span>
              </div>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Safety Rating" value={d?.safetyLabel || 'N/A'} sub="Composite score" highlight={safetyScore >= 80} />
              <StatCard label="Safety Score" value={`${d?.safetyScore ?? 'N/A'}/100`} sub="vs NJ average" />
              <StatCard label="Town Size" value={d?.pop ? d.pop.toLocaleString() : 'N/A'} sub="Population" />
            </div>
            <ScoreBar value={safetyScore} label="Safety" />
          </Section>

          {/* Local Scene */}
          <Section id="section-local-scene" icon={<Coffee size={20} />} title="Local Scene" color="#0e7490">
            {localScene.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm font-mono animate-pulse py-4">
                <Zap size={12} className="text-[#0e7490]" />
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
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#0e7490]/15 border-l-[3px] border-l-[#0e7490]/40 hover:border-[#0e7490]/35 hover:border-l-[#0e7490] hover:bg-cyan-50/50 transition-all group shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#0e7490]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#0e7490] group-hover:bg-[#0e7490]/20 transition-colors">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#0e7490] transition-colors">{thing}</span>
                      <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#0e7490] transition-colors" />
                    </a>
                  ))}
                </div>
              </>
            )}
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

  const topPanel = open && variant === 'top' && (
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
  );

  const bottomPanel = (
    <AnimatePresence initial={false}>
      {open && variant === 'bottom' && (
        <motion.div
          key="bottom-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden mt-6"
        >
        <div className="bg-[#090f1a] rounded-2xl overflow-hidden border border-white/10"
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={ref} className="relative">
      {button}
      {topPanel}
      {bottomPanel}
    </div>
  );
}

function SaleToListChart({ history, isDerived }: { history: Record<string, number>; isDerived: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const entries = Object.entries(history) as [string, number][];
  const CHART_H = 128;
  const values = entries.map(([, v]) => v);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const pad = Math.max(0.5, (dataMax - dataMin) * 0.25);
  const MIN = Math.floor(dataMin - pad);
  const MAX = Math.ceil(dataMax + pad);

  const interp = (val: number) => {
    if (val >= 106) return 'Homes consistently selling above asking';
    if (val >= 103) return 'Buyers often going over list price';
    if (val >= 100) return 'Market near list — competitive but balanced';
    if (val >= 98) return 'Sellers accepting slight discounts';
    return 'Buyers have real negotiating room';
  };

  const refLineTop = CHART_H - ((100 - MIN) / (MAX - MIN)) * CHART_H;
  const latest = entries[0]?.[1] ?? 0;
  const oldest = entries[entries.length - 1]?.[1] ?? 0;
  const trend = Math.round((latest - oldest) * 10) / 10;
  const hoveredEntry = hovered ? entries.find(([p]) => p === hovered) : null;

  const maxAbsDev = Math.max(...values.map(v => Math.abs(v - 100)), 0.5);
  const HALF_H = 80;

  return (
    <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: '#f0f6fa', border: '1px solid #4786B830' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #2A427418' }}>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-mono uppercase tracking-wider font-semibold" style={{ color: '#2A4274' }}>vs. Asking Price</p>
          {isDerived && <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#4786B8', background: '#4786B820' }}>est.</span>}
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold font-mono"
          style={{ background: trend > 0 ? '#66D6B130' : '#4786B820', color: trend > 0 ? '#40968C' : '#4786B8' }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          <span className="font-normal opacity-70 ml-0.5">vs 5y ago</span>
        </div>
      </div>

      {/* Hover readout */}
      <div className="px-5 py-2 min-h-[34px] flex items-center" style={{ borderBottom: '1px solid #2A427418', background: '#2A42740c' }}>
        {hoveredEntry ? (
          <p className="text-[12px] font-mono">
            <span className="font-bold mr-2" style={{ color: hoveredEntry[1] >= 100 ? '#40968C' : '#4786B8' }}>
              {hoveredEntry[1] >= 100 ? '+' : ''}{(hoveredEntry[1] - 100).toFixed(1)}% asking
            </span>
            <span style={{ color: '#2A427465' }}>{interp(hoveredEntry[1])}</span>
          </p>
        ) : (
          <span className="text-[12px] font-mono italic" style={{ color: '#2A427438' }}>Hover for details</span>
        )}
      </div>

      {/* Chart — deviation from 100% */}
      <div className="px-5 pt-4 pb-3">
        <div className="relative" style={{ height: HALF_H * 2 + 28 }}>
          {/* Asking baseline */}
          <div className="absolute left-0 right-0 z-10 pointer-events-none flex items-center gap-2" style={{ top: HALF_H }}>
            <div className="flex-1" style={{ borderTop: '2px solid #2A427435' }} />
            <span className="text-xs font-mono font-bold shrink-0" style={{ color: '#2A427455' }}>asking</span>
          </div>

          {/* Bars */}
          <div className="absolute left-0 right-0 flex items-center gap-2.5" style={{ top: 0, height: HALF_H * 2 }}>
            {entries.map(([period, val]) => {
              const dev = val - 100;
              const isHov = hovered === period;
              const barH = Math.max(3, (Math.abs(dev) / maxAbsDev) * HALF_H);
              const above = dev >= 0;
              const devLabel = `${above ? '+' : ''}${dev.toFixed(1)}%`;

              return (
                <div
                  key={period}
                  className="flex-1 flex flex-col cursor-default"
                  style={{ height: HALF_H * 2 }}
                  onMouseEnter={() => setHovered(period)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Top half — above asking */}
                  <div className="flex flex-col justify-end" style={{ height: HALF_H }}>
                    {above && (
                      <>
                        <div className="text-center text-[12px] font-mono font-bold mb-1.5" style={{ color: isHov ? '#2A4274' : '#40968C' }}>
                          {devLabel}
                        </div>
                        <div className="w-full rounded-t-md transition-all duration-200" style={{
                          height: barH,
                          background: isHov ? '#66D6B1' : '#66D6B170',
                          borderTop: `2px solid #40968C`,
                        }} />
                      </>
                    )}
                  </div>
                  {/* Bottom half — below asking */}
                  <div className="flex flex-col justify-start" style={{ height: HALF_H }}>
                    {!above && (
                      <>
                        <div className="w-full rounded-b-md transition-all duration-200" style={{
                          height: barH,
                          background: isHov ? '#4786B850' : '#4786B828',
                          borderBottom: `2px solid #4786B8`,
                        }} />
                        <div className="text-center text-[12px] font-mono font-bold mt-1.5" style={{ color: isHov ? '#2A4274' : '#4786B8' }}>
                          {devLabel}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Period labels */}
          <div className="absolute left-0 right-0 flex gap-2.5" style={{ bottom: 0 }}>
            {entries.map(([period]) => (
              <div key={period} className="flex-1 text-center">
                <span className="text-xs font-mono uppercase tracking-wider transition-colors"
                  style={{ color: hovered === period ? '#2A4274' : '#4786B860', fontWeight: hovered === period ? 700 : 400 }}>
                  {period}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color, children, badge, id }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode; badge?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="rounded-2xl p-6 scroll-mt-14" style={{ border: `1px solid ${color}30` }}>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900">{title}</h2>
        {badge}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${highlight ? 'bg-blue-50 border-[#0471A4]/20' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-[#0471A4]' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[13px] text-slate-400 font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

function ExpandableStatCard({ label, value, sub, highlight, onExpand, expandedContent }: {
  label: string; value: string; sub?: string; highlight?: boolean;
  onExpand?: () => void;
  expandedContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!open && onExpand) onExpand();
    setOpen(o => !o);
  };

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer select-none ${highlight ? 'bg-blue-50 border-[#0471A4]/20' : 'bg-slate-50 border-slate-100'} ${open ? 'shadow-sm' : 'hover:shadow-sm'}`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-xl font-bold ${highlight ? 'text-[#0471A4]' : 'text-slate-900'}`}>{value}</div>
        {sub && <div className="text-[13px] text-slate-400 font-mono mt-0.5">{sub}</div>}
        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-xs font-mono font-semibold transition-all ${
          open ? 'bg-[#0471A4]/10 text-[#0471A4]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
        }`}>
          <span>{open ? 'Hide' : 'See details'}</span>
          <ChevronRight size={11} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 text-[13px] font-mono text-slate-500 border-t border-slate-100 pt-3">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? '#10b981' : value >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-[13px] font-mono font-bold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
