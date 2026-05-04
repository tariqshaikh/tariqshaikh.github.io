/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ExternalLink, ChevronRight, Menu, X, Terminal, Layers, Globe, Phone, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FloatingNav from './FloatingNav';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logVisit } from '../lib/analytics';

export default function Portfolio() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

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
      <section className="relative min-h-[80vh] bg-[#F5F5F3] overflow-hidden flex flex-col pt-20 md:pt-24 pb-20 px-12">
        {/* Minimal Header Bar */}
        <div className="flex justify-between items-start font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-12 md:mb-16">
          <div>
            003+<br />Projects
          </div>
          <div className="text-slate-900">
            Portfolio
          </div>
          <div>
            EN
          </div>
        </div>

        {/* Massive Bold Heading - Centered */}
        <div className="relative w-full flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-[clamp(36px,9.5vw,168px)] font-black text-slate-900 tracking-[-0.05em] leading-[0.8] flex flex-col items-center select-none"
            >
              <span style={{ fontFamily: "'BakersLocal', serif" }} className="normal-case inline-block whitespace-nowrap transform scale-y-110 border-b-4 border-slate-900/5 pb-2">Tariq Shaikh</span>
            </motion.h1>
          </div>
          <div className="flex justify-between items-end">
            <div className="max-w-xs font-mono text-[10px] uppercase leading-relaxed text-slate-500">
              <span className="text-[18px] text-slate-900 font-black block mb-2 tracking-tight">Product Manager</span>
              Bridging data, strategy, and product.
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-900 font-black">
              Scroll <br />
              to explore
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="px-6 md:px-12 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Project 1 - Homebase NJ */}
            <div className="bg-[#090E1A] border border-white/5 p-8 md:p-10 transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_32px_64px_-16px_rgba(59,130,246,0.15)] relative overflow-hidden rounded-2xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-10">
                <span className="font-mono text-[9px] px-3 py-1 uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-full">Live Product</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold tracking-tighter">P.001</span>
              </div>
              <h3 className="text-[28px] md:text-[32px] leading-tight mb-2 text-white">
                <span className="font-serif font-bold text-white">Homebase</span> <span className="font-sans font-black text-blue-500 ml-1">NJ</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-xs mb-6 uppercase tracking-wider">Product Design & Data Strategy</p>
              
              <div className="relative mb-10">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-blue-500/30" />
                <p className="text-[14px] leading-[1.6] text-slate-300 pl-6 font-sans">
                  I collapsed 6 browser tabs into one weighted comparison tool built for real-world real estate decisions.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {['Consumer', 'Real Estate', 'Data Product'].map(tag => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 bg-blue-500/5 text-blue-400/50 border border-blue-500/10 tracking-widest uppercase font-bold">{tag}</span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link to="/homebase" className="btn-gradient-animated inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-blue-600 to-cyan-400 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]">
                  Launch Application <ChevronRight size={14} />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openModal('prd-1')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">PRD</button>
                  <button onClick={() => openModal('roadmap-1')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">Roadmap</button>
                </div>
              </div>
            </div>

            {/* Project 2 - Orbit */}
            <div className="bg-[#1A1C1E] border border-white/5 p-8 md:p-10 transition-all duration-500 hover:border-[#C5A059]/50 hover:shadow-[0_32px_64px_-16px_rgba(197,160,89,0.15)] relative overflow-hidden rounded-2xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C5A059] to-[#E5C079] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-10">
                <span className="font-mono text-[9px] px-3 py-1 uppercase tracking-widest bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold rounded-full">Live Product</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold tracking-tighter">P.002</span>
              </div>
              <h3 className="text-[28px] md:text-[32px] leading-tight mb-2 text-white">
                <span className="font-serif font-bold italic text-white">Orbit</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-xs mb-6 uppercase tracking-wider">Financial Simulation & Strategy</p>

              <div className="relative mb-10">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[#C5A059]/30" />
                <p className="text-[14px] leading-[1.6] text-slate-300 pl-6 font-sans">
                  A financial trajectory simulator designed to map annual cash flow and sinking funds.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {['Fintech', 'Simulation', 'Strategy'].map(tag => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 bg-[#C5A059]/5 text-[#C5A059]/50 border border-[#C5A059]/10 tracking-widest uppercase font-bold">{tag}</span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link to="/orbit" className="btn-gradient-animated inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-[#C5A059] to-[#F0D585] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_24px_rgba(197,160,89,0.45)]">
                  Launch Application <ChevronRight size={14} />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openModal('prd-2')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">PRD</button>
                  <button onClick={() => openModal('roadmap-2')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">Roadmap</button>
                </div>
              </div>
            </div>

            {/* Project 3 - Waves */}
            <div className="bg-[#0B1A1F] border border-white/5 p-8 md:p-10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_32px_64px_-16px_rgba(6,182,212,0.15)] relative overflow-hidden rounded-2xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-10">
                <span className="font-mono text-[9px] px-3 py-1 uppercase tracking-widest bg-cyan-700/20 text-cyan-400 border border-cyan-500/20 font-bold rounded-full">Coming Soon</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold tracking-tighter">P.003</span>
              </div>
              <h3 className="text-[28px] md:text-[32px] leading-tight mb-2 text-white">
                <span className="font-serif font-bold italic text-white">Waves</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-xs mb-6 uppercase tracking-wider">Dream trip planner & destination intelligence</p>

              <div className="relative mb-10">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-cyan-500/30" />
                <p className="text-[14px] leading-[1.6] text-slate-300 pl-6 font-sans">
                  Destination intelligence for dream trips. Visualizing when to go and what to see.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {['Travel', 'Data Viz', 'Collaboration'].map(tag => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 bg-cyan-500/5 text-cyan-400/50 border border-cyan-500/10 tracking-widest uppercase font-bold">{tag}</span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link to="/waves" className="btn-gradient-animated inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-cyan-600 to-teal-300 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_24px_rgba(6,182,212,0.5)]">
                  View Prototype <ChevronRight size={14} />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openModal('prd-3')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">PRD</button>
                  <button onClick={() => openModal('roadmap-3')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">Roadmap</button>
                </div>
              </div>
            </div>

            {/* Project 4 - Jobverse */}
            <div className="bg-[#140E22] border border-white/5 p-8 md:p-10 transition-all duration-500 hover:border-[#D8B4FE]/50 hover:shadow-[0_32px_64px_-16px_rgba(216,180,254,0.15)] relative overflow-hidden rounded-2xl group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-10">
                <span className="font-mono text-[9px] px-3 py-1 uppercase tracking-widest bg-[#D8B4FE]/10 text-[#D8B4FE] border border-[#D8B4FE]/20 font-bold rounded-full">New Concept</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold tracking-tighter">P.004</span>
              </div>
              <h3 className="text-[28px] md:text-[32px] leading-tight mb-2 text-white">
                <span className="font-serif font-bold italic text-white">Jobverse</span>
              </h3>
              <p className="font-serif italic text-slate-500 text-xs mb-6 uppercase tracking-wider">AI-Powered Job Search Intelligence</p>

              <div className="relative mb-10">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[#D8B4FE]/30" />
                <p className="text-[14px] leading-[1.6] text-slate-300 pl-6 font-sans">
                  Finding your dream job shouldn't feel like a second job. Jobverse cuts through the noise and surfaces what actually matters — the right role, at the right company, at the right time.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {['AI / LLM', 'Product Strategy', 'Big Data'].map(tag => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 bg-[#D8B4FE]/5 text-[#D8B4FE]/60 border border-[#D8B4FE]/10 tracking-widest uppercase font-bold">{tag}</span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link to="/jobverse" className="btn-gradient-animated inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-purple-600 to-[#D8B4FE] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:shadow-[0_0_24px_rgba(168,85,247,0.45)]">
                  View Concept <ChevronRight size={14} />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openModal('prd-4')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">PRD</button>
                  <button onClick={() => openModal('roadmap-4')} className="px-4 py-2.5 bg-white/5 text-[9px] text-slate-400 border border-white/10 font-bold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all cursor-pointer rounded-none">Roadmap</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="px-12 py-32 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">02 — Operating Model</span>
              </div>
              <h2 className="font-display text-[clamp(40px,7vw,96px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter">
                The <br />
                <span className="text-slate-300">Method</span>
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
      <section id="about" className="px-12 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-12">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">03 — About</span>
              </div>
              <h2 className="font-display text-[clamp(40px,7vw,96px)] font-black leading-[0.85] text-slate-900 uppercase tracking-tighter mb-12">
                The<br />
                <span className="text-slate-300">Builder</span>
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
                    <li>Roadmap Ownership</li>
                    <li>A/B Experimentation</li>
                    <li>User Research</li>
                    <li>0→1 Launches</li>
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-6">Expertise — Technical</div>
                  <ul className="text-sm font-black text-slate-900 uppercase tracking-tight flex flex-col gap-4">
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
      </section>

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
              <span className="font-mono text-[10px] text-slate-300 uppercase font-bold tracking-widest">Connect</span>
              <div className="flex flex-col gap-3">
                <a href="mailto:tshaikh92@gmail.com" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">Email</a>
                <a href="https://linkedin.com" target="_blank" className="font-sans text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight uppercase">LinkedIn</a>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <span className="font-mono text-[10px] text-slate-300 uppercase font-bold tracking-widest">Reach</span>
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

                    {/* Core Features */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">3. Core Features (MVP)</h2>
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
                          badgeClass: 'bg-green-50 text-green-700 border border-green-100', 
                          title: 'Deployment & Insights', 
                          time: 'Q2 2026',
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
                            { t: 'Wealth Simulator', d: 'Comprehensive retirement modeling and scenario analysis.', s: 'In Progress', dot: 'bg-slate-400' },
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

                      <h2 className="font-serif text-3xl text-slate-900 mb-6 border-b pb-4">3. Core Features (MVP)</h2>
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
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600"></span> Status: Live (v1.0)</span>
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
              {(activeModal === 'prd-4' || activeModal === 'roadmap-4') && (
                <div className="bg-[#140E22] p-20 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-[#D8B4FE] mb-6 bg-[#D8B4FE]/10 px-4 py-1.5 rounded-full border border-[#D8B4FE]/20">Documentation in Progress</div>
                  <h2 className="text-5xl font-serif font-bold text-white mb-6 italic">Jobverse</h2>
                  <p className="text-slate-400 max-w-md mx-auto leading-[1.8] text-lg">
                    The Product Requirements and Strategic Roadmap for Jobverse are currently being visualized.
                  </p>
                  <div className="mt-12 flex gap-4">
                    <div className="w-12 h-1 bg-[#D8B4FE]/20 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-[#D8B4FE] animate-pulse"></div>
                    </div>
                  </div>
                </div>
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
