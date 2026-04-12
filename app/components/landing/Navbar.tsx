"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, Activity, Terminal } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Professional, high-ticket navigation terminology
  const navLinks = [
    { name: "Proficiencies", href: "#features" },
    { name: "Resolution Record", href: "#testimonials" },
    { name: "Forensic Intelligence", href: "#faq" },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-[100] transition-all duration-700 ${
          isScrolled 
            ? "py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]" 
            : "py-6"
        }`}
      >
        {/* THE DYNAMIC FORENSIC BACKGROUND */}
        <div className="absolute inset-0 transition-all duration-700 overflow-hidden pointer-events-none">
            {/* Base Background: Deep Charcoal to Navy - God Level Palette */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C] via-[#0A0C10] to-[#0D0D10]" />
            
            {/* GOD-LEVEL SCANNER ANIMATION: continuous subtle data sweep */}
            <motion.div 
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ 
                    x: ["-100%", "300%"], 
                    opacity: [0, 1, 1, 0] 
                }}
                transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatDelay: 2
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-blue-400/20 w-full"
            />
            
            {/* Continuous subtle glow/shimmer */}
            <motion.div
                initial={{ opacity: 0.1 }}
                animate={{ 
                    opacity: isScrolled ? [0.1, 0.4, 0.1] : 0.1,
                    transition: { duration: 1.5, repeat: isScrolled ? Infinity : 0 }
                }}
                className="absolute inset-0 bg-blue-500/5 backdrop-blur-3xl"
            />
            
            {/* Bottom Border Glow */}
            <div className={`absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-1000 ${isScrolled ? 'bg-blue-500/40' : 'bg-white/5'}`} />
        </div>

        <div className="max-w-[1440px] mx-auto px-6 relative z-10 flex items-center justify-between">
          
          {/* 1. BRAND & SYSTEM STATUS */}
          <Link 
            href="/" 
            onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="shrink-0 group flex items-center gap-4"
          >
            <div className="relative">
                <img 
                  src="/assets/logo.png" 
                  alt="Chainabuse" 
                  className="h-10 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute -inset-2 bg-blue-600/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
            
            {/* God Level Status Tag - Desktop Only */}
            <div className="hidden lg:flex flex-col border-l border-white/10 pl-6 space-y-0.5">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-bold">Status: OPS_LIVE</span>
                </div>
                <span className="text-[9px] font-mono text-blue-500/60 tracking-[0.3em] uppercase font-bold">Node: ENCRYPTED_LINK</span>
            </div>
          </Link>

          {/* 2. CENTER NAV: High-End Technical Typography (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-12 relative z-10">
             {navLinks.map((item, i) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300 uppercase tracking-[0.3em] relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-blue-500 transition-all duration-500 group-hover:w-full shadow-[0_0_8px_#3b82f6]" />
                </Link>
             ))}
          </nav>

          {/* 3. ACTIONS: "Log In" & "Registration" */}
          <div className="flex items-center gap-6 lg:gap-12 relative z-10">
             <Link 
               href="/login" 
               className="hidden sm:block text-[10px] font-bold text-zinc-400 hover:text-blue-400 transition-colors uppercase tracking-[0.3em]"
             >
               Log In
             </Link>
             
             {/* REGISTER BUTTON: Uses ?mode=register to open correct view */}
             <Link href="/login?mode=register" className="hidden md:flex">
               <motion.button 
                 whileHover={{ scale: 1.05, backgroundColor: "#2563eb", boxShadow: "0 0 40px rgba(37, 99, 235, 0.4)" }}
                 whileTap={{ scale: 0.95 }}
                 className="bg-transparent border border-blue-500/60 text-white px-7 py-2.5 rounded-sm text-[10px] font-bold flex items-center gap-3 transition-all duration-300 uppercase tracking-[0.2em]"
               >
                 Registration <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </motion.button>
             </Link>

             {/* MOBILE MENU TOGGLE */}
             <button 
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2 text-white hover:text-blue-500 active:scale-95 transition-all"
             >
                {isMobileOpen ? <X size={26} /> : <Menu size={26} />}
             </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV: Forensic Command Interface */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)", scale: 1.05 }}
            animate={{ opacity: 1, backdropFilter: "blur(30px)", scale: 1 }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)", scale: 1.05 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-[#050505]/95 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
                <img src="/assets/logo.png" alt="Logo" className="h-7 w-auto" />
                <button onClick={() => setIsMobileOpen(false)} className="text-white bg-white/5 p-3 rounded-sm border border-white/10 active:bg-blue-600 transition-all"><X size={24}/></button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-10 px-12 relative overflow-hidden">
                {/* Mobile Terminal Data Sweep */}
                <motion.div 
                    animate={{ x: ["-100%", "200%"], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent w-full pointer-events-none"
                />
            
              {navLinks.map((item, idx) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="text-3xl font-black text-white hover:text-blue-500 active:scale-95 transition-all uppercase flex flex-col items-start gap-1 group relative z-10"
                >
                  <span className="text-[10px] font-mono text-blue-500 tracking-[0.2em]">NODE: 0{idx + 1}</span>
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="p-8 flex flex-col gap-4 border-t border-white/5 bg-white/[0.02]">
              <Link href="/login" onClick={() => setIsMobileOpen(false)} className="w-full py-4 border border-white/10 text-center text-[11px] font-bold text-white uppercase tracking-[0.3em] active:bg-white/5 transition-all rounded-sm">
                Log In
              </Link>
              {/* MOBILE REGISTER BUTTON: Uses ?mode=register */}
              <Link href="/login?mode=register" onClick={() => setIsMobileOpen(false)} className="w-full py-4 bg-blue-600 text-center text-[11px] font-bold text-white uppercase tracking-[0.3em] active:bg-[#1d4ed8] rounded-sm transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] border border-blue-400/30">
                Registration
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}