import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Each logo: one precise idea, no clipart
const logos = [
  {
    id: 1,
    name: 'Kepler',
    desc: "True ellipse + two focal points. Kepler's first law.",
    svg: (
      <svg viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* mathematically correct ellipse: rx=20, ry=11, c=sqrt(400-121)≈16.7 */}
        <ellipse cx="22" cy="14" rx="20" ry="11" stroke="#C5A059" strokeWidth="1.8"/>
        {/* primary focus — the "sun" mass */}
        <circle cx="5.3" cy="14" r="3" fill="#C5A059"/>
        {/* empty focus — the mathematical ghost point */}
        <circle cx="38.7" cy="14" r="1.5" stroke="#C5A059" strokeWidth="1.5"/>
        {/* faint line connecting foci */}
        <line x1="5.3" y1="14" x2="38.7" y2="14" stroke="#C5A059" strokeWidth="0.6" strokeDasharray="2,3" opacity="0.35"/>
      </svg>
    ),
  },
  {
    id: 2,
    name: 'Escape Velocity',
    desc: '300° orbit that breaks open and shoots away.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 270° arc from bottom going CW, stops at top-right gap */}
        <path d="M 20 33 A 13 13 0 1 1 33 20" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round"/>
        {/* breakaway vector — the escape */}
        <line x1="33" y1="20" x2="39" y2="5" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round"/>
        {/* destination point */}
        <circle cx="39" cy="5" r="2.5" fill="#C5A059"/>
        {/* tiny dot at orbit start for closure */}
        <circle cx="20" cy="33" r="1.5" fill="#C5A059" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 3,
    name: 'Eccentric O',
    desc: 'Ring letterform with offset inner counter — uneven orbital altitude.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="eccMask">
            <rect width="40" height="40" fill="white"/>
            {/* inner circle offset right — thin side right, thick side left */}
            <circle cx="22" cy="20" r="8.5" fill="black"/>
          </mask>
        </defs>
        {/* outer ring fill */}
        <circle cx="20" cy="20" r="13.5" fill="#C5A059" fillOpacity="0.18" mask="url(#eccMask)"/>
        {/* outer stroke */}
        <circle cx="20" cy="20" r="13.5" stroke="#C5A059" strokeWidth="1.8"/>
        {/* inner stroke — slightly offset from outer center */}
        <circle cx="22" cy="20" r="8.5" stroke="#C5A059" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: 4,
    name: 'Apsis',
    desc: 'Periapsis + apoapsis. The two extremes of an orbit, nothing more.',
    svg: (
      <svg viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* the orbit arc connecting two extremes */}
        <path d="M 4 10 A 18 7 0 0 1 40 10" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M 4 10 A 18 7 0 0 0 40 10" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3,3" opacity="0.35"/>
        {/* periapsis — the close point (bigger, brighter — more energy here) */}
        <circle cx="4" cy="10" r="3.5" fill="#C5A059"/>
        {/* apoapsis — the far point (smaller, quieter) */}
        <circle cx="40" cy="10" r="2" stroke="#C5A059" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    id: 5,
    name: 'Gravity Well',
    desc: 'A dot grid warped by a central mass — spacetime curvature.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 5×5 dot grid, spacing warps inward toward center (20,20) */}
        {/* outer ring — far from gravity, even spacing */}
        {[4,12,20,28,36].map(x =>
          [4,12,20,28,36].map(y => {
            const dx = x - 20, dy = y - 20;
            const dist = Math.sqrt(dx*dx+dy*dy);
            // warp: pull each point 30% toward center proportionally
            const warp = dist > 0 ? 0.28 * (1 - dist/30) : 0;
            const wx = x + dx * warp * -1;
            const wy = y + dy * warp * -1;
            const r = dist < 5 ? 2.5 : dist < 15 ? 1.3 : 0.9;
            const op = dist < 5 ? 1 : dist < 15 ? 0.75 : 0.45;
            return (
              <circle key={`${x}-${y}`} cx={wx} cy={wy} r={r}
                fill="#C5A059" fillOpacity={op}/>
            );
          })
        )}
      </svg>
    ),
  },
  {
    id: 6,
    name: 'Orbital Tempo',
    desc: '12 radial ticks — shorter where orbit is fastest (periapsis), longer where slowest.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {Array.from({length: 12}, (_, i) => {
          const angleDeg = i * 30 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          // orbital speed variation: fast at left (9 o'clock = 180°), slow at right
          // use cos to vary: tick length 2–8 based on position
          const speedFactor = (Math.cos(angleRad + Math.PI) + 1) / 2; // 0 to 1
          const innerR = 11;
          const outerR = innerR + 2.5 + speedFactor * 6;
          const ix = 20 + innerR * Math.cos(angleRad);
          const iy = 20 + innerR * Math.sin(angleRad);
          const ox = 20 + outerR * Math.cos(angleRad);
          const oy = 20 + outerR * Math.sin(angleRad);
          const sw = 0.8 + speedFactor * 1.4;
          const op = 0.4 + speedFactor * 0.6;
          return (
            <line key={i} x1={ix} y1={iy} x2={ox} y2={oy}
              stroke="#C5A059" strokeWidth={sw} strokeLinecap="round" opacity={op}/>
          );
        })}
        {/* periapsis marker — where ticks are longest (left) */}
        <circle cx="8" cy="20" r="2" fill="#C5A059"/>
      </svg>
    ),
  },
  {
    id: 7,
    name: 'High Eccentricity',
    desc: 'Teardrop-shaped extreme orbit — a comet path, not a planet.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* highly elongated orbit: the left side curves tightly, right opens wide */}
        <path
          d="M 8 20 C 8 8, 20 5, 32 10 C 38 13, 38 27, 32 30 C 20 35, 8 32, 8 20 Z"
          fill="#C5A059" fillOpacity="0.07"
          stroke="#C5A059" strokeWidth="1.8"
        />
        {/* the focal mass — the "sun" at the tight end */}
        <circle cx="10" cy="20" r="3" fill="#C5A059"/>
        {/* orbit body — small, distant, at the wide end */}
        <circle cx="33" cy="20" r="1.5" stroke="#C5A059" strokeWidth="1.5"/>
        {/* velocity vector at periapsis — showing direction of fast travel */}
        <path d="M 10 17 L 10 11 L 13 13" fill="none" stroke="#C5A059" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 8,
    name: 'Transfer Orbit',
    desc: 'Two concentric orbits bridged by a Hohmann transfer arc.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* inner orbit */}
        <circle cx="20" cy="20" r="7" stroke="#C5A059" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>
        {/* outer orbit */}
        <circle cx="20" cy="20" r="15" stroke="#C5A059" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>
        {/* Hohmann transfer ellipse (half-ellipse connecting the two) */}
        {/* semi-major axis = (7+15)/2 = 11, centered at (20+11, 20) from left touch to right touch */}
        {/* left touch = (20-7, 20) = (13, 20), right touch = (20+15, 20) = (35, 20) */}
        {/* ellipse center = (24, 20), rx=11, ry=8 — only top half */}
        <path d="M 13 20 A 11 8 0 0 1 35 20" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round"/>
        {/* departure burn — dot on inner orbit */}
        <circle cx="13" cy="20" r="2.5" fill="#C5A059"/>
        {/* arrival burn — dot on outer orbit */}
        <circle cx="35" cy="20" r="2.5" stroke="#C5A059" strokeWidth="1.8"/>
        {/* central mass */}
        <circle cx="20" cy="20" r="2" fill="#C5A059" fillOpacity="0.4"/>
      </svg>
    ),
  },
  {
    id: 9,
    name: 'Slingshot',
    desc: 'Hyperbolic flyby — the path that bends but never closes.',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* incoming trajectory — straight line approaching */}
        <line x1="3" y1="5" x2="16" y2="18" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
        {/* hyperbolic curve around the gravity source */}
        <path d="M 16 18 Q 22 22 18 32" fill="none" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round"/>
        {/* outgoing — different angle, slingshot effect */}
        <line x1="18" y1="32" x2="38" y2="38" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
        {/* gravity source — the planet doing the slinging */}
        <circle cx="28" cy="18" r="5.5" fill="#C5A059" fillOpacity="0.1" stroke="#C5A059" strokeWidth="1.8"/>
        <circle cx="28" cy="18" r="2.5" fill="#C5A059"/>
        {/* approach dot */}
        <circle cx="3" cy="5" r="1.8" fill="#C5A059" fillOpacity="0.6"/>
        {/* exit arrow head */}
        <path d="M 34 37 L 38 38 L 37 34" fill="none" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 10,
    name: 'Lagrange',
    desc: 'Five L-points — the equilibrium positions in a two-body system.',
    svg: (
      <svg viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* primary body */}
        <circle cx="16" cy="14" r="5" fill="#C5A059" fillOpacity="0.15" stroke="#C5A059" strokeWidth="1.8"/>
        <circle cx="16" cy="14" r="2.5" fill="#C5A059"/>
        {/* secondary body */}
        <circle cx="34" cy="14" r="3" fill="#C5A059" fillOpacity="0.1" stroke="#C5A059" strokeWidth="1.5"/>
        <circle cx="34" cy="14" r="1.5" fill="#C5A059" fillOpacity="0.6"/>
        {/* connecting line */}
        <line x1="16" y1="14" x2="34" y2="14" stroke="#C5A059" strokeWidth="0.7" strokeDasharray="2,2" opacity="0.3"/>
        {/* L1 — between the two bodies */}
        <circle cx="27" cy="14" r="1.5" fill="none" stroke="#C5A059" strokeWidth="1.5"/>
        {/* L2 — beyond secondary */}
        <circle cx="41" cy="14" r="1.5" fill="none" stroke="#C5A059" strokeWidth="1.5"/>
        {/* L3 — opposite secondary (behind primary) */}
        <circle cx="8" cy="14" r="1.5" fill="none" stroke="#C5A059" strokeWidth="1.5"/>
        {/* L4 — 60° ahead of secondary */}
        <circle cx="25" cy="4.5" r="1.5" fill="none" stroke="#C5A059" strokeWidth="1.5"/>
        {/* L5 — 60° behind secondary */}
        <circle cx="25" cy="23.5" r="1.5" fill="none" stroke="#C5A059" strokeWidth="1.5"/>
        {/* faint equilateral triangle to L4/L5 */}
        <path d="M 16 14 L 25 4.5 L 34 14 L 25 23.5 L 16 14" fill="none" stroke="#C5A059" strokeWidth="0.7" strokeDasharray="2,3" opacity="0.25"/>
      </svg>
    ),
  },
];

