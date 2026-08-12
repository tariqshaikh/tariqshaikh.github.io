import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Waves, BarChart3, User, Mail, Sparkles } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'PM Prism', href: '/prism', icon: Sparkles },
  { name: 'Homebase NJ', href: '/homebase', icon: MapPin },
  { name: 'Waves Travel Co', href: '/waves', icon: Waves },
  { name: 'Orbit Capital', href: '/orbit', icon: BarChart3 },
  { name: 'About', href: '#about', icon: User },
  { name: 'Contact', href: 'mailto:tshaikh92@gmail.com', icon: Mail },
];

function MagneticIcon({ item, i, hovered, setHovered, onClick }: {
  item: NavItem;
  i: number;
  hovered: number | null;
  setHovered: (i: number | null) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - (left + width / 2)) * 0.4);
    mouseY.set((e.clientY - (top + height / 2)) * 0.4);
    setHovered(i);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(null);
  };

  return (
    <motion.a
      ref={ref}
      href={item.href}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className="relative p-4 rounded-2xl transition-colors group"
    >
      <AnimatePresence>
        {hovered === i && (
          <motion.div
            layoutId="nav-bg"
            className="absolute inset-0 bg-slate-900 border border-slate-700 shadow-xl rounded-2xl z-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex flex-col items-center">
        <item.icon
          size={22}
          className={`transition-colors duration-300 ${hovered === i ? 'text-white' : 'text-slate-500'}`}
        />
        <AnimatePresence>
          {hovered === i && (
            <motion.span
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-mono tracking-widest uppercase rounded-lg border border-slate-700 whitespace-nowrap pointer-events-none shadow-2xl"
            >
              {item.name}
              <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 border-t border-r border-slate-700 rotate-45" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.a>
  );
}

export default function FloatingNav() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed right-5 top-1/2 -translate-y-1/2 z-[100] w-max">
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            className="flex flex-col items-center gap-2 px-3 py-3 bg-white/60 backdrop-blur-2xl border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] ring-1 ring-slate-900/5"
          >
            {navItems.map((item, i) => (
              <MagneticIcon
                key={item.name}
                item={item}
                i={i}
                hovered={hovered}
                setHovered={setHovered}
                onClick={(e) => {
                  if (item.href.startsWith('/')) {
                    e.preventDefault();
                    navigate(item.href);
                  }
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
