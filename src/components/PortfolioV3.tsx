import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ChevronRight } from 'lucide-react';

export default function PortfolioV3() {
  return (
    <div className="bg-[#F5F5F3] font-sans text-slate-900 min-h-screen selection:bg-blue-100 pb-24">

      {/* Preview Switcher */}
      <div className="fixed top-0 left-0 right-0 z-[300] bg-slate-900 text-white text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-6 py-2 border-b border-white/10">
        <span className="text-slate-500">Preview:</span>
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Current</Link>
        <Link to="/portfolio-v2" className="text-slate-400 hover:text-white transition-colors">Option 2</Link>
        <span className="bg-white text-slate-900 px-2 py-0.5 font-black">Option 3</span>
      </div>

      {/* ── BENTO HERO ── */}
      <section className="pt-8 px-3 md:px-5 pb-3 md:pb-5">
        {/* Desktop bento: 3 cols, 2 rows */}
        <div className="hidden md:grid gap-3 md:gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', minHeight: 'calc(100vh - 2.5rem)' }}>

          {/* Cell 1 — Identity (row-span-2) */}
          <div className="row-span-2 bg-white rounded-2xl p-10 flex flex-col justify-between border border-slate-200/60">
            <div className="flex justify-between items-start font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div>004+<br />Projects</div>
              <div className="text-slate-900">Portfolio</div>
              <div>EN</div>
            </div>

            <div>
              <h1
                className="text-[clamp(42px,5.5vw,88px)] font-black text-slate-900 tracking-[-0.05em] leading-[0.85] mb-6"
                style={{ fontFamily: "'BakersLocal', serif" }}
              >
                Tariq<br />Shaikh
              </h1>
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Senior Data Strategist</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Indeed · New Jersey</div>
            </div>

            <p className="text-[13px] leading-relaxed text-slate-500 font-sans max-w-[22ch]">
                Bridging data, strategy, and product at scale.
              </p>
          </div>

          {/* Cell 2 — Homebase NJ */}
          <div className="bg-[#090E1A] rounded-2xl p-8 flex flex-col justify-between border border-white/5 hover:border-blue-500/40 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-full">Live Product</span>
              <span className="font-mono text-[9px] text-slate-500 font-bold">P.001</span>
            </div>
            <div>
              <h3 className="text-[26px] leading-tight mb-1 text-white">
                <span className="font-serif font-bold">Homebase</span>
                <span className="font-sans font-black text-blue-400 ml-1.5">NJ</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-[11px] mb-4 uppercase tracking-wider">Product Design & Data Strategy</p>
              <p className="text-[13px] leading-relaxed text-slate-400 line-clamp-2">I collapsed 6 browser tabs into one weighted comparison tool for real estate decisions.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Consumer', 'Real Estate', 'Data Product'].map(t => (
                <span key={t} className="font-mono text-[8px] px-2 py-0.5 bg-blue-500/10 text-blue-300/80 border border-blue-500/20 tracking-widest uppercase font-bold">{t}</span>
              ))}
            </div>
            <Link to="/homebase" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-blue-600 to-cyan-400 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-shadow">
              Launch <ChevronRight size={12} />
            </Link>
          </div>

          {/* Cell 3 — Waves */}
          <div className="bg-[#0B1A1F] rounded-2xl p-8 flex flex-col justify-between border border-white/5 hover:border-cyan-500/40 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold rounded-full">Live Product</span>
              <span className="font-mono text-[9px] text-slate-500 font-bold">P.002</span>
            </div>
            <div>
              <h3 className="text-[26px] leading-tight mb-1 text-white">
                <span className="font-serif font-bold italic">Waves</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-[11px] mb-4 uppercase tracking-wider">Destination intelligence</p>
              <p className="text-[13px] leading-relaxed text-slate-400 line-clamp-2">Destination intelligence for dream trips. Visualizing when to go and what to see.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Travel', 'Data Viz', 'AI'].map(t => (
                <span key={t} className="font-mono text-[8px] px-2 py-0.5 bg-cyan-500/10 text-cyan-300/80 border border-cyan-500/20 tracking-widest uppercase font-bold">{t}</span>
              ))}
            </div>
            <Link to="/waves" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-cyan-600 to-teal-300 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow">
              Launch <ChevronRight size={12} />
            </Link>
          </div>

          {/* Cell 4 — Orbit */}
          <div className="bg-[#1A1C1E] rounded-2xl p-8 flex flex-col justify-between border border-white/5 hover:border-[#C5A059]/40 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C5A059] to-[#E5C079] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold rounded-full">Live Product</span>
              <span className="font-mono text-[9px] text-slate-500 font-bold">P.003</span>
            </div>
            <div>
              <h3 className="text-[26px] leading-tight mb-1 text-white">
                <span className="font-serif font-bold italic">Orbit</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-[11px] mb-4 uppercase tracking-wider">Financial Simulation & Strategy</p>
              <p className="text-[13px] leading-relaxed text-slate-400 line-clamp-2">A financial trajectory simulator designed to map annual cash flow and sinking funds — so big irregular expenses never catch you off guard.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Fintech', 'Simulation', 'Strategy'].map(t => (
                <span key={t} className="font-mono text-[8px] px-2 py-0.5 bg-[#C5A059]/10 text-[#D4B470] border border-[#C5A059]/20 tracking-widest uppercase font-bold">{t}</span>
              ))}
            </div>
            <Link to="/orbit" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-[#C5A059] to-[#F0D585] text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] transition-shadow">
              Launch <ChevronRight size={12} />
            </Link>
          </div>

          {/* Cell 5 — Stealth App */}
          <div className="bg-[#0A0A0A] rounded-2xl p-8 flex flex-col justify-between border border-white/5 hover:border-violet-500/30 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-700 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(255,255,255,0.008)_40px,rgba(255,255,255,0.008)_41px)] pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold rounded-full">In Development</span>
              <span className="font-mono text-[9px] text-slate-600 font-bold">P.004</span>
            </div>
            <div>
              <h3 className="text-[26px] leading-tight mb-1 text-white/80">
                <span className="font-serif font-bold">◼ Stealth</span>
              </h3>
              <p className="font-serif italic text-slate-600 text-[11px] mb-4 uppercase tracking-wider">Details redacted</p>
              <p className="text-[13px] leading-relaxed text-slate-600 line-clamp-2">Something is being built. It ships when it's ready.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['AI', 'Product', 'Tools'].map(t => (
                <span key={t} className="font-mono text-[8px] px-2 py-0.5 bg-violet-500/5 text-violet-500/40 border border-violet-500/10 tracking-widest uppercase font-bold">{t}</span>
              ))}
            </div>
            <div className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-none cursor-not-allowed select-none">
              Classified ◼
            </div>
          </div>
        </div>

        {/* Mobile fallback — stacked */}
        <div className="md:hidden flex flex-col gap-3 pt-2">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/60">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">Portfolio</div>
            <div className="text-[42px] font-black text-slate-900 tracking-tight leading-[0.85] mb-4" style={{ fontFamily: "'BakersLocal', serif" }}>Tariq<br />Shaikh</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Senior Data Strategist · Indeed</div>
            <p className="text-[13px] text-slate-500 mt-4">Bridging data, strategy, and product at scale.</p>
          </div>
          {[
            { bg: 'bg-[#090E1A]', accentBorder: 'hover:border-blue-500/40', bar: 'from-blue-600 to-cyan-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'P.001', title: <><span className="font-serif font-bold">Homebase</span><span className="font-sans font-black text-blue-400 ml-1.5">NJ</span></>, sub: 'Product Design & Data Strategy', desc: 'I collapsed 6 browser tabs into one weighted comparison tool for real estate decisions.', tags: ['Consumer', 'Real Estate'], tagCls: 'bg-blue-500/10 text-blue-300/80 border-blue-500/20', btn: 'from-blue-600 to-cyan-400', href: '/homebase', btnColor: 'text-white' },
            { bg: 'bg-[#0B1A1F]', accentBorder: 'hover:border-cyan-500/40', bar: 'from-cyan-600 to-teal-400', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20', label: 'P.002', title: <span className="font-serif font-bold italic">Waves</span>, sub: 'Destination intelligence', desc: 'Destination intelligence for dream trips. Visualizing when to go and what to see.', tags: ['Travel', 'AI'], tagCls: 'bg-cyan-500/10 text-cyan-300/80 border-cyan-500/20', btn: 'from-cyan-600 to-teal-300', href: '/waves', btnColor: 'text-white' },
            { bg: 'bg-[#1A1C1E]', accentBorder: 'hover:border-[#C5A059]/40', bar: 'from-[#C5A059] to-[#E5C079]', badge: 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20', label: 'P.003', title: <span className="font-serif font-bold italic">Orbit</span>, sub: 'Financial Simulation', desc: 'A financial trajectory simulator designed to map annual cash flow and sinking funds.', tags: ['Fintech', 'Strategy'], tagCls: 'bg-[#C5A059]/10 text-[#D4B470] border-[#C5A059]/20', btn: 'from-[#C5A059] to-[#F0D585]', href: '/orbit', btnColor: 'text-black' },
          ].map((p, i) => (
            <div key={i} className={`${p.bg} rounded-2xl p-8 border border-white/5 ${p.accentBorder} transition-all group relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${p.bar} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between mb-5">
                <span className={`font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest ${p.badge} border font-bold rounded-full`}>Live Product</span>
                <span className="font-mono text-[9px] text-slate-500 font-bold">{p.label}</span>
              </div>
              <h3 className="text-2xl text-white mb-1">{p.title}</h3>
              <p className="font-serif italic text-slate-500 text-[11px] mb-3 uppercase tracking-wider">{p.sub}</p>
              <p className="text-[13px] leading-relaxed text-slate-400 mb-4">{p.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tags.map(t => <span key={t} className={`font-mono text-[8px] px-2 py-0.5 ${p.tagCls} border tracking-widest uppercase font-bold`}>{t}</span>)}
              </div>
              <Link to={p.href} className={`inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-br ${p.btn} ${p.btnColor} text-[9px] font-black uppercase tracking-[0.2em]`}>
                Launch <ChevronRight size={12} />
              </Link>
            </div>
          ))}
          {/* Stealth — mobile */}
          <div className="bg-[#0A0A0A] rounded-2xl p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(255,255,255,0.008)_40px,rgba(255,255,255,0.008)_41px)] pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold rounded-full">In Development</span>
              <span className="font-mono text-[9px] text-slate-600 font-bold">P.004</span>
            </div>
            <h3 className="text-2xl text-white/80 mb-1"><span className="font-serif font-bold">◼ Stealth</span></h3>
            <p className="font-serif italic text-slate-600 text-[11px] mb-3 uppercase tracking-wider">Details redacted</p>
            <p className="text-[13px] leading-relaxed text-slate-600 mb-4">Something is being built. It ships when it's ready.</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {['AI', 'Product', 'Tools'].map(t => <span key={t} className="font-mono text-[8px] px-2 py-0.5 bg-violet-500/5 text-violet-500/40 border border-violet-500/10 tracking-widest uppercase font-bold">{t}</span>)}
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] cursor-not-allowed">Classified ◼</div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-12 py-32 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">02 — Operating Model</span>
            <h2 className="font-display text-[clamp(40px,7vw,96px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter mt-6">
              The <br /><span className="text-slate-300">Method</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
            {[
              { num: '01', title: 'Definition', desc: 'Identify a user problem that can be articulated in a single sentence. Logic over ego.' },
              { num: '02', title: 'Specifications', desc: 'Write the PRD. Define metrics, constraints, and non-goals before opening the IDE.' },
              { num: '03', title: 'Execution', desc: 'Build the functional core. Ship a V1 that solves the primary friction point immediately.' },
              { num: '04', title: 'Refinement', desc: 'Synthesize feedback and performance data to inform the roadmap for V2 and beyond.' },
            ].map((step, i) => (
              <div key={i} className="p-12 bg-white group hover:bg-slate-50 transition-colors">
                <div className="font-display text-[48px] font-black text-slate-100 leading-none mb-8 group-hover:text-blue-100 transition-colors">{step.num}</div>
                <div className="font-display text-lg font-black mb-4 text-slate-900 uppercase tracking-tight">{step.title}</div>
                <p className="text-base leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-12 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">03 — About</span>
              <h2 className="font-display text-[clamp(40px,7vw,96px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter mt-12 mb-12">
                The<br /><span className="text-slate-300">Builder</span>
              </h2>
              <div className="bg-slate-50 p-8 border-l-2 border-slate-900">
                <p className="text-lg leading-relaxed text-slate-600 italic">
                  "I specialize in bridging the gap between deep technical implementation and boardroom-level product decisions."
                </p>
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col justify-end gap-12">
              <p className="text-[28px] leading-[1.2] text-slate-900 font-sans tracking-tight max-w-xl">
                I am a <strong className="font-black">Senior Data Strategist at Indeed</strong> with a decade of experience operating at the convergence of high-scale data and product.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-6">Expertise — Product</div>
                  <ul className="text-sm font-black text-slate-900 uppercase tracking-tight flex flex-col gap-4">
                    <li>Roadmap Ownership</li><li>A/B Experimentation</li><li>User Research</li><li>0→1 Launches</li>
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-6">Expertise — Technical</div>
                  <ul className="text-sm font-black text-slate-900 uppercase tracking-tight flex flex-col gap-4">
                    <li>React / TypeScript</li><li>SQL & Data Viz</li><li>Data Automation</li><li>Product Arch.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-12 py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-16">
          <div className="flex flex-col gap-6">
            <div className="font-mono text-[10px] text-slate-400 tracking-[0.4em] uppercase font-bold">Archive — © 2026</div>
            <div className="font-display text-[clamp(24px,4vw,40px)] font-black text-slate-900 uppercase tracking-tighter">Tariq Shaikh</div>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="flex flex-col gap-6">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-widest">Connect</span>
              <div className="flex flex-col gap-3">
                <a href="mailto:tshaikh92@gmail.com" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">Email</a>
                <a href="https://linkedin.com/in/tariqshaikh" target="_blank" rel="noreferrer" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">LinkedIn</a>
                <a href="https://github.com/tariqshaikh" target="_blank" rel="noreferrer" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">GitHub</a>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-widest">Reach</span>
              <a href="tel:8483914393" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">848.391.4393</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