export default function OrbitLogos() {
  return (
    <div className="min-h-screen bg-[#07080D] font-sans">
      <header className="border-b border-white/8 bg-[#07080D]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link to="/orbit" className="p-2 hover:bg-white/8 rounded-xl transition-colors group">
            <ChevronLeft size={20} className="text-[#8C8670] group-hover:text-white" />
          </Link>
          <div>
            <h1 className="text-base font-serif font-bold text-white italic leading-none">
              Orbit <span className="font-sans font-black not-italic text-[#C5A059]">Capital</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555] mt-0.5">Logo Concepts — Round 2</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-bold text-white italic mb-2">Orbital Mechanics</h2>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#555] max-w-md">
            Each concept is a real phenomenon from orbital physics. No clipart — pure geometry.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="group bg-[#0D0F15] border border-white/6 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-[#C5A059]/40 hover:bg-[#111318] hover:shadow-[0_0_40px_-8px_rgba(197,160,89,0.15)] transition-all cursor-pointer"
            >
              <div className="w-20 h-16 flex items-center justify-center">
                {logo.svg}
              </div>
              <div className="text-center">
                <div className="font-mono text-[7px] text-[#C5A059]/60 font-black uppercase tracking-[0.2em] mb-1.5">
                  #{logo.id.toString().padStart(2, '0')}
                </div>
                <div className="font-sans font-black text-white text-[11px] uppercase tracking-wider leading-tight mb-1.5">{logo.name}</div>
                <div className="text-[9px] text-[#555] leading-snug">{logo.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 bg-[#0D0F15] rounded-2xl border border-white/5">
          <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C5A059]/60 mb-5">At nav icon size</p>
          <div className="flex flex-wrap gap-3 items-center">
            {logos.map((logo) => (
              <div key={logo.id} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/3 border border-white/8 hover:border-[#C5A059]/50 transition-colors cursor-pointer">
                  {logo.svg}
                </div>
                <span className="text-[7px] font-mono text-[#444]">#{logo.id}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
