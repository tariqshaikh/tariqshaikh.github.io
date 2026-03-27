/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ExternalLink, ChevronRight, Menu, X, Terminal, Layers, Globe, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Portfolio() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "Tariq Shaikh's Portfolio";
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="bg-[#FDFDFD] font-sans text-[#1A1C1E] min-h-screen selection:bg-[#C5A059]/30 selection:text-[#1C355E]">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-12 py-4.5 flex items-center justify-between border-b border-[#EEEEEF] transition-all duration-300 ${scrolled ? 'bg-[#FDFDFD]/94 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="font-mono text-sm tracking-widest uppercase text-[#6E8A96]">Tariq Shaikh</div>
        <div className="hidden md:flex gap-8">
          <a href="#projects" className="text-sm text-[#6E8A96] hover:text-[#1C355E] transition-colors tracking-wider">Work</a>
          <a href="#process" className="text-sm text-[#6E8A96] hover:text-[#1C355E] transition-colors tracking-wider">Process</a>
          <a href="#about" className="text-sm text-[#6E8A96] hover:text-[#1C355E] transition-colors tracking-wider">About</a>
          <a href="mailto:tshaikh92@gmail.com" className="text-sm text-[#6E8A96] hover:text-[#1C355E] transition-colors tracking-wider">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[75vh] flex flex-col justify-center px-12 pt-32 pb-20 overflow-hidden bg-[#FDFDFD] border-b-3 border-[#1C355E]">
        <div className="absolute top-0 right-0 w-[38%] h-[60%] bg-[#F8F9FA] clip-path-hero z-0 hidden md:block" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-mono text-[13px] tracking-[0.14em] uppercase text-[#1C355E] mb-5 animate-fade-up">
            <div className="w-8 h-px bg-[#C5A059]" />
            Product Manager · New York Metro
          </div>
          <h1 className="font-serif text-[clamp(64px,10vw,136px)] font-black leading-[0.9] tracking-tight mb-3.5 text-[#1A1C1E] animate-fade-up delay-100">
            Tariq<br /><span className="italic text-[#8B0000]">Shaikh</span>
          </h1>
          <p className="font-serif text-[clamp(18px,2.5vw,32px)] font-normal italic text-[#6E8A96] animate-fade-up delay-200">
            Product Manager
          </p>
        </div>
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-[12px] uppercase tracking-widest text-[#1C355E]/30 animate-fade-up delay-500 z-10">
          <div className="w-px h-10 bg-gradient-to-b from-[#C5A059] to-transparent animate-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="px-12 py-24 bg-[#F8F9FA] border-t border-[#EEEEEF]">
        <div className="flex items-center gap-5 mb-13">
          <span className="font-mono text-[13px] text-[#8B0000] font-bold tracking-widest">01</span>
          <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-none text-[#1A1C1E]">Selected Work</h2>
          <div className="flex-1 h-px bg-[#EEEEEF]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Project 1 */}
          <div className="bg-white border border-[#D4E8F0] p-10 transition-all duration-200 hover:border-[#A8CDD9] hover:shadow-xl hover:shadow-[#0471A4]/10 relative overflow-hidden rounded-[2px] group">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#0471A4] scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-[#6E8A96] tracking-widest">P — 001</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-[2px] uppercase tracking-wider bg-[#D4EDDE] text-[#1E5C38] border border-[#A8D5B8]">Live</span>
            </div>
            <h3 className="text-[32px] leading-[1.1] mb-1.5 text-[#1A1C1E]">
              <span className="font-serif font-bold">Homebase</span> <span className="font-sans font-black text-[#0471A4] ml-1">NJ</span>
            </h3>
            <p className="text-[15px] text-[#6E8A96] italic mb-4.5 font-serif">A homebuyer's decision tool</p>
            <p className="text-base leading-[1.75] text-[#3D4347] mb-7 pl-4 border-l-2 border-[#C8E6F5]">
              Every home buyer in NJ has 6 browser tabs open — Zillow, GreatSchools, NJ Transit, WalkScore, crime maps. I collapsed them into one weighted comparison tool built for real decisions.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {['Consumer', 'Real Estate', 'Data Product'].map(tag => (
                <span key={tag} className="font-mono text-[12px] px-2.5 py-1 rounded-[2px] bg-[#E8F4FB] text-[#0471A4] border border-[#C8E6F5] tracking-widest uppercase">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/homebase" className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0471A4] text-white rounded-[2px] text-sm font-semibold hover:bg-[#035480] transition-all">
                <ChevronRight size={13} /> Live Product
              </Link>
              <button onClick={() => openModal('prd-1')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-[#1A1C1E] border-2 border-[#D4E8F0] rounded-[4px] text-sm font-semibold hover:border-[#0471A4] hover:text-[#0471A4] hover:bg-[#F7FBFF] cursor-pointer transition-all">PRD</button>
              <button onClick={() => openModal('roadmap-1')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-[#1A1C1E] border-2 border-[#D4E8F0] rounded-[4px] text-sm font-semibold hover:border-[#0471A4] hover:text-[#0471A4] hover:bg-[#F7FBFF] cursor-pointer transition-all">Roadmap</button>
            </div>
          </div>

          {/* Project 2 - Orbit */}
          <div className="bg-[#1A1A1A] border border-[#333333] p-10 transition-all duration-200 hover:border-[#C5A059] hover:shadow-xl hover:shadow-[#C5A059]/10 relative overflow-hidden rounded-[2px] group">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#C5A059] scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-[#6E8A96] tracking-widest">P — 002</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-[2px] uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">In Development</span>
            </div>
            <h3 className="text-[32px] leading-[1.1] mb-1.5 text-white">
              <span className="font-serif font-bold italic">Orbit</span>
            </h3>
            <p className="text-[15px] text-[#6E8A96] italic mb-4.5 font-serif">Strategic wealth simulator</p>
            <p className="text-base leading-[1.75] text-[#D1D1D1] mb-7 pl-4 border-l-2 border-[#C5A059]/40">
              Most people know what they spent yesterday, but not how it impacts their life 10 years from now. Orbit is a "What-If" engine for your financial future.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {['Fintech', 'Simulation', 'Strategy'].map(tag => (
                <span key={tag} className="font-mono text-[12px] px-2.5 py-1 rounded-[2px] bg-[#333333] text-[#C5A059] border border-[#444444] tracking-widest uppercase">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/orbit" className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#C5A059] text-[#1A1A1A] rounded-[2px] text-sm font-bold hover:bg-[#B38F48] transition-all">
                <ChevronRight size={13} /> View App
              </Link>
              <button onClick={() => openModal('prd-2')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-[#333333] rounded-[4px] text-sm font-semibold hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#C5A059]/5 cursor-pointer transition-all">PRD</button>
              <button onClick={() => openModal('roadmap-2')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-[#333333] rounded-[4px] text-sm font-semibold hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#C5A059]/5 cursor-pointer transition-all">Roadmap</button>
            </div>
          </div>

          {/* Placeholder */}
          <div className="bg-[#E8F4FB] border border-[#D4E8F0] p-10 relative overflow-hidden rounded-[2px] bg-placeholder">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-[#6E8A96] tracking-widest">P — 003</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-[2px] uppercase tracking-wider bg-[#F7FBFF] text-[#6E8A96] border border-[#D4E8F0]">Planned</span>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl text-[#C8E6F5] font-serif leading-none mb-4">+</div>
              <p className="text-[15px] text-[#6E8A96] leading-[1.6] max-w-[240px] mx-auto">Next project in ideation. Check back soon.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="px-12 py-24 bg-[#1C355E]">
        <div className="flex items-center gap-5 mb-13">
          <span className="font-mono text-[13px] text-[#8B0000] tracking-widest">02</span>
          <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-none text-white">How I Work</h2>
          <div className="flex-1 h-px bg-white/15" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/15">
          {[
            { num: '01', title: 'Define the problem', desc: 'Every project starts with a user problem I can articulate in one sentence. If I can\'t, I don\'t build yet.' },
            { num: '02', title: 'Write the PRD', desc: 'Before touching code, I write out the user, the problem, success metrics, tradeoffs, and what\'s explicitly out of scope.' },
            { num: '03', title: 'Ship a V1', desc: 'Small, focused, completable. The goal is something real people can use — not something perfect.' },
            { num: '04', title: 'Learn & iterate', desc: 'What did users actually do? What confused them? What did I get wrong? V2 is always better than V1.' },
          ].map((step, i) => (
            <div key={i} className={`p-10 border-white/12 ${i !== 3 ? 'lg:border-r' : ''} ${i % 2 === 0 ? 'sm:border-r lg:border-r' : ''}`}>
              <div className="font-serif text-[52px] font-black text-[#8B0000]/20 leading-none mb-4">{step.num}</div>
              <div className="font-serif text-xl font-bold mb-2.5 text-white">{step.title}</div>
              <p className="text-[15px] leading-[1.75] text-white/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-12 py-24 bg-[#FDFDFD] border-t border-[#EEEEEF]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-5 mb-8">
            <span className="font-mono text-[13px] text-[#8B0000] font-bold tracking-widest">03</span>
            <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-none text-[#1A1C1E]">About</h2>
            <div className="flex-1 h-px bg-[#EEEEEF]" />
          </div>
          <p className="text-[17px] leading-[1.85] text-[#3D4347] mb-4.5">I'm a <strong className="text-[#1A1C1E] font-semibold">Senior Data Strategist at Indeed</strong> with a background in frontend engineering and a Stanford PM certificate. I've spent 6+ years at the intersection of data, engineering, and product.</p>
          <p className="text-[17px] leading-[1.85] text-[#3D4347] mb-4.5">I build things that solve real problems. The portfolio you're reading right now is one of them — I built every project here, wrote every PRD, and defined every roadmap myself.</p>
          <p className="text-[17px] leading-[1.85] text-[#3D4347] mb-4.5">Based in <strong className="text-[#1A1C1E] font-semibold">New Jersey</strong>. Open to PM roles in B2B SaaS and consumer products.</p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            <div>
              <div className="font-mono text-[12px] uppercase tracking-widest text-[#1C355E] font-bold mb-2">Product</div>
              <div className="text-[15px] leading-[2] text-[#3D4347]">Roadmap Ownership<br />A/B Experimentation<br />User Research<br />0→1 Launches<br />Agile / Scrum</div>
            </div>
            <div>
              <div className="font-mono text-[12px] uppercase tracking-widest text-[#1C355E] font-bold mb-2">Technical</div>
              <div className="text-[15px] leading-[2] text-[#3D4347]">JavaScript / React<br />SQL & Tableau<br />Data Automation<br />Front-End Arch.<br />Accessibility</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-12 py-9 border-t-3 border-[#8B0000] bg-[#1C355E] flex items-center justify-between flex-wrap gap-4">
        <div className="font-mono text-[13px] text-white/40 tracking-wider uppercase">© 2026 Tariq Shaikh · PM Portfolio</div>
        <div className="flex gap-6">
          <a href="mailto:tshaikh92@gmail.com" className="font-mono text-[13px] text-white/60 hover:text-[#8B0000] transition-colors tracking-wider">tshaikh92@gmail.com</a>
          <a href="tel:8483914393" className="font-mono text-[13px] text-white/60 hover:text-[#8B0000] transition-colors tracking-wider">848-391-4393</a>
          <a href="https://linkedin.com" target="_blank" className="font-mono text-[13px] text-white/60 hover:text-[#8B0000] transition-colors tracking-wider">LinkedIn</a>
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
            className="fixed inset-0 z-[200] bg-[#1C355E]/20 backdrop-blur-md overflow-y-auto px-6 py-10 flex items-start justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-white text-[#1A1C1E] max-w-[1100px] w-full rounded-[3px] overflow-hidden shadow-2xl shadow-[#1C355E]/20"
            >
              {activeModal === 'prd-1' && (
                <>
                  <div className="px-10 py-8 border-b border-[#D4E8F0] flex items-start justify-between gap-4 bg-[#E8F4FB] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#0471A4] mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-[#1A1C1E]">Homebase</span> <span className="font-sans font-black text-[#0471A4] ml-1">NJ</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-[#6E8A96]">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1E5C38]"></span> Status: Shipped (v1.0)</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q2 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-[#6E8A96] text-3xl leading-none p-1 hover:text-[#1A1C1E] transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    {/* Executive Summary */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">1. Executive Summary</h2>
                      <div className="bg-[#F7FBFF] border-l-4 border-[#0471A4] px-6 py-5 my-5 text-[16px] leading-[1.7] text-[#3D4347] italic rounded-r-md">
                        "Every home buyer in NJ is doing this research manually across 5–6 different tabs. This tool collapses that into one weighted comparison view, empowering data-driven real estate decisions."
                      </div>
                      <p className="text-[16px] leading-[1.8] text-[#3D4347]">
                        Homebase NJ is a consumer-facing web application designed to help prospective homebuyers in Union County, NJ, compare municipalities across seven critical dimensions: schools, commute, safety, affordability, downtown activity, property taxes, and market competitiveness. By allowing users to assign dynamic weights to their personal priorities, Homebase NJ transforms fragmented, overwhelming data into a personalized, actionable ranking.
                      </p>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">2. Problem Statement</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#0471A4] mb-3">The User Pain</h3>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347] mb-4">
                            Home buying research is severely fragmented. A buyer making a $600K+ decision is forced to manually cross-reference GreatSchools, Zillow, NJ Transit schedules, WalkScore, crime databases, and NJ tax records. 
                          </p>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347]">
                            These data sources exist in different formats, making it impossible to weigh trade-offs effectively (e.g., "Is the higher tax rate in Westfield worth the better commute compared to Cranford?").
                          </p>
                        </div>
                        <div className="bg-[#F7FBFF] p-5 rounded-lg border border-[#D4E8F0]">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#0471A4] mb-3">Current Workarounds</h3>
                          <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-[#3D4347] space-y-2">
                            <li>Massive, unmaintainable Excel spreadsheets.</li>
                            <li>Relying entirely on subjective real estate agent advice.</li>
                            <li>"Analysis paralysis" leading to delayed offers in a highly competitive market.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">3. Target Audience & Personas</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="border border-[#D4E8F0] rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#E8F4FB] flex items-center justify-center text-[#0471A4] font-bold">1</div>
                            <h3 className="font-bold text-lg text-[#1A1C1E]">The Ex-Urbanite Family</h3>
                          </div>
                          <p className="text-[14px] text-[#6E8A96] mb-3 font-mono">Primary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-[#3D4347]">
                            Moving from NYC/Hoboken to the suburbs for more space. <strong>Top priorities:</strong> Commute time to Penn Station, school ratings, and maintaining a walkable downtown lifestyle.
                          </p>
                        </div>
                        <div className="border border-[#D4E8F0] rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#E8F4FB] flex items-center justify-center text-[#0471A4] font-bold">2</div>
                            <h3 className="font-bold text-lg text-[#1A1C1E]">The Value Optimizer</h3>
                          </div>
                          <p className="text-[14px] text-[#6E8A96] mb-3 font-mono">Secondary Persona</p>
                          <p className="text-[15px] leading-[1.6] text-[#3D4347]">
                            First-time homebuyers priced out of tier-1 towns. <strong>Top priorities:</strong> Affordability, lower property taxes, and finding "up-and-coming" neighborhoods with acceptable safety ratings.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Goals & Success Metrics */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">4. Goals & Success Metrics (OKRs)</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[15px] mt-4">
                          <thead>
                            <tr>
                              <th className="bg-[#F7FBFF] p-4 text-left font-mono text-[12px] uppercase tracking-widest text-[#0471A4] border-b-2 border-[#D4E8F0] w-1/3">Objective</th>
                              <th className="bg-[#F7FBFF] p-4 text-left font-mono text-[12px] uppercase tracking-widest text-[#0471A4] border-b-2 border-[#D4E8F0] w-1/3">Key Result (Metric)</th>
                              <th className="bg-[#F7FBFF] p-4 text-left font-mono text-[12px] uppercase tracking-widest text-[#0471A4] border-b-2 border-[#D4E8F0] w-1/3">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-[#F7FBFF] transition-colors">
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1A1C1E] font-medium">Drive deep user engagement</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#3D4347]">Sessions with 3+ towns compared</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1E5C38] font-mono font-semibold">&gt; 65%</td>
                            </tr>
                            <tr className="hover:bg-[#F7FBFF] transition-colors">
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1A1C1E] font-medium">Validate dynamic weighting feature</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#3D4347]">Sessions where default weights are modified</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1E5C38] font-mono font-semibold">&gt; 40%</td>
                            </tr>
                            <tr className="hover:bg-[#F7FBFF] transition-colors">
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1A1C1E] font-medium">Establish tool utility</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#3D4347]">Qualitative feedback (user interviews)</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1E5C38] font-mono font-semibold">4/5 report narrowed choices</td>
                            </tr>
                            <tr className="hover:bg-[#F7FBFF] transition-colors">
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1A1C1E] font-medium">Build habit/retention</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#3D4347]">D7 Retention Rate</td>
                              <td className="p-4 border-b border-[#D4E8F0] text-[#1E5C38] font-mono font-semibold">&gt; 25%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Core Features & Requirements */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">5. Core Features & Requirements</h2>
                      
                      <div className="space-y-6 mt-6">
                        <div className="border border-[#D4E8F0] rounded-lg overflow-hidden">
                          <div className="bg-[#F7FBFF] px-5 py-3 border-b border-[#D4E8F0] flex items-center gap-3">
                            <span className="bg-[#0471A4] text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P0</span>
                            <h3 className="font-bold text-[#1A1C1E]">Dynamic Priority Weighting</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-[#3D4347] mb-3">Users must be able to rank 7 distinct categories (Schools, Commute, Safety, etc.) by importance. The UI should support drag-and-drop or simple click-to-rank interactions.</p>
                            <p className="text-[14px] text-[#6E8A96] italic">Acceptance Criteria: Changing a weight must instantly recalculate the "Match Score" for all selected towns without a page reload.</p>
                          </div>
                        </div>

                        <div className="border border-[#D4E8F0] rounded-lg overflow-hidden">
                          <div className="bg-[#F7FBFF] px-5 py-3 border-b border-[#D4E8F0] flex items-center gap-3">
                            <span className="bg-[#0471A4] text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P0</span>
                            <h3 className="font-bold text-[#1A1C1E]">Side-by-Side Town Comparison Matrix</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-[#3D4347] mb-3">A responsive data grid allowing users to compare up to 5 towns simultaneously. Must include visual indicators (heatmaps or color coding) to show relative performance in each category.</p>
                            <p className="text-[14px] text-[#6E8A96] italic">Acceptance Criteria: Grid must be horizontally scrollable on mobile. Best-in-class metrics should be highlighted in green; worst in red/orange.</p>
                          </div>
                        </div>

                        <div className="border border-[#D4E8F0] rounded-lg overflow-hidden">
                          <div className="bg-[#F7FBFF] px-5 py-3 border-b border-[#D4E8F0] flex items-center gap-3">
                            <span className="bg-[#6E8A96] text-white text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider">P1</span>
                            <h3 className="font-bold text-[#1A1C1E]">"Perfect Match" Algorithm</h3>
                          </div>
                          <div className="p-5">
                            <p className="text-[15px] text-[#3D4347] mb-3">A proprietary scoring system (0-100) that normalizes disparate data types (e.g., minutes vs. dollars vs. 1-10 ratings) and applies the user's custom weights to recommend the #1 town.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Sources */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">6. Data Architecture & Sources</h2>
                      <div className="bg-white border border-[#D4E8F0] rounded-lg overflow-hidden mt-4">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              <th className="p-4 border-b-2 border-[#D4E8F0] font-mono text-[12px] uppercase tracking-widest text-[#6E8A96] bg-[#F7FBFF]">Metric</th>
                              <th className="p-4 border-b-2 border-[#D4E8F0] font-mono text-[12px] uppercase tracking-widest text-[#6E8A96] bg-[#F7FBFF]">Source</th>
                              <th className="p-4 border-b-2 border-[#D4E8F0] font-mono text-[12px] uppercase tracking-widest text-[#6E8A96] bg-[#F7FBFF]">Normalization Logic</th>
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
                              <tr key={i} className="hover:bg-[#F7FBFF] transition-colors">
                                <td className="p-4 border-b border-[#D4E8F0] font-semibold text-[#1A1C1E]">{row.m}</td>
                                <td className="p-4 border-b border-[#D4E8F0] text-[#3D4347]">{row.s}</td>
                                <td className="p-4 border-b border-[#D4E8F0] text-[#6E8A96] text-sm">{row.t}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Out of Scope */}
                    <div className="mb-8">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#E8F4FB]">7. Out of Scope (v1.0)</h2>
                      <ul className="list-none space-y-3 mt-4">
                        <li className="flex items-start gap-3">
                          <span className="text-[#A83220] font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>Live MLS Integration:</strong> We are comparing <em>towns</em>, not individual active listings. Showing active homes is deferred to v2.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-[#A83220] font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>User Accounts/Auth:</strong> Users will not be able to save their comparisons to a profile in v1. State will be managed locally via URL parameters or localStorage.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-[#A83220] font-bold mt-0.5">✕</span>
                          <span className="text-[15px] text-[#3D4347]"><strong>Counties outside Union County:</strong> Initial launch is restricted to a single county to ensure data accuracy and validate the algorithm before scaling statewide.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'prd-2' && (
                <>
                  <div className="px-10 py-8 border-b border-[#333333] flex items-start justify-between gap-4 bg-[#1A1A1A] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#C5A059] mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-white italic">Orbit</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-[#6E8A96]">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span> Status: In Development</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q3 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-[#6E8A96] text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-[#FDFDFD]">
                    {/* Executive Summary */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">1. Executive Summary</h2>
                      <div className="bg-[#1A1A1A] border-l-4 border-[#C5A059] px-6 py-5 my-5 text-[16px] leading-[1.7] text-[#D1D1D1] italic rounded-r-md">
                        "Most people know what they spent yesterday, but they have no idea how today's decisions impact their life 10 years from now. Orbit is a 'What-If' engine for your financial future."
                      </div>
                      <p className="text-[16px] leading-[1.8] text-[#3D4347]">
                        Orbit is a strategic wealth simulator designed to help users move beyond backward-looking expense tracking. By focusing on forward-looking scenarios (e.g., career changes, home purchases, aggressive investing), Orbit provides a "Financial North Star" that helps users understand the long-term opportunity cost of their current decisions.
                      </p>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">2. Problem Statement</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-3">The User Pain</h3>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347] mb-4">
                            Financial tools are either too simple (expense trackers like Mint/Rocket Money) or too complex (Excel spreadsheets with 50 tabs). Users lack a middle ground that provides strategic clarity.
                          </p>
                          <p className="text-[15px] leading-[1.7] text-[#3D4347]">
                            Users suffer from "Decision Paralysis" because they cannot easily visualize the trade-offs between competing priorities (e.g., "Should I pay off my student loans or max out my Roth IRA?").
                          </p>
                        </div>
                        <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#333333]">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#C5A059] mb-3">The Goal</h3>
                          <p className="text-[15px] leading-[1.7] text-[#D1D1D1]">
                            To create a tool that turns "Net Worth" from a static number into a living, breathing trajectory. We want to move users from "What did I spend?" to "What can I become?"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Core Features */}
                    <div className="mb-12">
                      <h2 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-4 pb-2 border-b-2 border-[#C5A059]/20">3. Core Features (MVP)</h2>
                      <div className="space-y-6 mt-6">
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-[#F7FBFF]">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1E5C38]" />
                            Financial Position Ledger (Live)
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Real-time net worth calculation with debounced auto-save and multi-currency support (15+ global currencies).</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            The "What-If" Engine
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Interactive sliders to simulate career changes, market returns, and major purchases with real-time impact on "Retirement Date."</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            AI Wealth Coach
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">A Gemini-powered advisor that analyzes your specific scenario and suggests the most efficient "Next Move."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeModal === 'roadmap-1' && (
                <>
                  <div className="px-10 py-8 border-b border-[#D4E8F0] flex items-start justify-between gap-4 bg-[#E8F4FB] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#0471A4] mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-[#1A1C1E]">Homebase</span> <span className="font-sans font-black text-[#0471A4] ml-1">NJ</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-[#6E8A96]">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1E5C38]"></span> Status: Shipped (v1.0)</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: Q1 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-[#6E8A96] text-3xl leading-none p-1 hover:text-[#1A1C1E] transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          badge: 'V1 — Shipped', 
                          badgeClass: 'bg-[#D4EDDE] text-[#1E5C38] border border-[#A8D5B8]', 
                          title: 'Core MVP', 
                          time: 'Q1 2026',
                          items: [
                            { t: 'Static Comparison Grid', d: '5-town pilot (Union County) with 7 scored dimensions.', s: 'Done', dot: 'bg-[#1E5C38]' },
                            { t: 'Dynamic Priority Engine', d: 'Drag-to-rank priority bubbles with live recalculation of the Match Score.', s: 'Done', dot: 'bg-[#1E5C38]' },
                            { t: 'Mobile-Responsive UI', d: 'Horizontal scrolling and optimized layout for mobile users.', s: 'Done', dot: 'bg-[#1E5C38]' },
                          ]
                        },
                        { 
                          badge: 'V2 — Up Next', 
                          badgeClass: 'bg-[#E8F4FB] text-[#0471A4] border border-[#C8E6F5]', 
                          title: 'Personalization', 
                          time: 'Q2 2026',
                          items: [
                            { t: 'Household Budget Input', d: 'Input income, down payment, and rates to filter out towns outside true affordability.', s: 'In Progress', dot: 'bg-[#0471A4]' },
                            { t: 'Live MLS / Zillow API', d: 'Replace static median prices with real-time active inventory and list prices.', s: 'Planned', dot: 'bg-[#0471A4]' },
                            { t: 'User Accounts & Auth', d: 'Allow users to save multiple comparison scenarios and share them with partners.', s: 'Planned', dot: 'bg-[#0471A4]' },
                          ]
                        },
                        { 
                          badge: 'V3 — Scaling', 
                          badgeClass: 'bg-[#F7FBFF] text-[#6E8A96] border border-[#D4E8F0]', 
                          title: 'Statewide Expansion', 
                          time: 'Q3 2026',
                          items: [
                            { t: 'NJ Statewide Rollout', d: 'Expand from Union County to all 21 New Jersey counties, categorizing by region.', s: 'Discovery', dot: 'bg-[#6E8A96]' },
                            { t: 'Hyper-Local Commute', d: 'Multi-modal transit routing (e.g., drive to train + train to Penn Station).', s: 'Discovery', dot: 'bg-[#6E8A96]' },
                            { t: 'School Zones Overlay', d: 'Map-based visualization of exact elementary/middle school zones within a town.', s: 'Discovery', dot: 'bg-[#6E8A96]' },
                          ]
                        },
                        { 
                          badge: 'V4 — Vision', 
                          badgeClass: 'bg-[#F7FBFF] text-[#6E8A96] border border-[#D4E8F0]', 
                          title: 'National & Monetization', 
                          time: 'Q4 2026+',
                          items: [
                            { t: 'US National Expansion', d: 'Scale the data pipeline to support the top 50 US Metropolitan Statistical Areas (MSAs).', s: 'Backlog', dot: 'bg-[#6E8A96]' },
                            { t: 'Predictive Insights', d: 'AI-driven insights on bidding wars, average days on market, and offer strategies.', s: 'Backlog', dot: 'bg-[#6E8A96]' },
                            { t: 'Agent Lead Gen Engine', d: 'Monetization: Connect high-intent buyers with top-rated local real estate agents.', s: 'Backlog', dot: 'bg-[#6E8A96]' },
                          ]
                        }
                      ].map((phase, i) => (
                        <div key={i} className="bg-[#F7FBFF] border border-[#D4E8F0] rounded-xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                          <div className="mb-5">
                            <span className={`font-mono text-[11px] px-2.5 py-1 rounded uppercase tracking-widest font-bold whitespace-nowrap ${phase.badgeClass}`}>{phase.badge}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-2">{phase.title}</h3>
                          <div className="font-mono text-[13px] text-[#6E8A96] mb-6 pb-4 border-b border-[#D4E8F0]">{phase.time}</div>
                          
                          <div className="space-y-4 flex-1">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-white border border-[#D4E8F0] p-4 rounded-lg shadow-sm hover:border-[#0471A4] transition-colors group">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                    <h4 className="font-bold text-[14px] text-[#1A1C1E] leading-tight group-hover:text-[#0471A4] transition-colors">{item.t}</h4>
                                  </div>
                                </div>
                                <p className="text-[13px] text-[#6E8A96] leading-relaxed mb-3">{item.d}</p>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E8A96] bg-[#F7FBFF] inline-block px-2 py-1 rounded border border-[#D4E8F0]">{item.s}</div>
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
                  <div className="px-10 py-8 border-b border-[#333333] flex items-start justify-between gap-4 bg-[#1A1A1A] sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-[#C5A059] mb-2">Product Roadmap</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-white italic">Orbit</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-[#6E8A96]">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span> Status: In Development</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: Q1 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-[#6E8A96] text-3xl leading-none p-1 hover:text-white transition-colors">✕</button>
                  </div>
                  
                  <div className="p-10 bg-[#FDFDFD]">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          badge: 'V1 — Current', 
                          badgeClass: 'bg-[#D4EDDE] text-[#1E5C38] border border-[#A8D5B8]', 
                          title: 'Strategic Core', 
                          time: 'Q1 2026',
                          items: [
                            { t: 'Wealth Pulse Dashboard', d: 'Real-time visualization of net worth with auto-save.', s: 'Done', dot: 'bg-[#1E5C38]' },
                            { t: 'Multi-Currency Engine', d: 'Support for 15+ global currencies with real-time conversion.', s: 'Done', dot: 'bg-[#1E5C38]' },
                            { t: 'What-If Engine', d: 'Interactive simulation of major life events (house, career, kids).', s: 'Planned', dot: 'bg-[#C5A059]' },
                          ]
                        },
                        { 
                          badge: 'V2 — Intelligence', 
                          badgeClass: 'bg-[#1A1A1A] text-[#C5A059] border border-[#333333]', 
                          title: 'AI Advisory', 
                          time: 'Q2 2026',
                          items: [
                            { t: 'Gemini Wealth Coach', d: 'Personalized strategic advice based on scenario analysis.', s: 'Discovery', dot: 'bg-[#C5A059]' },
                            { t: 'Statement Analyzer', d: 'Granular insights from uploaded financial statements.', s: 'Planned', dot: 'bg-[#C5A059]' },
                          ]
                        }
                      ].map((phase, i) => (
                        <div key={i} className="bg-white border border-[#EEEEEF] rounded-xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                          <div className="mb-5">
                            <span className={`font-mono text-[11px] px-2.5 py-1 rounded uppercase tracking-widest font-bold whitespace-nowrap ${phase.badgeClass}`}>{phase.badge}</span>
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-[#1A1C1E] mb-2">{phase.title}</h3>
                          <div className="font-mono text-[13px] text-[#6E8A96] mb-6 pb-4 border-b border-[#EEEEEF]">{phase.time}</div>
                          
                          <div className="space-y-4 flex-1">
                            {phase.items.map((item, j) => (
                              <div key={j} className="bg-[#FDFDFD] border border-[#EEEEEF] p-4 rounded-lg shadow-sm hover:border-[#C5A059] transition-colors group">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                                    <h4 className="font-bold text-[14px] text-[#1A1C1E] leading-tight group-hover:text-[#C5A059] transition-colors">{item.t}</h4>
                                  </div>
                                </div>
                                <p className="text-[13px] text-[#6E8A96] leading-relaxed mb-3">{item.d}</p>
                                <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E8A96] bg-white inline-block px-2 py-1 rounded border border-[#EEEEEF]">{item.s}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
          background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(4,113,164,0.04) 8px, rgba(4,113,164,0.04) 9px);
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
