import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';

const PALETTES = {
  A: {
    label: 'Neon Abyss',
    desc: 'Near-black void · bioluminescent mint glows against darkness',
    light: false,
    bg: '#01090B',
    card: '#061418',
    navBg: '#01090Bee',
    accentText: '#00FFE0',
    bodyText: 'rgba(255,255,255,0.85)',
    subText: 'rgba(255,255,255,0.3)',
    mutedText: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.05)',
    glowOrb: 'rgba(0,255,224,0.09)',
    btnFrom: '#00FFE0', btnTo: '#00B4D8',
    btnGlow: 'rgba(0,255,224,0.45)',
    btnTextDark: true,
    logoA: '#00FFE0', logoB: '#00CFFF',
    formGlow: 'from-[#00FFE0]/20 via-cyan-400/15 to-[#00CFFF]/10',
    dotColor: '#00FFE0', dotGlow: 'rgba(0,255,224,0.95)',
    pillHoverBg: 'rgba(0,255,224,0.1)', pillHoverBorder: 'rgba(0,255,224,0.3)',
    barActive: ['#00FFE055', '#00FFE0cc'],
    tagBg: 'rgba(0,255,224,0.08)', tagBorder: 'rgba(0,255,224,0.2)',
  },
  B: {
    label: 'Deep Reef',
    desc: 'Background IS dark teal · seafoam accents · already underwater',
    light: false,
    bg: '#071E1A',
    card: '#0C2E27',
    navBg: '#071E1Aee',
    accentText: '#7FFFDE',
    bodyText: 'rgba(255,255,255,0.85)',
    subText: 'rgba(255,255,255,0.3)',
    mutedText: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.05)',
    glowOrb: 'rgba(127,255,222,0.08)',
    btnFrom: '#2DD4BF', btnTo: '#059669',
    btnGlow: 'rgba(5,150,105,0.55)',
    btnTextDark: false,
    logoA: '#7FFFDE', logoB: '#2DD4BF',
    formGlow: 'from-emerald-400/25 via-teal-400/20 to-cyan-400/10',
    dotColor: '#7FFFDE', dotGlow: 'rgba(127,255,222,0.9)',
    pillHoverBg: 'rgba(45,212,191,0.12)', pillHoverBorder: 'rgba(45,212,191,0.35)',
    barActive: ['#05966955', '#2DD4BFcc'],
    tagBg: 'rgba(127,255,222,0.08)', tagBorder: 'rgba(127,255,222,0.2)',
  },
  C: {
    label: 'Cyan Surge · Sand',
    desc: 'Warm sand base · open-water cyan · beach meets ocean',
    light: true,
    bg: '#FDFAF5',
    card: '#FFFDF6',
    navBg: 'rgba(250,246,236,0.92)',
    accentText: '#0891B2',
    bodyText: '#0A1A2E',
    subText: '#64748B',
    mutedText: '#94A3B8',
    borderColor: 'rgba(0,0,0,0.07)',
    inputBg: 'rgba(8,145,178,0.04)',
    glowOrb: 'rgba(0,210,255,0.15)',
    btnFrom: '#00C4CC', btnTo: '#0369A1',
    btnGlow: 'rgba(0,196,204,0.4)',
    btnTextDark: false,
    logoA: '#00C4CC', logoB: '#0891B2',
    formGlow: 'from-cyan-400/25 via-sky-400/15 to-cyan-300/10',
    dotColor: '#0891B2', dotGlow: 'rgba(8,145,178,0.7)',
    pillHoverBg: 'rgba(8,145,178,0.07)', pillHoverBorder: 'rgba(8,145,178,0.25)',
    barActive: ['#0369A155', '#00C4CCcc'],
    tagBg: 'rgba(8,145,178,0.06)', tagBorder: 'rgba(8,145,178,0.18)',
  },
} as const;

type PaletteKey = keyof typeof PALETTES;

