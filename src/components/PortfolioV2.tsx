import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PROJECTS = [
  {
    id: 'homebase',
    label: 'P.001',
    badge: 'Live Product',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bg: 'bg-[#090E1A]',
    accent: 'from-blue-600 to-cyan-400',
    accentBorder: 'hover:border-blue-500/50',
    accentShadow: 'hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.15)]',
    barAccent: 'from-blue-600 to-cyan-400',
    leftBar: 'bg-blue-500/30',
    tagClass: 'bg-blue-500/10 text-blue-300/80 border-blue-500/20',
    btnClass: 'from-blue-600 to-cyan-400',
    btnShadow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]',
    title: <><span className="font-serif font-bold text-white">Homebase</span><span className="font-sans font-black text-blue-400 ml-1">NJ</span></>,
    subtitle: 'Product Design & Data Strategy',
    desc: 'I collapsed 6 browser tabs into one weighted comparison tool built for real-world real estate decisions.',
    tags: ['Consumer', 'Real Estate', 'Data Product'],
    href: '/homebase',
  },
  {
    id: 'waves',
    label: 'P.002',
    badge: 'Live Product',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    bg: 'bg-[#0B1A1F]',
    accent: 'from-cyan-600 to-teal-300',
    accentBorder: 'hover:border-cyan-500/50',
    accentShadow: 'hover:shadow-[0_32px_64px_-16px_rgba(6,182,212,0.15)]',
    barAccent: 'from-cyan-600 to-teal-400',
    leftBar: 'bg-cyan-500/30',
    tagClass: 'bg-cyan-500/10 text-cyan-300/80 border-cyan-500/20',
    btnClass: 'from-cyan-600 to-teal-300',
    btnShadow: 'hover:shadow-[0_0_24px_rgba(6,182,212,0.5)]',
    title: <><span className="font-serif font-bold italic text-white">Waves</span></>,
    subtitle: 'Dream trip planner & destination intelligence',
    desc: 'Destination intelligence for dream trips. Visualizing when to go and what to see.',
    tags: ['Travel', 'Data Viz', 'Collaboration'],
    href: '/waves',
  },
];

const ORBIT = {
  id: 'orbit',
  label: 'P.003',
  badge: 'Live Product',
  badgeClass: 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20',
  bg: 'bg-[#1A1C1E]',
  accentBorder: 'hover:border-[#C5A059]/50',
  accentShadow: 'hover:shadow-[0_32px_64px_-16px_rgba(197,160,89,0.15)]',
  barAccent: 'from-[#C5A059] to-[#E5C079]',
  leftBar: 'bg-[#C5A059]/30',
  tagClass: 'bg-[#C5A059]/10 text-[#D4B470] border-[#C5A059]/20',
  btnClass: 'from-[#C5A059] to-[#F0D585]',
  btnShadow: 'hover:shadow-[0_0_24px_rgba(197,160,89,0.45)]',
  btnTextDark: true,
  title: <><span className="font-serif font-bold italic text-white">Orbit</span></>,
  subtitle: 'Financial Simulation & Strategy',
  desc: 'A financial trajectory simulator designed to map annual cash flow and sinking funds.',
  tags: ['Fintech', 'Simulation', 'Strategy'],
  href: '/orbit',
};

function ProjectCard({ p, span2 = false }: { p: typeof PROJECTS[0] | typeof ORBIT; span2?: boolean }) {
  return (
    <div className={`${(p as any).bg} border border-white/5 p-8 md:p-10 transition-all duration-500 ${(p as any).accentBorder} ${(p as any).accentShadow} relative overflow-hidden rounded-2xl group ${span2 ? 'md:col-span-2 md:max-w-2xl md:mx-auto md:w-full' : ''}`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${(p as any).barAccent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center justify-between mb-8">
        <span className={`font-mono text-[9px] px-3 py-1 uppercase tracking-widest ${(p as any).badgeClass} border font-bold rounded-full`}>{p.badge}</span>
        <span className="font-mono text-[10px] text-slate-400 font-bold tracking-tighter">{p.label}</span>
      </div>
      <h3 className="text-[28px] md:text-[32px] leading-tight mb-2 text-white">{p.title}</h3>
      <p className="font-serif italic text-slate-400 text-xs mb-5 uppercase tracking-wider">{p.subtitle}</p>
      <div className="relative mb-8">
        <div className={`absolute left-0 top-0 bottom-0 w-px ${(p as any).leftBar}`} />
        <p className="text-[14px] leading-[1.6] text-slate-300 pl-6 font-sans">{p.desc}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {p.tags.map(tag => (
          <span key={tag} className={`font-mono text-[9px] px-2 py-0.5 ${(p as any).tagClass} border tracking-widest uppercase font-bold`}>{tag}</span>
        ))}
      </div>
      <Link
        to={p.href}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br ${(p as any).btnClass} ${(p as any).btnTextDark ? 'text-black' : 'text-white'} text-[10px] font-black uppercase tracking-[0.2em] rounded-none ${(p as any).btnShadow}`}
      >
        Launch Application <ChevronRight size={14} />
      </Link>
    </div>
  );
}

export default function PortfolioV2() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white font-sans text-slate-900 min-h-screen selection:bg-blue-100 pb-24">

      {/* Preview Switcher */}
      <div className="fixed top-0 left-0 right-0 z-[300] bg-slate-900 text-white text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-6 py-2 border-b border-white/10">
        <span className="text-slate-500">Preview:</span>
        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Current</Link>
        <span className="bg-white text-slate-900 px-2 py-0.5 font-black">Option 2</span>
        <Link to="/portfolio-v3" className="text-slate-400 hover:text-white transition-colors">Option 3</Link>
      </div>

      {/* Slim Header */}
      <header className="mt-8 bg-[#F5F5F3] px-8 md:px-12 py-5 flex items-center justify-between border-b border-slate-200/80">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-0.5">Portfolio</div>
          <div className="font-black text-slate-900 text-xl md:text-2xl tracking-tight" style={{ fontFamily: "'BakersLocal', serif" }}>
            Tariq Shaikh
          </div>
        </div>
        <div className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Senior Data Strategist · Indeed
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={17} /></a>
          <a href="https://linkedin.com/in/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={17} /></a>
          <a href="mailto:tshaikh92@gmail.com" className="text-slate-400 hover:text-slate-900 transition-colors"><Mail size={17} /></a>
        </div>
      </header>

      {/* Projects — immediately visible */}
      <section className="px-6 md:px-12 pt-14 pb-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">01</span>
              </div>
              <h2 className="font-display text-[clamp(40px,6.5vw,72px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter">
                What I am <br />
                <span className="text-slate-300">Building...</span>
              </h2>
            </div>
            <p className="text-slate-500 font-sans text-lg max-w-sm leading-relaxed pb-2">
              A curated selection of applications designed to solve genuine needs through a product-driven approach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {PROJECTS.map(p => <ProjectCard key={p.id} p={p} />)}
            <ProjectCard p={ORBIT} span2 />
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-12 py-32 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">02 — Operating Model</span>
              <h2 className="font-display text-[clamp(40px,7vw,96px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter mt-6">
                The <br /><span className="text-slate-300">Method</span>
              </h2>
            </div>
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
