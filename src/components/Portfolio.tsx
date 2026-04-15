/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ExternalLink, ChevronRight, Menu, X, Terminal, Layers, Globe, Phone, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="bg-white font-sans text-slate-900 min-h-screen selection:bg-blue-100 selection:text-slate-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-12 py-4.5 flex items-center justify-between border-b border-slate-200 transition-all duration-300 ${scrolled ? 'bg-white/94 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="font-mono text-sm tracking-widest uppercase text-slate-500">Tariq Shaikh</div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#projects" className="text-sm text-slate-500 hover:text-slate-900 transition-colors tracking-wider">Work</a>
          <a href="#process" className="text-sm text-slate-500 hover:text-slate-900 transition-colors tracking-wider">Process</a>
          <a href="#about" className="text-sm text-slate-500 hover:text-slate-900 transition-colors tracking-wider">About</a>
          <a href="mailto:tshaikh92@gmail.com" className="text-sm text-slate-500 hover:text-slate-900 transition-colors tracking-wider">Contact</a>
          
          <div className="w-px h-4 bg-slate-200"></div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[75vh] flex flex-col justify-center px-12 pt-32 pb-20 overflow-hidden bg-white border-b-3 border-slate-900">
        <div className="absolute top-0 right-0 w-[38%] h-[60%] bg-slate-100/50 clip-path-hero z-0 hidden md:block" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-mono text-[13px] tracking-[0.14em] uppercase text-slate-900 mb-5 animate-fade-up">
            <div className="w-8 h-px bg-blue-600" />
            Product Manager · New York Metro
          </div>
          <h1 className="font-serif text-[clamp(64px,10vw,136px)] font-black leading-[0.9] tracking-tight mb-3.5 text-slate-900 animate-fade-up delay-100">
            Tariq<br /><span className="italic text-blue-900">Shaikh</span>
          </h1>
          <p className="font-serif text-[clamp(18px,2.5vw,32px)] font-normal italic text-slate-500 animate-fade-up delay-200">
            Product Manager
          </p>
        </div>
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-[12px] uppercase tracking-widest text-slate-900/30 animate-fade-up delay-500 z-10">
          <div className="w-px h-10 bg-gradient-to-b from-blue-600 to-transparent animate-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="px-12 py-24 bg-white border-t border-slate-200">
        <div className="flex flex-col mb-13">
          <div className="flex items-center gap-5">
            <span className="font-mono text-[13px] text-blue-600 font-bold tracking-widest">01</span>
            <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-none text-slate-900">Selected Work</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <p className="mt-4 text-slate-500 font-serif italic text-lg max-w-2xl">
            A curated selection of purpose-built applications, designed to solve genuine personal needs and demonstrate a product-driven approach to engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Project 1 */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-10 transition-all duration-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 relative overflow-hidden rounded-xl group">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-blue-500 scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-slate-400 tracking-widest">P — 001</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-lg uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">Live</span>
            </div>
            <h3 className="text-[32px] leading-[1.1] mb-1.5 text-white">
              <span className="font-serif font-bold">Homebase</span> <span className="font-sans font-black text-blue-500 ml-1">NJ</span>
            </h3>
            <p className="text-[15px] text-slate-400 italic mb-4.5 font-serif">A homebuyer's decision tool</p>
            <p className="text-base leading-[1.75] text-slate-300 mb-7 pl-4 border-l-2 border-blue-500/40">
              Every home buyer in NJ has 6 browser tabs open — Zillow, GreatSchools, NJ Transit, WalkScore, crime maps. I collapsed them into one weighted comparison tool built for real decisions.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {['Consumer', 'Real Estate', 'Data Product'].map(tag => (
                <span key={tag} className="font-mono text-[12px] px-2.5 py-1 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 tracking-widest uppercase">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/homebase" className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-all">
                <ChevronRight size={13} /> Live Product
              </Link>
              <button onClick={() => openModal('prd-1')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-slate-700 rounded-[4px] text-sm font-semibold hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all">PRD</button>
              <button onClick={() => openModal('roadmap-1')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-slate-700 rounded-[4px] text-sm font-semibold hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all">Roadmap</button>
            </div>
          </div>

          {/* Project 2 - Orbit */}
          <div className="bg-[#2C3338] border border-[#3D4347] p-10 transition-all duration-200 hover:border-[#C5A059] hover:shadow-xl hover:shadow-[#C5A059]/10 relative overflow-hidden rounded-xl group">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#C5A059] scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-[#8C8670] tracking-widest">P — 002</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-lg uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">Take a look! (In Development)</span>
            </div>
            <h3 className="text-[32px] leading-[1.1] mb-1.5 text-white">
              <span className="font-serif font-bold italic">Orbit</span>
            </h3>
            <p className="text-[15px] text-slate-400 italic mb-4.5 font-serif">Strategic wealth simulator</p>
            <p className="text-base leading-[1.75] text-slate-300 mb-7 pl-4 border-l-2 border-[#C5A059]/40">
              Project your financial trajectory based on real inflow and outflow. Orbit helps you visualize the impact of life's big decisions—from daycare and new cars to long-term investments—by mapping your annual surplus.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {['Fintech', 'Simulation', 'Strategy'].map(tag => (
                <span key={tag} className="font-mono text-[12px] px-2.5 py-1 rounded-lg bg-slate-800 text-[#C5A059] border border-slate-700 tracking-widest uppercase">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/orbit" className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#C5A059] text-slate-900 rounded-lg text-sm font-bold hover:bg-[#B38F48] transition-all">
                <ChevronRight size={13} /> View App
              </Link>
              <button onClick={() => openModal('prd-2')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-slate-700 rounded-[4px] text-sm font-semibold hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#C5A059]/5 cursor-pointer transition-all">PRD</button>
              <button onClick={() => openModal('roadmap-2')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-white border-2 border-slate-700 rounded-[4px] text-sm font-semibold hover:border-[#C5A059] hover:text-[#C5A059] hover:bg-[#C5A059]/5 cursor-pointer transition-all">Roadmap</button>
            </div>
          </div>

          {/* Project 3 - Waves */}
          <div className="bg-[#1A2E35] border border-[#257E8C]/30 p-10 transition-all duration-200 hover:border-[#137D97] hover:shadow-xl hover:shadow-[#137D97]/20 relative overflow-hidden rounded-xl group">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#137D97] scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[13px] text-[#7EAAC7] tracking-widest">P — 003</span>
              <span className="font-mono text-[12px] px-2.5 py-1 rounded-lg uppercase tracking-wider bg-[#137D97]/20 text-[#C9DCE6] border border-[#137D97]/30">Take a look! (In Development)</span>
            </div>
            <h3 className="text-[32px] leading-[1.1] mb-1.5 text-white">
              <span className="font-serif font-bold italic">Waves</span>
            </h3>
            <p className="text-[15px] text-[#7EAAC7] italic mb-4.5 font-serif">Dream trip planner & destination intelligence</p>
            <p className="text-base leading-[1.75] text-[#C9DCE6] mb-7 pl-4 border-l-2 border-[#137D97]/50">
              Your personal oracle for dream trip planning. Discover exactly when you should go, what's happening locally, and how to make that one specific bucket-list journey a reality.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {['Travel', 'Data Viz', 'Collaboration'].map(tag => (
                <span key={tag} className="font-mono text-[12px] px-2.5 py-1 rounded-lg bg-[#0C868F]/20 text-[#C9DCE6] border border-[#0C868F]/40 tracking-widest uppercase">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/waves" className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#137D97] text-white rounded-lg text-sm font-bold hover:bg-[#0C868F] transition-all">
                <ChevronRight size={13} /> View App
              </Link>
              <button onClick={() => openModal('prd-3')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-[#C9DCE6] border-2 border-[#257E8C]/50 rounded-[4px] text-sm font-semibold hover:border-[#137D97] hover:text-[#137D97] hover:bg-[#137D97]/10 cursor-pointer transition-all">PRD</button>
              <button onClick={() => openModal('roadmap-3')} className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-transparent text-[#C9DCE6] border-2 border-[#257E8C]/50 rounded-[4px] text-sm font-semibold hover:border-[#137D97] hover:text-[#137D97] hover:bg-[#137D97]/10 cursor-pointer transition-all">Roadmap</button>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="px-12 py-24 bg-slate-900">
        <div className="flex items-center gap-5 mb-13">
          <span className="font-mono text-[13px] text-blue-400 tracking-widest">02</span>
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
              <div className="font-serif text-[52px] font-black text-blue-400/30 leading-none mb-4">{step.num}</div>
              <div className="font-serif text-xl font-bold mb-2.5 text-white">{step.title}</div>
              <p className="text-[15px] leading-[1.75] text-white/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-12 py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl">
          <div className="flex items-center gap-5 mb-8">
            <span className="font-mono text-[13px] text-blue-600 font-bold tracking-widest">03</span>
            <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-none text-slate-900">About</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <p className="text-[17px] leading-[1.85] text-slate-700 mb-4.5">I'm a <strong className="text-slate-900 font-semibold">Senior Data Strategist at Indeed</strong> with a background in frontend engineering and a Stanford product management certificate. I've spent 6+ years at the intersection of data, engineering, and product.</p>
          <p className="text-[17px] leading-[1.85] text-slate-700 mb-4.5">I build things that solve real problems. The portfolio you're reading right now is one of them — I built every project here, wrote every PRD, and defined every roadmap myself.</p>
          <p className="text-[17px] leading-[1.85] text-slate-700 mb-4.5">Based in <strong className="text-slate-900 font-semibold">New Jersey</strong>. Open to PM roles in B2B SaaS and consumer products.</p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            <div>
              <div className="font-mono text-[12px] uppercase tracking-widest text-slate-900 font-bold mb-2">Product</div>
              <div className="text-[15px] leading-[2] text-slate-700">Roadmap Ownership<br />A/B Experimentation<br />User Research<br />0→1 Launches<br />Agile / Scrum</div>
            </div>
            <div>
              <div className="font-mono text-[12px] uppercase tracking-widest text-slate-900 font-bold mb-2">Technical</div>
              <div className="text-[15px] leading-[2] text-slate-700">JavaScript / React<br />SQL & Tableau<br />Data Automation<br />Front-End Arch.<br />Accessibility</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-12 py-9 border-t-3 border-red-700 bg-slate-900 flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[13px] text-slate-500 tracking-wider uppercase">© 2026 Tariq Shaikh · PM Portfolio</div>
          {user?.email === 'TShaikh92@gmail.com' && (
            <Link to="/admin/visitors" className="font-mono text-[10px] text-slate-700 hover:text-blue-600 transition-colors uppercase tracking-widest">Admin: Visitor Insights</Link>
          )}
        </div>
        <div className="flex gap-6">
          <a href="mailto:tshaikh92@gmail.com" className="font-mono text-[13px] text-slate-400 hover:text-red-700 transition-colors tracking-wider">tshaikh92@gmail.com</a>
          <a href="tel:8483914393" className="font-mono text-[13px] text-slate-400 hover:text-red-700 transition-colors tracking-wider">848-391-4393</a>
          <a href="https://linkedin.com" target="_blank" className="font-mono text-[13px] text-slate-400 hover:text-red-700 transition-colors tracking-wider">LinkedIn</a>
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
              className="bg-white text-slate-900 max-w-[1100px] w-full rounded-[3px] overflow-hidden shadow-2xl shadow-slate-900/20"
            >
              {activeModal === 'prd-1' && (
                <>
                  <div className="px-10 py-8 border-b border-slate-200 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
                    <div>
                      <div className="font-mono text-[12px] uppercase tracking-widest text-blue-600 mb-2">Product Requirements Document</div>
                      <div className="text-4xl leading-none">
                        <span className="font-serif font-bold text-slate-900">Homebase</span> <span className="font-sans font-black text-blue-600 ml-1">NJ</span>
                      </div>
                      <div className="flex gap-4 mt-4 text-sm font-mono text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600"></span> Status: Shipped (v1.0)</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q2 2026</span>
                      </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 text-3xl leading-none p-1 hover:text-slate-900 transition-colors">✕</button>
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
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span> Status: In Development</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Target: Q3 2026</span>
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
                        <div className="border border-[#EEEEEF] rounded-lg p-6 bg-[#F7FBFF]">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1E5C38]" />
                            Orbit Expense Engine
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">A dedicated system for logging non-monthly expenses (Annual, Semi-Annual, Quarterly, Monthly, Weekly) with specific month-of-impact tracking.</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            12-Month Cash Flow Visualizer
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">An interactive grid showing projected annual spend, highlighting "Danger Zones" and categorizing irregular hits into a clear visual dashboard.</p>
                        </div>
                        <div className="border border-[#EEEEEF] rounded-lg p-6">
                          <h3 className="font-bold text-[#1A1C1E] mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            Sinking Fund Logic
                          </h3>
                          <p className="text-[15px] text-[#6E8A96]">Automatically calculates the exact monthly amount needed to be set aside to cover all orbiting expenses without stress.</p>
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
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span> Status: In Development</span>
                        <span>|</span>
                        <span>Author: TShaikh92</span>
                        <span>|</span>
                        <span>Updated: Q1 2026</span>
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
                          badge: 'V3 — Wealth', 
                          badgeClass: 'bg-slate-50 text-slate-400 border border-slate-200', 
                          title: 'Surplus Deployment', 
                          time: 'Q3 2026',
                          items: [
                            { t: 'Surplus Ideas', d: 'Actionable strategies for deploying the Annual Surplus into investments.', s: 'Discovery', dot: 'bg-slate-400' },
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