function WavesLogo({ a, b, id }: { a: string; b: string; id: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={id} x1="4" y1="20" x2="28" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor={a} /><stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <path d="M4 20C4 20 10 12 16 20C22 28 28 20 28 20" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14C8 14 12 8 16 14C20 20 24 14 24 14" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  );
}

const TRENDING = ['Kyoto', 'Amalfi Coast', 'Reykjavik', 'Patagonia', 'Santorini', 'Marrakech'];
const MONTHS   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const COSTS    = [820,  780,  700,  650,  690,  860,  940,  980,  750,  680,  710,  900];

function ThemePanel({ p, pid }: { p: typeof PALETTES.A; pid: string }) {
  const [hoveredPill, setHoveredPill] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const selectedMonth = 9;

  return (
    <div style={{ background: p.bg }}>

      {/* Nav */}
      <nav className="border-b px-8 h-16 flex items-center"
        style={{ background: p.navBg, borderColor: p.borderColor, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <WavesLogo a={p.logoA} b={p.logoB} id={`logo_${pid}`} />
          <span className="font-medium tracking-widest text-sm uppercase" style={{ color: p.accentText }}>Waves</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-start pt-16 px-8 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: p.glowOrb }} />
        </div>

        <h1 className="text-5xl font-light tracking-tight mb-10 text-center font-serif relative z-10"
          style={{ color: p.bodyText }}>
          Where will the{' '}
          <span className="italic" style={{ color: p.accentText, textShadow: p.light ? `0 0 30px ${p.dotGlow}` : `0 0 40px ${p.dotGlow}` }}>
            waves
          </span>{' '}
          take you?
        </h1>

        {/* Search card */}
        <div className="relative w-full max-w-2xl mb-10 z-10">
          <div className={`absolute -inset-1 bg-gradient-to-r ${p.formGlow} rounded-[2rem] blur-lg opacity-60`} />
          <div className="relative rounded-[2rem] p-4 flex flex-col md:flex-row items-center gap-4 shadow-xl border"
            style={{ background: p.card, borderColor: p.borderColor }}>
            <div className="flex-1 flex items-center w-full rounded-2xl px-5 py-4 border"
              style={{ background: p.inputBg, borderColor: p.borderColor }}>
              <Sparkles size={20} className="mr-4 shrink-0" style={{ color: p.accentText }} />
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: p.subText }}>Dream Location</div>
                <div className="font-light text-lg" style={{ color: p.bodyText }}>Tokyo, Japan</div>
              </div>
            </div>
            <button className="w-full md:w-auto px-10 py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-3 shrink-0"
              style={{
                background: `linear-gradient(to right, ${p.btnFrom}, ${p.btnTo})`,
                color: p.btnTextDark ? '#010A0B' : 'white',
              }}>
              <Search size={16} />
              Analyze Trip
            </button>
          </div>
        </div>

        {/* Trending pills */}
        <div className="z-10 w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full"
              style={{ background: p.dotColor, boxShadow: `0 0 8px ${p.dotGlow}` }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: p.subText }}>Trending destinations</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {TRENDING.map((name, i) => (
              <button key={name}
                onMouseEnter={() => setHoveredPill(i)}
                onMouseLeave={() => setHoveredPill(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
                style={{
                  background: hoveredPill === i ? p.pillHoverBg : p.light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                  borderColor: hoveredPill === i ? p.pillHoverBorder : p.borderColor,
                }}>
                <span className="text-[9px] font-mono" style={{ color: p.mutedText }}>#{i + 1}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold transition-colors"
                  style={{ color: hoveredPill === i ? p.accentText : p.light ? '#334155' : 'rgb(203,213,225)' }}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results strip */}
      <div className="border-t flex" style={{ borderColor: p.borderColor }}>
        {/* Sidebar */}
        <div className="w-56 p-7 border-r shrink-0 flex flex-col justify-center"
          style={{ background: p.light ? '#F7F2E8' : p.card, borderColor: p.borderColor }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full"
              style={{ background: p.dotColor, boxShadow: `0 0 10px ${p.dotGlow}` }} />
            <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: p.accentText }}>
              Optimal Window
            </span>
          </div>
          <div className="text-2xl font-serif leading-tight mb-1" style={{ color: p.bodyText }}>
            Autumn<br />in{' '}
            <span className="italic" style={{ color: p.accentText }}>Kyoto.</span>
          </div>
          <div className="text-[11px] mt-4 font-mono" style={{ color: p.subText }}>Oct · Nov ideal</div>
          <div className="mt-5 flex flex-col gap-2">
            {['Best weather', 'Value season', 'Low crowds'].map(tag => (
              <div key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit border"
                style={{ background: p.tagBg, borderColor: p.tagBorder }}>
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: p.accentText }}>
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 p-7 flex flex-col justify-end">
          <div className="text-[9px] uppercase tracking-widest mb-4" style={{ color: p.mutedText }}>
            Avg flight cost by month
          </div>
          <div className="flex items-end gap-[3px] h-24">
            {MONTHS.map((m, i) => {
              const max = Math.max(...COSTS);
              const h = Math.round((COSTS[i] / max) * 100);
              const isSel = i === selectedMonth;
              const isHov = hoveredMonth === i;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}>
                  <div className="w-full rounded-sm transition-all duration-150" style={{
                    height: `${h}%`,
                    background: isSel
                      ? `linear-gradient(to top, ${p.barActive[0]}, ${p.barActive[1]})`
                      : isHov
                      ? p.light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)'
                      : p.light ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.07)',
                    boxShadow: isSel ? `0 0 10px ${p.dotGlow}` : 'none',
                  }} />
                  <span className="text-[7px] font-mono" style={{ color: isSel ? p.accentText : p.mutedText }}>
                    {m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WavesThemePreview() {
  const [active, setActive] = useState<PaletteKey>('C');
  const p = PALETTES[active];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020407' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/10 px-6 py-3 flex items-center justify-between"
        style={{ background: '#020407f0', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-amber-400">Theme Preview</span>
          <div className="flex gap-1.5">
            {(Object.keys(PALETTES) as PaletteKey[]).map(key => {
              const pal = PALETTES[key];
              const isActive = key === active;
              return (
                <button key={key} onClick={() => setActive(key)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-[10px] tracking-wider transition-all"
                  style={{
                    borderColor: isActive ? `${pal.dotColor}90` : 'rgba(255,255,255,0.12)',
                    background: isActive ? `${pal.dotColor}18` : 'transparent',
                    color: isActive ? pal.accentText : 'rgba(255,255,255,0.3)',
                    boxShadow: isActive ? `0 0 16px ${pal.btnGlow}` : 'none',
                  }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pal.dotColor }} />
                  {key} · {pal.label}
                </button>
              );
            })}
          </div>
        </div>
        <Link to="/waves" className="font-mono text-[10px] tracking-widest uppercase text-white/25 hover:text-white/50 transition-colors">
          ← Waves
        </Link>
      </div>

      {/* Descriptor */}
      <div className="px-8 py-2.5 border-b border-white/5 flex items-center gap-6" style={{ background: p.light ? '#E0F7FA' : p.bg }}>
        <span className="font-mono text-[11px]" style={{ color: p.accentText }}>{p.desc}</span>
        <span className="font-mono text-[10px]" style={{ color: p.mutedText }}>{p.bg} · {p.card} · {p.accentText}</span>
      </div>

      {/* Panel */}
      <ThemePanel key={active} p={p} pid={active} />

      {/* Swatches */}
      <div className="border-t border-white/10 px-8 py-5 flex gap-10" style={{ background: '#020407' }}>
        {(Object.keys(PALETTES) as PaletteKey[]).map(key => {
          const pal = PALETTES[key];
          return (
            <button key={key} onClick={() => setActive(key)} className="text-left">
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2 transition-colors"
                style={{ color: active === key ? pal.accentText : 'rgba(255,255,255,0.2)' }}>
                {key} · {pal.label}
              </p>
              <div className="flex gap-1.5">
                {[pal.bg, pal.card, pal.accentText, pal.btnFrom, pal.btnTo].map((c, i) => (
                  <div key={i} title={c} className="w-8 h-8 rounded-lg border border-white/10" style={{ background: c }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
