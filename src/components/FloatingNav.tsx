import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Home, Briefcase, Wrench, User, Mail } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '#', icon: Home },
  { name: 'Work', href: '#projects', icon: Briefcase },
  { name: 'Process', href: '#process', icon: Wrench },
  { name: 'About', href: '#about', icon: User },
  { name: 'Contact', href: 'mailto:tshaikh92@gmail.com', icon: Mail },
];

interface MagneticIconProps {
  key?: React.Key;
  item: NavItem;
  i: number;
  hovered: number | null;
  setHovered: (i: number | null) => void;
}

function MagneticIcon({ item, i, hovered, setHovered }: MagneticIconProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull distance
    const pull = 0.4;
    mouseX.set(distanceX * pull);
    mouseY.set(distanceY * pull);
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
              className="absolute -top-12 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-mono tracking-widest uppercase rounded-lg border border-slate-700 whitespace-nowrap pointer-events-none shadow-2xl"
            >
              {item.name}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.a>
  );
}

export default function FloatingNav() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-max">
      <motion.div 
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="flex items-center gap-2 px-3 py-3 bg-white/60 backdrop-blur-2xl border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] ring-1 ring-slate-900/5"
      >
        {navItems.map((item, i) => (
          <MagneticIcon 
            key={item.name} 
            item={item} 
            i={i} 
            hovered={hovered} 
            setHovered={setHovered} 
          />
        ))}
      </motion.div>
    </div>
  );
}
