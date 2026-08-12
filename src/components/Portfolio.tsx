/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ExternalLink, ChevronRight, ChevronDown, Menu, X, Terminal, Layers, Globe, Phone, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingNav from './FloatingNav';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logVisit } from '../lib/analytics';

export default function Portfolio() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    document.title = "Tariq Shaikh's Portfolio";
    logVisit('/portfolio');
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const openModal = (id: string) => {
    setActiveModal(id);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = '';
  };

  return (
    <div className="bg-white font-sans text-slate-900 min-h-screen selection:bg-blue-100 selection:text-slate-900 pb-24">
      {/* Navigation - Simplified */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-12 py-6 flex items-center justify-between transition-all duration-500 ${scrolled ? 'translate-y-0 opacity-100 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm' : '-translate-y-full opacity-0 bg-transparent'}`}>
        <div className="font-mono text-sm tracking-widest uppercase text-slate-900 font-bold">Tariq Shaikh</div>
      </nav>

      {/* Floating Dock - 60fps Inspiration */}
      <FloatingNav />

      {/* Hero - Inspired by 'OBSCURED' */}
      {/* Bento Hero + Projects */}
      <section id="projects" className="bg-[#F5F5F3] px-6 md:px-14 pt-10 md:pt-14 pb-10 md:pb-14">

        {/* Desktop: identity card left + 2x2 square tray right */}
        <div className="hidden md:flex gap-5 items-stretch w-full">

          {/* Identity card — stretches to match tray height */}
          <div className="flex-1 bg-white rounded-2xl p-10 flex flex-col justify-between border border-slate-200/40">
            <div className="flex justify-between items-start font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div>003+<br />Projects</div>
              <div className="text-slate-900">Portfolio</div>
              <div>EN</div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="text-[clamp(44px,4.8vw,82px)] font-black text-slate-900 tracking-[-0.05em] leading-[0.85]"
              style={{ fontFamily: "'BakersLocal', serif" }}
            >
              Tariq<br />Shaikh
            </motion.h1>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-900 font-black mb-1">Product Manager</div>
              <p className="font-mono text-[10px] uppercase text-slate-400 leading-relaxed mb-6">Bridging data, strategy, and product.</p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={16} /></a>
                <a href="https://linkedin.com/in/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={16} /></a>
                <a href="mailto:tshaikh92@gmail.com" className="text-slate-400 hover:text-slate-900 transition-colors"><Mail size={16} /></a>
              </div>
            </div>
          </div>

          {/* Project tray — background with 2×2 squares */}
          <div className="flex-1 min-w-0 bg-[#E2E2DF] rounded-2xl p-3 border border-slate-300/40">
            <div className="grid grid-cols-2 gap-3">

              {/* Homebase NJ */}
              <div className="aspect-square bg-[#090E1A] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_16px_40px_-8px_rgba(59,130,246,0.2)] relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[8px] px-2 py-0.5 uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-full">Live Product</span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">P.001</span>
                  </div>
                  <h3 className="text-[20px] leading-tight mb-1 text-white">
                    <span className="font-serif font-bold">Homebase</span> <span className="font-sans font-black text-blue-400 ml-1">NJ</span>
                  </h3>
                  <p className="font-serif italic text-slate-500 text-[9px] mb-3 uppercase tracking-wider">Product Design & Data Strategy</p>
                  <div className="relative mb-3">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-500/30" />
                    <p className="text-xs leading-relaxed text-slate-300 pl-4">6 browser tabs collapsed into one weighted real estate comparison tool.</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {['Consumer', 'Real Estate', 'Data'].map(tag => (
                      <span key={tag} className="font-mono text-[7px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300/80 border border-blue-500/20 tracking-widest uppercase font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Link to="/homebase" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-blue-600 to-cyan-400 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_16px_rgba(59,130,246,0.4)] transition-shadow">
                    Launch <ChevronRight size={10} />
                  </Link>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => openModal('prd-1')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">PRD</button>
                    <button onClick={() => openModal('roadmap-1')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">Roadmap</button>
                  </div>
                </div>
              </div>

              {/* Waves */}
              <div className="aspect-square bg-[#0B1A1F] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_16px_40px_-8px_rgba(6,182,212,0.2)] relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[8px] px-2 py-0.5 uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold rounded-full">Live Product</span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">P.002</span>
                  </div>
                  <h3 className="text-[20px] leading-tight mb-1 text-white">
                    <span className="font-serif font-bold italic">Waves</span>
                  </h3>
                  <p className="font-serif italic text-slate-500 text-[9px] mb-3 uppercase tracking-wider">Destination intelligence</p>
                  <div className="relative mb-3">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-cyan-500/30" />
                    <p className="text-xs leading-relaxed text-slate-300 pl-4">Visualizing when to go and what to see for dream trips.</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {['Travel', 'Data Viz', 'AI'].map(tag => (
                      <span key={tag} className="font-mono text-[7px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300/80 border border-cyan-500/20 tracking-widest uppercase font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Link to="/waves" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-cyan-600 to-teal-300 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-shadow">
                    Launch <ChevronRight size={10} />
                  </Link>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => openModal('prd-3')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">PRD</button>
                    <button onClick={() => openModal('roadmap-3')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">Roadmap</button>
                  </div>
                </div>
              </div>

              {/* Orbit */}
              <div className="aspect-square bg-[#1A1C1E] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-[#C5A059]/50 hover:shadow-[0_16px_40px_-8px_rgba(197,160,89,0.2)] relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C5A059] to-[#E5C079] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[8px] px-2 py-0.5 uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold rounded-full">Live Product</span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">P.003</span>
                  </div>
                  <h3 className="text-[20px] leading-tight mb-1 text-white">
                    <span className="font-serif font-bold italic">Orbit</span>
                  </h3>
                  <p className="font-serif italic text-slate-500 text-[9px] mb-3 uppercase tracking-wider">Cash Flow Intelligence</p>
                  <div className="relative mb-3">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-[#C5A059]/30" />
                    <p className="text-xs leading-relaxed text-slate-300 pl-4">Map every dollar across 12 months so irregular expenses never catch you off guard.</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {['Fintech', 'Cash Flow', 'Strategy'].map(tag => (
                      <span key={tag} className="font-mono text-[7px] px-1.5 py-0.5 bg-[#C5A059]/10 text-[#D4B470] border border-[#C5A059]/20 tracking-widest uppercase font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Link to="/orbit" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#C5A059] to-[#F0D585] text-black text-[8px] font-black uppercase tracking-[0.2em] rounded-sm hover:shadow-[0_0_16px_rgba(197,160,89,0.4)] transition-shadow">
                    Launch <ChevronRight size={10} />
                  </Link>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => openModal('prd-2')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">PRD</button>
                    <button onClick={() => openModal('roadmap-2')} className="px-2 py-1.5 bg-white/5 text-[7px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-sm">Roadmap</button>
                  </div>
                </div>
              </div>

              {/* Stealth */}
              <div className="aspect-square bg-[#0A0A0A] rounded-xl p-5 flex flex-col justify-between border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_30px,rgba(255,255,255,0.008)_30px,rgba(255,255,255,0.008)_31px)] pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] px-2 py-0.5 uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold rounded-full">In Development</span>
                  <span className="font-mono text-[9px] text-slate-600 font-bold">P.004</span>
                </div>
                <div>
                  <div className="text-[28px] font-black text-white/80 leading-[0.85] tracking-tight mb-3" style={{ fontFamily: "'BakersLocal', serif" }}>◼ Stealth</div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">Something is being built. It ships when it's ready.</p>
                  <div className="flex flex-wrap gap-1">
                    {['AI', 'Product', 'Tools'].map(t => (
                      <span key={t} className="font-mono text-[7px] px-1.5 py-0.5 bg-violet-500/5 text-violet-500/40 border border-violet-500/10 tracking-widest uppercase font-bold">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-700 font-bold">Classified ◼</div>
              </div>

            </div>
          </div>

        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/40">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-4">Portfolio</div>
            <div className="text-[42px] font-black text-slate-900 tracking-[-0.05em] leading-[0.85] mb-4" style={{ fontFamily: "'BakersLocal', serif" }}>Tariq<br />Shaikh</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-900 font-black mb-1">Product Manager</div>
            <p className="font-mono text-[10px] uppercase text-slate-400 mb-6">Bridging data, strategy, and product.</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github size={17} /></a>
              <a href="https://linkedin.com/in/tariqshaikh" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Linkedin size={17} /></a>
              <a href="mailto:tshaikh92@gmail.com" className="text-slate-400 hover:text-slate-900 transition-colors"><Mail size={17} /></a>
            </div>
          </div>
          {([
            { bg: 'bg-[#090E1A]', border: 'hover:border-blue-500/40', bar: 'from-blue-600 to-cyan-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'P.001', titleEl: <><span className="font-serif font-bold">Homebase</span><span className="font-sans font-black text-blue-400 ml-1.5">NJ</span></>, sub: 'Product Design & Data Strategy', desc: 'I collapsed 6 browser tabs into one weighted comparison tool for real estate decisions.', tags: ['Consumer', 'Real Estate', 'Data Product'], tagCls: 'bg-blue-500/10 text-blue-300/80 border-blue-500/20', btn: 'from-blue-600 to-cyan-400', btnText: 'text-white', href: '/homebase', prd: 'prd-1', rm: 'roadmap-1' },
            { bg: 'bg-[#0B1A1F]', border: 'hover:border-cyan-500/40', bar: 'from-cyan-600 to-teal-400', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20', label: 'P.002', titleEl: <span className="font-serif font-bold italic">Waves</span>, sub: 'Destination intelligence', desc: 'Destination intelligence for dream trips. Visualizing when to go and what to see.', tags: ['Travel', 'Data Viz', 'AI'], tagCls: 'bg-cyan-500/10 text-cyan-300/80 border-cyan-500/20', btn: 'from-cyan-600 to-teal-300', btnText: 'text-white', href: '/waves', prd: 'prd-3', rm: 'roadmap-3' },
            { bg: 'bg-[#1A1C1E]', border: 'hover:border-[#C5A059]/40', bar: 'from-[#C5A059] to-[#E5C079]', badge: 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20', label: 'P.003', titleEl: <span className="font-serif font-bold italic">Orbit</span>, sub: 'Cash Flow Intelligence', desc: 'Finally understand your cash flow. Map every dollar across 12 months so irregular expenses never catch you off guard.', tags: ['Fintech', 'Cash Flow', 'Strategy'], tagCls: 'bg-[#C5A059]/10 text-[#D4B470] border-[#C5A059]/20', btn: 'from-[#C5A059] to-[#F0D585]', btnText: 'text-black', href: '/orbit', prd: 'prd-2', rm: 'roadmap-2' },
          ] as const).map((p, i) => (
            <div key={i} className={`${p.bg} border border-white/5 rounded-2xl p-8 flex flex-col gap-4 ${p.border} transition-all group relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${p.bar} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest ${p.badge} border font-bold rounded-full`}>Live Product</span>
                <span className="font-mono text-[9px] text-slate-500 font-bold">{p.label}</span>
              </div>
              <div>
                <h3 className="text-[24px] text-white mb-1">{p.titleEl}</h3>
                <p className="font-serif italic text-slate-500 text-[10px] mb-3 uppercase tracking-wider">{p.sub}</p>
                <p className="text-[13px] leading-relaxed text-slate-300 mb-3">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map(t => <span key={t} className={`font-mono text-[8px] px-2 py-0.5 ${p.tagCls} border tracking-widest uppercase font-bold`}>{t}</span>)}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to={p.href} className={`inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br ${p.btn} ${p.btnText} text-[9px] font-black uppercase tracking-[0.2em]`}>
                  Launch Application <ChevronRight size={12} />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openModal(p.prd)} className="px-3 py-2 bg-white/5 text-[8px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer">PRD</button>
                  <button onClick={() => openModal(p.rm)} className="px-3 py-2 bg-white/5 text-[8px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer">Roadmap</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Method + Builder — touching accordion */}
      <div className="px-6 md:px-14 py-4 bg-[#F5F5F3]">
        <div className="border border-slate-200 rounded-2xl overflow-hidden">

        {/* Method */}
        <div className="bg-white">
          <button
            onClick={() => setMethodOpen(o => !o)}
            className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">02 — Operating Model</span>
              <span className="font-display text-lg font-black text-slate-900 uppercase tracking-tight">The Method</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${methodOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {methodOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100 border-t border-slate-100">
                  {[
                    { num: '01', title: 'Definition', desc: 'Identify a user problem that can be articulated in a single sentence. Logic over ego.' },
                    { num: '02', title: 'Specifications', desc: 'Write the PRD. Define metrics, constraints, and non-goals before opening the IDE.' },
                    { num: '03', title: 'Execution', desc: 'Build the functional core. Ship a V1 that solves the primary friction point immediately.' },
                    { num: '04', title: 'Refinement', desc: 'Synthesize feedback and performance data to inform the roadmap for V2 and beyond.' },
                  ].map((step, i) => (
                    <div key={i} className="p-10 bg-white">
                      <div className="font-display text-[40px] font-black text-slate-100 leading-none mb-6">{step.num}</div>
                      <div className="font-display text-base font-black mb-3 text-slate-900 uppercase tracking-tight">{step.title}</div>
                      <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Builder */}
        <div className="bg-slate-50 border-t border-slate-200">
          <button
            onClick={() => setBuilderOpen(o => !o)}
            className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">03 — About</span>
              <span className="font-display text-lg font-black text-slate-900 uppercase tracking-tight">The Builder</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${builderOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {builderOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-100 px-8 py-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-5">
                      <div className="bg-slate-50 p-6 border-l-2 border-slate-900">
                        <p className="text-base leading-relaxed text-slate-600 italic">
                          "I specialize in bridging the gap between deep technical implementation and boardroom-level product decisions."
                        </p>
                      </div>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-8">
                      <p className="text-xl leading-snug text-slate-900 font-sans tracking-tight">
                        I am a <strong className="font-black">Product Manager</strong> with a decade of experience operating at the convergence of high-scale data and product.
                      </p>
                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4">Expertise — Product</div>
                          <ul className="text-sm font-black text-slate-900 uppercase tracking-tight flex flex-col gap-3">
                            <li>Roadmap Ownership</li>
                            <li>A/B Experimentation</li>
                            <li>User Research</li>
                            <li>0→1 Launches</li>
                          </ul>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4">Expertise — Technical</div>
                          <ul className="text-sm font-black text-slate-900 uppercase tracking-tight flex flex-col gap-3">
                            <li>React / TypeScript</li>
                            <li>SQL & Data Viz</li>
                            <li>Data Automation</li>
                            <li>Product Arch.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        </div>
      </div>

      <footer className="px-12 py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-16">
          <div className="flex flex-col gap-6">
            <div className="font-mono text-[10px] text-slate-400 tracking-[0.4em] uppercase font-bold">Archive — © 2026</div>
            <div className="font-display text-[clamp(24px,4vw,40px)] font-black text-slate-900 uppercase tracking-tighter">Tariq Shaikh</div>
            <p className="text-slate-400 font-sans text-sm max-w-[240px] leading-relaxed">
              Product Management & Data Strategy at the intersection of logic and product.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16 md:gap-24 w-full md:w-auto">
            <div className="flex flex-col gap-6">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-widest">Connect</span>
              <div className="flex flex-col gap-3">
                <a href="mailto:tshaikh92@gmail.com" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">Email</a>
                <a href="https://linkedin.com" target="_blank" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">LinkedIn</a>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <span className="font-mono text-[10px] text-slate-500 uppercase font-bold tracking-widest">Reach</span>
              <a href="tel:8483914393" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">848.391.4393</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm overflow-y-auto px-6 py-10 flex items-start justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-white text-slate-900 max-w-[1100px] w-full overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100"
            >
              {activeModal === 'prd-1' && (
                <>
                  <div className="px-10 py-10 border-b border-slate-200 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4">Product Requirements Document</div>
                      <div className="text-5xl font-display leading-[0.8] tracking-tighter uppercase font-black">
                        Homebase <span className="text-slate-300">NJ</span>
                      </div>
                      <div className="flex gap-4 mt-8 text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500"></span> Status: v1.0</span>
                        <span>|</span>
                        <span>Q2 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-900 text-3xl leading-none p-2 hover:bg-slate-100 transition-colors uppercase font-mono">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    {/* Executive Summary */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-100">1. Executive Summary</h2>
                      <div className="bg-slate-50 border-l-4 border-blue-600 px-6 py-5 my-5 text-[16px] leading-[1.7] text-slate-600 italic rounded-r-md">
                        "Every home buyer in NJ is doing this research manually across 5–6 different tabs. This tool collapses that into one weighted comparison view, empowering data-driven real estate decisions."
                      </div>
                      <p className="text-[16px] leading-[1.8] text-slate-600">
                        Homebase NJ is a consumer-facing web application designed to help prospective homebuyers in Union County, NJ, compare municipalities across seven critical dimensions: schools, commute, safety, affordability, downtown activity, property taxes, and market competitiveness. By allowing users to assign dynamic weights to their personal priorities, Homebase NJ transforms fragmented, overwhelming data into a personalized, actionable ranking.
                      </p>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">2. Problem Statement</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">The User Pain</h3>
                          <p className="text-[15px] leading-[1.7] text-slate-600 mb-4">
                            Home buying research is severely fragmented. A buyer making a $600K+ decision is forced to manually cross-reference GreatSchools, Zillow, NJ Transit schedules, WalkScore, crime databases, and NJ tax records. 
                          </p>
                          <p className="text-[15px] leading-[1.7] text-slate-600">
                            These data sources exist in different formats, making it impossible to weigh trade-offs effectively (e.g., "Is the higher tax rate in Westfield worth the better commute compared to Cranford?").
                          </p>
                        </div>
                        <div className="bg-blue-50/30 p-5 rounded-lg border border-blue-100">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">Current Workarounds</h3>
                          <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-slate-600 space-y-2">
                            <li>Massive, unmaintainable Excel spreadsheets.</li>
                            <li>Relying entirely on subjective real estate agent advice.</li>
                            <li>"Analysis paralysis" leading to delayed offers in a highly competitive market.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">3. Target Audience & Personas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="border border-slate-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">1</div>
                            <h3 className="font-bold text-lg text-slate-900">The Ex-Urbanite Family</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Primary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-slate-600">
                            Moving from NYC/Hoboken to the suburbs for more space. <strong>Top priorities:</strong> Commute time to Penn Station, school ratings, and maintaining a walkable downtown lifestyle.
                          </p>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">2</div>
                            <h3 className="font-bold text-lg text-slate-900">The Value Optimizer</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Secondary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-slate-600">
                            First-time homebuyers priced out of tier-1 towns. <strong>Top priorities:</strong> Affordability, lower property taxes, and finding "up-and-coming" neighborhoods with acceptable safety ratings.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Goals & Success Metrics */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">4. Goals & Success Metrics (OKRs)</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[15px] mt-4">
                          <thead>
                            <tr>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Objective</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Key Result (Metric)</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Drive deep user engagement</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Sessions with 3+ towns compared</td>
                              <td className="p-4 border-b border-slate-100 text-green-600 font-mono font-semibold">&gt; 65%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Validate dynamic weighting feature</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Sessions where default weights are modified</td>
                              <td className="p-4 border-b border-slate-100 text-green-600 font-mono font-semibold">&gt; 40%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Establish tool utility</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Qualitative feedback (user interviews)</td>
                              <td className="p-4 border-b border-slate-100 text-green-600 font-mono font-semibold">4/5 report narrowed choices</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Build habit/retention</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">D7 Retention Rate</td>
                              <td className="p-4 border-b border-slate-100 text-green-600 font-mono font-semibold">&gt; 25%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Core Features & Requirements */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">5. Core Features & Requirements</h2>
                      
                      <div className="space-y-6 mt-6">
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                            <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P0</span>
                            <h3 className="font-bold text-slate-900">Dynamic Priority Weighting</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-slate-600 mb-3">Users must be able to rank 7 distinct categories (Schools, Commute, Safety, etc.) by importance. The UI should support drag-and-drop or simple click-to-rank interactions.</p>
                            <p className="text-[14px] text-slate-400 italic">Acceptance Criteria: Changing a weight must instantly recalculate the "Match Score" for all selected towns without a page reload.</p>
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                            <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P0</span>
                            <h3 className="font-bold text-slate-900">Side-by-Side Town Comparison Matrix</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-slate-600 mb-3">A responsive data grid allowing users to compare up to 5 towns simultaneously. Must include visual indicators (heatmaps or color coding) to show relative performance in each category.</p>
                            <p className="text-[14px] text-slate-400 italic">Acceptance Criteria: Grid must be horizontally scrollable on mobile. Best-in-class metrics should be highlighted in green; worst in red/orange.</p>
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                            <span className="bg-slate-400 text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P1</span>
                            <h3 className="font-bold text-slate-900">"Perfect Match" Algorithm</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-slate-600 mb-3">A proprietary scoring system (0-100) that normalizes disparate data types (e.g., minutes vs. dollars vs. 1-10 ratings) and applies the user's custom weights to recommend the #1 town.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Sources */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">6. Data Architecture & Sources</h2>
                      <div className="bg-white border border-slate-100 rounded-lg overflow-hidden mt-4">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              <th className="p-4 border-b-2 border-slate-100 font-mono text-[12px] uppercase tracking-widest text-slate-400 bg-slate-50">Metric</th>
                              <th className="p-4 border-b-2 border-slate-100 font-mono text-[12px] uppercase tracking-widest text-slate-400 bg-slate-50">Source</th>
                              <th className="p-4 border-b-2 border-slate-100 font-mono text-[12px] uppercase tracking-widest text-slate-400 bg-slate-50">Normalization Logic</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { m: 'School Rating', s: 'GreatSchools API', t: 'Direct 1-10 scale mapping' },
                              { m: 'Commute (NYC)', s: 'NJ Transit / Google Maps', t: 'Inverse scale (lower mins = higher score)' },
                              { m: 'Property Tax', s: 'NJ Treasury Dept', t: 'Inverse scale (lower % = higher score)' },
                              { m: 'Median Price', s: 'Zillow / MLS', t: 'Inverse scale mapped against county median' },
                              { m: 'Walkability', s: 'WalkScore API', t: 'Direct 1-100 scale mapping' }
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 border-b border-slate-100 font-semibold text-slate-900">{row.m}</td>
                                <td className="p-4 border-b border-slate-100 text-slate-600">{row.s}</td>
                                <td className="p-4 border-b border-slate-100 text-slate-400 text-sm">{row.t}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Out of Scope */}
                    <div className="mb-8">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-50">7. Out of Scope (v1.0)</h2>
                      <ul className="list-none space-y-3 mt-4">
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Live MLS Integration:</strong> We are comparing <em>towns</em>, not individual active listings. Showing active homes is deferred to v2.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>User Accounts/Auth:</strong> Users will not be able to save their comparisons to a profile in v1. State will be managed locally via URL parameters or localStorage.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Counties outside Union County:</strong> Initial launch is restricted to a single county to ensure data accuracy and validate the algorithm before scaling statewide.</span>
                        </li>
                      </ul>
                    </div>


                  </div>
                </>
              )}
              {activeModal === 'prd-2' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-700 flex items-start justify-between gap-4 bg-slate-900 sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#C5A059] mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-white italic">Orbit</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Status: Live</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q2 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    {/* Executive Summary */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#C5A059]/20">1. Executive Summary</h2>
                      <div className="bg-slate-900 border-l-4 border-[#C5A059] px-6 py-5 my-5 text-[16px] leading-[1.7] text-slate-300 italic rounded-r-md">
                        "Project your financial trajectory based on real inflow and outflow. Orbit helps you visualize the impact of life's big decisions—from daycare and new cars to long-term investments—by mapping your annual surplus."
                      </div>
                      <p className="text-[16px] leading-[1.8] text-slate-600">
                        Orbit is a cash flow intelligence tool designed to help users manage irregular, non-monthly expenses (car insurance, annual fees, taxes). By visualizing the "Orbit" of these expenses, the app provides a clear 12-month trajectory, helping users build sinking funds and avoid financial surprises.
                      </p>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">2. Problem Statement</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-3">The User Pain</h3>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347] mb-4">
                            Monthly budgeting tools (like YNAB or Mint) focus on the 30-day cycle, but fail to prepare users for the "Big Hits"—those irregular expenses that orbit your life and cause stress when they land.
                          </p>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347]">
                            Users often feel "broke" during months with insurance premiums or annual fees, even if their annual income is sufficient. They lack a tool that smooths these spikes into a predictable monthly set-aside.
                          </p>
                        </div>
                        <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#333333]">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-3">The Goal</h3>
                          <p className="text-[15px] leading-[1.7] text-[#D1D1D1]">
                            To create a tool that turns "Annual Cash Flow" from a guessing game into a precise orbit. We want to move users from "Surprise Expenses" to "Strategic Sinking Funds."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">3. Target Audience & Personas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-bold">1</div>
                            <h3 className="font-bold text-lg text-[#1A1C1E]">The Dual-Income Household</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Primary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-[#3D4347]">
                            HHI $150K–$300K. They earn well but feel financially reactive. <strong>Top anxieties:</strong> car insurance renewals, property taxes, holiday spending, and daycare lump sums arriving without warning.
                          </p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-bold">2</div>
                            <h3 className="font-bold text-lg text-[#1A1C1E]">The Self-Employed Professional</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Secondary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-[#3D4347]">
                            Freelancers and consultants with variable monthly income. <strong>Top priority:</strong> Knowing exactly how much to set aside each month so irregular tax obligations and business expenses never create a cash crunch.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* OKRs */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">4. Goals & Success Metrics (OKRs)</h2>
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full border-collapse text-[15px]">
                          <thead>
                            <tr>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Objective</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Key Result</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Prove core utility</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Sessions where ≥1 orbit expense is added</td>
                              <td className="p-4 border-b border-slate-100 text-[#C5A059] font-mono font-semibold">&gt; 55%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Drive surplus awareness</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Users who view the 12-month grid after setup</td>
                              <td className="p-4 border-b border-slate-100 text-[#C5A059] font-mono font-semibold">&gt; 70%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Build retention</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">D30 Return Rate</td>
                              <td className="p-4 border-b border-slate-100 text-[#C5A059] font-mono font-semibold">&gt; 30%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Validate AI layer</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Wealth Coach queries per active user / month</td>
                              <td className="p-4 border-b border-slate-100 text-[#C5A059] font-mono font-semibold">&gt; 2.5</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Competitive Landscape */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">5. Competitive Landscape</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {[
                          { name: 'YNAB', gap: 'Forces zero-based budgeting on a 30-day cycle. Has no concept of a 12-month orbit or sinking fund visualizer. High learning curve.' },
                          { name: 'Copilot / Monarch', gap: 'Beautiful transaction categorization, but purely backward-looking. Cannot project forward-looking annual cash flow or model "what if I buy a new car in October?"' },
                          { name: 'Mint (defunct)', gap: 'Confirmed product-market fit for this segment before shutdown. Its absence is the direct market opportunity Orbit is built to fill.' },
                        ].map((c, i) => (
                          <div key={i} className="bg-[#1A1A1A] rounded-lg p-5 border border-[#333]">
                            <div className="font-bold text-[#C5A059] mb-2">{c.name}</div>
                            <p className="text-[14px] text-slate-400 leading-relaxed">{c.gap}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[14px] text-[#6E8A96] italic">Orbit's wedge: the only tool built around <strong className="text-slate-300">annual</strong> cash flow, not the monthly cycle.</p>
                    </div>

                    {/* Core Features */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">6. Core Features (MVP)</h2>
                      <div className="space-y-6 mt-6">
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-green-50/30">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1E5C38]" />
                            Orbit Expense Engine
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">A dedicated system for logging non-monthly expenses with specific month-of-impact tracking and automatic sinking fund calculations.</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-green-50/30">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1E5C38]" />
                            12-Month Cash Flow Visualizer
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Interactive grid showing projected annual spend, surplus tracking, and visual "Danger Zone" identification.</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-green-50/30">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1E5C38]" />
                            Statement Analyzer (AI)
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Upload financial statements to automatically detect and categorize recurring orbiting expenses using Gemini Pro.</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-blue-50/30">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            Merchant Intelligence (Next)
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Granular merchant-level aggregation (Trader Joe's, ShopRite) and categorical drill-downs for high-fidelity spend analysis.</p>
                        </div>
                      </div>
                    </div>

                    {/* Out of Scope */}
                    <div className="mb-8">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">7. Out of Scope (v1.0)</h2>
                      <ul className="list-none space-y-3 mt-4">
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>Bank API / Plaid Integration:</strong> v1 relies on manual entry and statement uploads. Real-time account sync is deferred to avoid auth complexity and compliance scope in MVP.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>Investment Portfolio Tracking:</strong> Orbit focuses on cash flow and spending, not asset growth. Brokerage account integration is a V4 feature.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>Multi-User / Household Sync:</strong> Shared budgeting between partners is a compelling V2 feature but adds significant auth and state complexity. Out of scope for v1.</span>
                        </li>
                      </ul>
                    </div>

                  </div>
                </>
              )}
              {activeModal === 'roadmap-1' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-200 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-slate-900">Homebase</span> <span className="font-sans font-black text-blue-600 ml-1">NJ</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600"></span> Status: Shipped (v1.0)</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: Q1 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-slate-900 transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          badge: 'V1 — Shipped', 
                          badgeClass: 'bg-green-50 text-green-700 border border-green-100', 
                          title: 'Core MVP', 
                          time: 'Q1 2026',
                          items: [
                            { t: 'Static Comparison Grid', d: '5-town pilot (Union County) with 7 scored dimensions.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'Dynamic Priority Engine', d: 'Drag-to-rank priority bubbles with live recalculation of the Match Score.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'Mobile-Responsive UI', d: 'Horizontal scrolling and optimized layout for mobile users.', s: 'Done', dot: 'bg-green-600' },
                          ]
                        },
                        { 
                          badge: 'V2 — Up Next', 
                          badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100', 
                          title: 'Personalization', 
                          time: 'Q2 2026',
                          items: [
                            { t: 'Household Budget Input', d: 'Input income, down payment, and rates to filter out towns outside true affordability.', s: 'In Progress', dot: 'bg-blue-600' },
                            { t: 'Live MLS / Zillow API', d: 'Replace static median prices with real-time active inventory and list prices.', s: 'Planned', dot: 'bg-blue-600' },
                            { t: 'User Accounts & Auth', d: 'Allow users to save multiple comparison scenarios and share them with partners.', s: 'Planned', dot: 'bg-blue-600' },
                          ]
                        },
                        { 
                          badge: 'V3 — Scaling', 
                          badgeClass: 'bg-slate-50 text-slate-400 border border-slate-200', 
                          title: 'Statewide Expansion', 
                          time: 'Q3 2026',
                          items: [
                            { t: 'NJ Statewide Rollout', d: 'Expand from Union County to all 21 New Jersey counties, categorizing by region.', s: 'Discovery', dot: 'bg-slate-400' },
                            { t: 'Hyper-Local Commute', d: 'Multi-modal transit routing (e.g., drive to train + train to Penn Station).', s: 'Discovery', dot: 'bg-slate-400' },
                            { t: 'School Zones Overlay', d: 'Map-based visualization of exact elementary/middle school zones within a town.', s: 'Discovery', dot: 'bg-slate-400' },
                          ]
                        },
                        { 
                          badge: 'V4 — Vision', 
                          badgeClass: 'bg-slate-50 text-slate-400 border border-slate-200', 
                          title: 'National & Monetization', 
                          time: 'Q4 2026+',
                          items: [
                            { t: 'US National Expansion', d: 'Scale the data pipeline to support the top 50 US Metropolitan Statistical Areas (MSAs).', s: 'Backlog', dot: 'bg-slate-400' },
                            { t: 'Predictive Insights', d: 'AI-driven insights on bidding wars, average days on market, and offer strategies.', s: 'Backlog', dot: 'bg-slate-400' },
                            { t: 'Agent Lead Gen Engine', d: 'Monetization: Connect high-intent buyers with top-rated local real estate agents.', s: 'Backlog', dot: 'bg-slate-400' },
                          ]
                        }
                      ].map((phase, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                          <div className="mb-5">
                            <span className={`font-mono text-[11px] px-2.5 py-1 rounded uppercase tracking-widest font-bold whitespace-nowrap ${phase.badgeClass}`}>{phase.badge}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">{phase.title}</h3>
                          <div className="font-mono text-[13px] text-slate-400 mb-6 pb-4 border-b border-slate-100">{phase.time}</div>
                          
                          <div className="space-y-4 flex-1">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-white border border-slate-50 p-4 rounded-lg shadow-sm hover:border-blue-600 transition-colors group">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                    <h4 className="font-bold text-[14px] text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{item.t}</h4>
                                  </div>
                                </div>
                                <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{item.d}</p>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 bg-white inline-block px-2 py-1 rounded border border-slate-100">{item.s}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'roadmap-2' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-700 flex items-start justify-between gap-4 bg-slate-900 sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#C5A059] mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-white italic">Orbit</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Status: Live</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: April 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          badge: 'V1 — Current', 
                          badgeClass: 'bg-green-50 text-green-700 border border-green-100', 
                          title: 'Strategic Core', 
                          time: 'Q1 2026',
                          items: [
                            { t: 'Orbit Expense Engine', d: 'Core logic for tracking irregular expenses and their monthly impact.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'Fluid Expense Grid', d: 'Real-time dashboard showing annual income, spend, surplus, and categorized irregular hits.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'Dynamic Fixed Expenses', d: 'Customizable monthly fixed expenses to accurately calculate baseline spend.', s: 'Done', dot: 'bg-green-600' },
                          ]
                        },
                        { 
                          badge: 'V2 — Intelligence', 
                          badgeClass: 'bg-slate-900 text-[#C5A059] border border-slate-700', 
                          title: 'AI Advisory', 
                          time: 'Q2 2026',
                          items: [
                            { t: 'Gemini Wealth Coach', d: 'Personalized strategic advice based on annual cash flow analysis.', s: 'Done', dot: 'bg-[#C5A059]' },
                            { t: 'Statement Analyzer', d: 'Granular insights from uploaded financial statements.', s: 'Planned', dot: 'bg-[#C5A059]' },
                          ]
                        },
                        { 
                          badge: 'V3 — Wealth & Analysis',
                          badgeClass: 'bg-slate-50 text-slate-500 border border-slate-200',
                          title: 'Deployment & Insights',
                          time: 'Q3 2026',
                          items: [
                            { t: 'Surplus Deployment', d: 'Actionable strategies for deploying annual surplus into investments.', s: 'Discovery', dot: 'bg-green-600' },
                            { t: 'Category Drill-downs', d: 'Interactive sub-categorization (e.g. Food → Groceries/Dining).', s: 'Next', dot: 'bg-blue-600' },
                            { t: 'Merchant Aggregation', d: 'Bundle recurring merchant spend into single line items.', s: 'Next', dot: 'bg-blue-600' },
                          ]
                        },
                        { 
                          badge: 'V4 — Vision', 
                          badgeClass: 'bg-slate-50 text-slate-400 border border-slate-200', 
                          title: 'Advanced Automation', 
                          time: 'Q3 2026+',
                          items: [
                            { t: 'Dynamic Orbit Sync', d: 'Auto-adjust reserve goals based on real-time spend trends.', s: 'Backlog', dot: 'bg-slate-400' },
                            { t: 'Wealth Simulator', d: 'Comprehensive retirement modeling and scenario analysis.', s: 'Backlog', dot: 'bg-slate-400' },
                          ]
                        }
                      ].map((phase, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                          <div className="mb-5">
                            <span className={`font-mono text-[11px] px-2.5 py-1 rounded uppercase tracking-widest font-bold whitespace-nowrap ${phase.badgeClass}`}>{phase.badge}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">{phase.title}</h3>
                          <div className="font-mono text-[13px] text-slate-400 mb-6 pb-4 border-b border-slate-100">{phase.time}</div>
                          
                          <div className="space-y-4 flex-1">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-white border border-slate-50 p-4 rounded-lg shadow-sm hover:border-[#C5A059] transition-colors group">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                    <h4 className="font-bold text-[14px] text-slate-900 leading-tight group-hover:text-[#C5A059] transition-colors">{item.t}</h4>
                                  </div>
                                </div>
                                <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{item.d}</p>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 bg-white inline-block px-2 py-1 rounded border border-slate-100">{item.s}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'prd-3' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-200 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#137D97] mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-slate-900 italic">Waves</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Status: Draft</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: April 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-slate-900 transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 max-w-4xl mx-auto bg-white">
                    <div className="prose prose-slate prose-lg max-w-none">
                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">1. Executive Summary</h2>
                      <p className="text-slate-600 leading-relaxed mb-8">
                        <strong>Problem:</strong> Travelers know where they want to go, but figuring out the best time to book is a stressful, manual process of checking multiple sites and guessing price trends. Coordinating this with friends makes it exponentially harder.
                        <br/><br/>
                        <strong>Solution:</strong> Waves is a collaborative flight price tracker that visualizes historical pricing trends, provides AI-driven seasonality context, and allows groups to track and vote on the best travel windows together.
                      </p>

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">2. Target Audience</h2>
                      <ul className="list-disc pl-6 text-slate-600 space-y-3 mb-8">
                        <li><strong>The Deal Hunter:</strong> Flexible travelers who want to maximize their budget and are willing to wait for a price drop.</li>
                        <li><strong>The Group Organizer:</strong> The person responsible for coordinating a trip for 3+ people, trying to find a date that works for everyone's budget.</li>
                        <li><strong>The Data Nerd:</strong> Users who want to see the historical trends and understand the "why" behind pricing before booking.</li>
                      </ul>

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">3. Goals & Success Metrics (OKRs)</h2>
                      <div className="overflow-x-auto mb-8">
                        <table className="w-full border-collapse text-[15px]">
                          <thead>
                            <tr>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Objective</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Key Result</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Prove core utility</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Sessions where a route is searched and trend chart viewed</td>
                              <td className="p-4 border-b border-slate-100 text-[#137D97] font-mono font-semibold">&gt; 60%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Validate collaboration feature</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Trip Crews created per 100 users</td>
                              <td className="p-4 border-b border-slate-100 text-[#137D97] font-mono font-semibold">&gt; 20</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Drive AI engagement</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Seasonality insight panel opened per session</td>
                              <td className="p-4 border-b border-slate-100 text-[#137D97] font-mono font-semibold">&gt; 45%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Build retention</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">D7 Return Rate (same route checked again)</td>
                              <td className="p-4 border-b border-slate-100 text-[#137D97] font-mono font-semibold">&gt; 35%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">4. Competitive Landscape</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[
                          { name: 'Google Flights', gap: 'Excellent price calendar but zero collaboration. No trend context, no AI insight, no shared group decision layer.' },
                          { name: 'Hopper', gap: 'Predicts price direction (buy/wait) but is a black box. No chart, no history, no crew coordination. Single-user only.' },
                          { name: 'Kayak / Skyscanner', gap: 'Aggregation tools, not intelligence tools. Show current prices but provide no seasonality context or trend visualization.' },
                        ].map((c, i) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                            <div className="font-bold text-[#137D97] mb-2">{c.name}</div>
                            <p className="text-[14px] text-slate-500 leading-relaxed">{c.gap}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[14px] text-slate-400 italic mb-8">Waves' wedge: the only tool that combines <strong className="text-slate-600">trend visualization + AI context + group collaboration</strong> in one place.</p>

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">5. Core Features (MVP)</h2>
                      <div className="space-y-6 mb-8">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-900 text-xl mb-2 flex items-center gap-2"><span className="text-[#137D97]">01.</span> Price Trend Visualization</h4>
                          <p className="text-slate-600">A 90-day interactive area chart showing historical and projected flight prices for a specific route, helping users identify the "waves" in pricing.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-900 text-xl mb-2 flex items-center gap-2"><span className="text-[#137D97]">02.</span> AI Seasonality Insights</h4>
                          <p className="text-slate-600">Integration with Google Gemini to provide instant context on weather, local events, and why prices might be spiking or dropping during a specific window.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-slate-900 text-xl mb-2 flex items-center gap-2"><span className="text-[#137D97]">03.</span> Trip Crew Collaboration</h4>
                          <p className="text-slate-600">A shared workspace where invited friends can view the same price trends, set their own alerts, and vote on preferred travel dates.</p>
                        </div>
                      </div>

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4 mt-12">6. Out of Scope (v1.0)</h2>
                      <ul className="list-none space-y-3 mb-8">
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Live Flight Booking:</strong> v1 is a research and intelligence tool. Actual ticket purchasing is deferred to V3 via deep-link partnerships, not in-app checkout.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Hotels & Accommodation:</strong> Flights are the most price-volatile travel cost and the clearest wedge. Hotel intelligence is a natural V3 expansion after the core loop is validated.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Real-Time Price Alerts (v1):</strong> Push notifications require a backend job scheduler. v1 uses mock trend data; live alerts ship in V2 alongside the Skyscanner API integration.</span>
                        </li>
                      </ul>

                    </div>
                  </div>
                </>
              )}
              {activeModal === 'roadmap-3' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-200 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#137D97] mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-slate-900 italic">Waves</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400"></span> Status: Live</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: April 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-slate-900 transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          badge: 'V1 — Current', 
                          badgeClass: 'bg-green-50 text-green-700 border border-green-100', 
                          title: 'Core Tracking', 
                          time: 'Q2 2026',
                          items: [
                            { t: 'Trend Visualization', d: 'Interactive area charts showing 90-day price fluctuations.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'AI Insights', d: 'Gemini integration for weather and event context.', s: 'Done', dot: 'bg-green-600' },
                            { t: 'Basic Collaboration', d: 'UI for Trip Crew and shared viewing.', s: 'Done', dot: 'bg-green-600' },
                          ]
                        },
                        { 
                          badge: 'V2 — Up Next', 
                          badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100', 
                          title: 'Live Data & Alerts', 
                          time: 'Q3 2026',
                          items: [
                            { t: 'Flight API Integration', d: 'Replace mock data with live Skyscanner or Google Flights API data.', s: 'Planned', dot: 'bg-blue-600' },
                            { t: 'Push Notifications', d: 'Real-time alerts when prices drop below the user\'s target threshold.', s: 'Planned', dot: 'bg-blue-600' },
                            { t: 'Active Voting', d: 'Allow crew members to officially vote on dates and lock in a decision.', s: 'Planned', dot: 'bg-blue-600' },
                          ]
                        },
                        { 
                          badge: 'V3 — Scaling', 
                          badgeClass: 'bg-slate-50 text-slate-400 border border-slate-200', 
                          title: 'Booking & Export', 
                          time: 'Q4 2026',
                          items: [
                            { t: 'Direct Booking Links', d: 'Deep links to airlines to book the specific deal found.', s: 'Ideation', dot: 'bg-slate-400' },
                            { t: 'Data Export', d: 'Export historical trends to CSV for power users.', s: 'Ideation', dot: 'bg-slate-400' },
                          ]
                        }
                      ].map((phase, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                          <div className="mb-5">
                            <span className={`font-mono text-[11px] px-2.5 py-1 rounded uppercase tracking-widest font-bold whitespace-nowrap ${phase.badgeClass}`}>{phase.badge}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">{phase.title}</h3>
                          <div className="font-mono text-[13px] text-slate-400 mb-6 pb-4 border-b border-slate-100">{phase.time}</div>
                          
                          <div className="space-y-4 flex-1">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-white border border-slate-50 p-4 rounded-lg shadow-sm hover:border-[#137D97] transition-colors group">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                    <h4 className="font-bold text-[14px] text-slate-900 leading-tight group-hover:text-[#137D97] transition-colors">{item.t}</h4>
                                  </div>
                                </div>
                                <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{item.d}</p>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 bg-white inline-block px-2 py-1 rounded border border-slate-100">{item.s}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'prd-4' && (
                <>
                  <div className="px-10 py-8 border-b border-[#2A1F3D] flex items-start justify-between gap-4 bg-[#140E22] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#D8B4FE] mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold italic text-white">Jobverse</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Status: In Progress</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q2 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>

                  <div className="p-10 bg-white">
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">1. Executive Summary</h2>
                      <div className="bg-[#140E22] border-l-4 border-[#D8B4FE] px-6 py-5 my-5 text-[16px] leading-[1.7] text-slate-300 italic rounded-r-md">
                        "Finding a PM role means monitoring 5+ job boards daily, most of which are noisy and unfocused. Jobverse pulls every relevant posting into one aggregated, filterable feed — refreshed daily, PM-only."
                      </div>
                      <p className="text-[16px] leading-[1.8] text-slate-600">
                        Jobverse is a curated PM job board that aggregates postings from Ashby and Greenhouse across 200+ companies, filters to product management roles only, and surfaces salary, location, experience level, and source — all in one interface. Users can save dream companies to prioritize their roles at the top of every search.
                      </p>
                    </div>

                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">2. Problem Statement</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-purple-500 mb-3">The User Pain</h3>
                          <p className="text-[15px] leading-[1.7] text-slate-600 mb-4">
                            Active PM job seekers check LinkedIn, Greenhouse, Ashby job boards, and company career pages separately — often daily. Roles disappear quickly and there's no single view of what's open at the companies they care about.
                          </p>
                          <p className="text-[15px] leading-[1.7] text-slate-600">
                            General job boards (LinkedIn, Indeed) are flooded with irrelevant results and sponsored noise. PM-specific boards are either paywalled or rarely updated.
                          </p>
                        </div>
                        <div className="bg-[#140E22] p-5 rounded-lg border border-[#2A1F3D]">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#D8B4FE] mb-3">The Goal</h3>
                          <p className="text-[15px] leading-[1.7] text-slate-300">
                            Build the PM job seeker's daily home base: a zero-noise, high-signal feed that surfaces relevant roles faster than checking boards manually — with enough context (salary, remote, experience tier) to decide in seconds whether to apply.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">3. Target Audience & Personas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="border border-slate-100 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">1</div>
                            <h3 className="font-bold text-lg text-slate-900">The Active Candidate</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Primary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-slate-600">
                            Mid-level PM (3–7 yrs) actively interviewing. Checks job boards daily. <strong>Top needs:</strong> salary transparency, remote-first filter, and a shortlist of target companies surfaced first.
                          </p>
                        </div>
                        <div className="border border-slate-100 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">2</div>
                            <h3 className="font-bold text-lg text-slate-900">The Passive Watcher</h3>
                          </div>
                          <p className="text-[14px] text-slate-400 mb-3 font-mono">Secondary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-slate-600">
                            Employed PM who isn't urgently searching but wants to stay aware of the market. <strong>Top need:</strong> a low-friction weekly pulse check — see what's open at dream companies without a full job search session.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">4. Goals & Success Metrics (OKRs)</h2>
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full border-collapse text-[15px]">
                          <thead>
                            <tr>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Objective</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Key Result</th>
                              <th className="bg-slate-50 p-4 text-left font-mono text-[12px] uppercase tracking-widest text-slate-500 border-b-2 border-slate-100 w-1/3">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Prove feed quality</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Sessions with ≥1 job card clicked (Apply / Save)</td>
                              <td className="p-4 border-b border-slate-100 text-purple-600 font-mono font-semibold">&gt; 50%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Validate dream company feature</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">Users who star ≥1 company per session</td>
                              <td className="p-4 border-b border-slate-100 text-purple-600 font-mono font-semibold">&gt; 30%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Build daily habit</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">D7 Return Rate</td>
                              <td className="p-4 border-b border-slate-100 text-purple-600 font-mono font-semibold">&gt; 40%</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 border-b border-slate-100 text-slate-900 font-medium">Maximize data freshness</td>
                              <td className="p-4 border-b border-slate-100 text-slate-600">% of listings posted within last 7 days</td>
                              <td className="p-4 border-b border-slate-100 text-purple-600 font-mono font-semibold">&gt; 60%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">5. Competitive Landscape</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {[
                          { name: 'LinkedIn Jobs', gap: 'Dominant but noisy. Sponsored listings, non-PM roles, and recruiter spam dilute the feed. No salary transparency without Premium.' },
                          { name: 'Pallet / Teal', gap: 'PM-adjacent job boards but manually curated, slow to update, and don\'t pull directly from ATS sources. Limited company coverage.' },
                          { name: 'Company Career Pages', gap: 'The ground truth — but requires visiting 200+ pages individually. No aggregation, no unified filters, no salary view.' },
                        ].map((c, i) => (
                          <div key={i} className="bg-[#140E22] rounded-lg p-5 border border-[#2A1F3D]">
                            <div className="font-bold text-[#D8B4FE] mb-2">{c.name}</div>
                            <p className="text-[14px] text-slate-400 leading-relaxed">{c.gap}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[14px] text-slate-400 italic">Jobverse's wedge: <strong className="text-slate-600">direct ATS source + PM-only filter + salary context + dream company prioritization</strong> — no noise, no paywall.</p>
                    </div>

                    <div className="mb-8">
                      <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-[#D8B4FE]/20">6. Out of Scope (v1.0)</h2>
                      <ul className="list-none space-y-3 mt-4">
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>User Accounts / Application Tracking:</strong> Tracking applied jobs and interview stages is a V2 feature. v1 is a discovery and filtering tool, not a full ATS.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Email / Push Alerts:</strong> Real-time new-role notifications for starred companies require backend infrastructure. Deferred to V2 after core loop is validated.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-700 font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-slate-600"><strong>Non-PM Roles:</strong> Expanding to engineering, design, or other functions would dilute the PM-first identity and increase noise. Out of scope permanently unless spun into a separate product.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'roadmap-4' && (
                <>
                  {/* Sticky header */}
                  <div className="px-10 py-8 border-b border-[#2A1F3D] flex items-start justify-between gap-4 bg-[#140E22] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#D8B4FE] mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold italic text-white">Jobverse</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Status: In Progress</span>
                        <span>|</span><span>Author: TShaikh92</span>
                        <span>|</span><span>Updated: May 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>

                  {/* North Star banner */}
                  <div className="bg-[#140E22] px-10 py-12 border-b border-[#2A1F3D]">
                    <div className="max-w-3xl">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#D8B4FE]/60 mb-4">North Star</div>
                      <p className="text-[26px] md:text-[32px] font-black text-white leading-[1.2] tracking-tight mb-6">
                        The PM job seeker's daily home base —<br className="hidden md:block" />
                        <span className="text-[#D8B4FE]">zero noise, every relevant role, one view.</span>
                      </p>
                      <div className="flex flex-wrap gap-8 mt-8">
                        {[
                          { label: 'Target Metric', value: '> 40% D7 Return' },
                          { label: 'Coverage Goal', value: '500+ Companies' },
                          { label: 'Data Freshness', value: 'Refreshed Nightly' },
                        ].map((s, i) => (
                          <div key={i}>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#D8B4FE]/50 mb-1">{s.label}</div>
                            <div className="text-white font-black text-[18px]">{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white">
                    {[
                      {
                        phase: '01',
                        badge: 'Now',
                        badgeBg: 'bg-amber-400',
                        badgeText: 'text-amber-900',
                        title: 'Signal',
                        sub: 'Build the feed people come back to daily',
                        time: 'Q2 2026',
                        accent: 'border-amber-400',
                        items: [
                          { t: 'ATS Aggregation Engine', d: 'Pull from Ashby + Greenhouse across 200+ companies, filtered to PM-only keywords. No noise.', s: 'Done', dot: 'bg-green-500' },
                          { t: 'Filter Suite', d: 'Experience level, salary, remote/hybrid/onsite, location. Instant client-side results.', s: 'Done', dot: 'bg-green-500' },
                          { t: 'Dream Company Mode', d: 'Star any company to surface its roles at the top of every board session.', s: 'Done', dot: 'bg-green-500' },
                          { t: 'Nightly Refresh via CI', d: 'GitHub Actions regenerates jobs.json each night so listings never go stale.', s: 'In Progress', dot: 'bg-amber-400' },
                        ]
                      },
                      {
                        phase: '02',
                        badge: 'Next',
                        badgeBg: 'bg-[#D8B4FE]',
                        badgeText: 'text-purple-900',
                        title: 'Memory',
                        sub: 'Make the tool know who you are',
                        time: 'Q3 2026',
                        accent: 'border-[#D8B4FE]',
                        items: [
                          { t: 'User Accounts & Persistence', d: 'Auth layer so dream companies, saved roles, and filters survive across sessions and devices.', s: 'Planned', dot: 'bg-[#D8B4FE]' },
                          { t: 'New Role Alerts', d: 'Daily or weekly email digest when a starred company posts a new PM opening.', s: 'Planned', dot: 'bg-[#D8B4FE]' },
                          { t: 'Application Kanban', d: 'Lightweight tracker: Applied → Interviewing → Offer. No context-switching to another tool.', s: 'Planned', dot: 'bg-[#D8B4FE]' },
                        ]
                      },
                      {
                        phase: '03',
                        badge: 'Later',
                        badgeBg: 'bg-slate-200',
                        badgeText: 'text-slate-600',
                        title: 'Intelligence',
                        sub: 'Surface market insight, not just listings',
                        time: 'Q4 2026',
                        accent: 'border-slate-300',
                        items: [
                          { t: 'Salary Benchmarking', d: 'Median comp by title, level, and city derived from all aggregated postings — no third-party data buy needed.', s: 'Discovery', dot: 'bg-slate-400' },
                          { t: 'Hiring Velocity Signal', d: 'Track whether a company is rapidly adding PM headcount or quietly pulling back. Read the market.', s: 'Discovery', dot: 'bg-slate-400' },
                          { t: 'AI Role Fit Scoring', d: 'User defines 3–5 priorities (early stage, Series B, fintech, etc.) and Jobverse scores every listing against them.', s: 'Discovery', dot: 'bg-slate-400' },
                        ]
                      },
                      {
                        phase: '04',
                        badge: 'Vision',
                        badgeBg: 'bg-slate-100',
                        badgeText: 'text-slate-400',
                        title: 'Network',
                        sub: 'From job board to career layer',
                        time: 'Q1 2027+',
                        accent: 'border-slate-200',
                        items: [
                          { t: 'Warm Referral Layer', d: 'Match job seekers with PMs already at target companies. The difference between a cold apply and a referral is often the role.', s: 'Backlog', dot: 'bg-slate-300' },
                          { t: 'Company-Specific Interview Guides', d: 'Community-sourced PM interview questions and formats, tied to specific companies in the board.', s: 'Backlog', dot: 'bg-slate-300' },
                          { t: 'Monetization', d: 'Recruiter access to a curated PM talent pool, or featured placement for hiring companies. Revenue follows proven utility.', s: 'Backlog', dot: 'bg-slate-300' },
                        ]
                      },
                    ].map((phase, i) => (
                      <div key={i} className={`border-l-4 ${phase.accent} px-10 py-10 border-b border-slate-100 last:border-b-0`}>
                        <div className="flex flex-col md:flex-row md:items-start gap-8">
                          {/* Phase label */}
                          <div className="md:w-56 shrink-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`font-mono text-[10px] font-black px-2.5 py-1 uppercase tracking-widest rounded ${phase.badgeBg} ${phase.badgeText}`}>{phase.badge}</span>
                              <span className="font-mono text-[10px] text-slate-300 uppercase tracking-widest">{phase.time}</span>
                            </div>
                            <div className="font-black text-[48px] leading-none text-slate-100 select-none">{phase.phase}</div>
                            <h3 className="font-serif text-[22px] font-bold text-slate-900 mt-1">{phase.title}</h3>
                            <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">{phase.sub}</p>
                          </div>
                          {/* Items */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-slate-50 rounded-xl p-5 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{item.s}</span>
                                </div>
                                <h4 className="font-bold text-[14px] text-slate-900 leading-snug mb-2">{item.t}</h4>
                                <p className="text-[13px] text-slate-500 leading-relaxed">{item.d}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .clip-path-hero {
          clip-path: polygon(100% 0, 100% 100%, 15% 100%, 0 0);
        }
        .bg-placeholder {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(197,160,89,0.04) 8px, rgba(197,160,89,0.04) 9px);
        }
        @keyframes scroll-line {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-scroll-line {
          animation: scroll-line 1.8s ease-in-out infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease both;
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}
