"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Globe, Cpu, Database, Activity, ChevronRight, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pt-0 pb-8 bg-[#010103] text-sm relative overflow-hidden border-t border-blue-900/50">
      
      {/* --- TACTICAL LIGHTING & ATMOSPHERE --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] to-[#010102] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      
      {/* Spotlight directly behind the logo to make it pop */}
      <div className="absolute top-0 left-[10%] w-[400px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      {/* Deep floor glow */}
      <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* --- SECURE TRANSMISSION TICKER --- */}
      <div className="w-full border-b border-blue-900/40 bg-[#050508] relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center justify-between text-[9px] font-mono tracking-[0.4em] uppercase text-cyan-500/60">
            <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-cyan-500" /> SECURE CHANNEL
            </div>
            <div className="hidden md:flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
                WARNING: THIS IS A CLASSIFIED TRANSMISSION. UNAUTHORIZED ACCESS WILL BE LOGGED.
            </div>
            <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-cyan-500" /> GLOBAL JURISDICTION
            </div>
        </div>
      </div>

      {/* --- MAIN TERMINAL GRID --- */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 relative z-10 pt-16 pb-12">
        
        {/* COLUMN 1: BRANDING & BREATHING LOGO */}
        <div className="md:col-span-4 flex flex-col justify-start pr-0 md:pr-10">
          
          {/* THE BREATHING LOGO */}
          <motion.div 
            animate={{ 
              filter: [
                "drop-shadow(0px 0px 10px rgba(34,211,238,0.1))", 
                "drop-shadow(0px 0px 25px rgba(34,211,238,0.5))", 
                "drop-shadow(0px 0px 10px rgba(34,211,238,0.1))"
              ],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 inline-block origin-left cursor-pointer select-none"
          >
            <img 
              src="/assets/logo.png" 
              alt="Chainabuse Intelligence" 
              className="h-14 md:h-16 w-auto object-contain relative z-10" 
            />
          </motion.div>

          <p className="text-zinc-500 text-[11px] md:text-xs leading-relaxed max-w-sm font-mono tracking-widest border-l-2 border-blue-900/50 pl-4">
            The global intelligence standard for decentralized asset recovery, on-chain forensics, and illicit liquidity interception.
          </p>
        </div>

        {/* COLUMN 2: SYSTEMS DIRECTORY */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-blue-900/50 pb-3 w-full">
              <Database className="w-4 h-4 text-cyan-400" />
              <h4 className="text-white font-black tracking-[0.2em] text-[11px] font-mono uppercase">01 // Systems</h4>
          </div>
          <ul className="space-y-3 text-zinc-500 text-[10px] font-mono tracking-widest uppercase">
            {[
              { label: "Proficiencies", link: "/#features" },
              { label: "Case Files", link: "/#testimonials" },
              { label: "Threat Intel", link: "/#faq" }
            ].map((item, i) => (
              <li key={i}>
                  <Link href={item.link} className="hover:text-cyan-400 transition-colors flex items-center gap-2 group w-fit">
                      <ChevronRight className="w-3 h-3 text-blue-900 group-hover:text-cyan-400 transition-colors" /> 
                      {item.label}
                  </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 3: PROTOCOLS DIRECTORY */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2 mb-6 border-b border-blue-900/50 pb-3 w-full">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h4 className="text-white font-black tracking-[0.2em] text-[11px] font-mono uppercase">02 // Protocols</h4>
          </div>
          <ul className="space-y-3 text-zinc-500 text-[10px] font-mono tracking-widest uppercase">
            {[
              { label: "Jurisdictional Framework", link: "/legal/compliance" },
              { label: "Data Vault Privacy", link: "/legal/privacy" },
              { label: "Terms of Engagement", link: "/legal/terms" }
            ].map((item, i) => (
              <li key={i}>
                  <Link href={item.link} className="hover:text-cyan-400 transition-colors flex items-center gap-2 group w-fit">
                      <ChevronRight className="w-3 h-3 text-blue-900 group-hover:text-cyan-400 transition-colors" /> 
                      {item.label}
                  </Link>
              </li>
            ))}
            <li className="pt-3 mt-3 border-t border-blue-900/30">
              <Link href="/legal/compliance" className="flex items-center gap-2 text-blue-400 hover:text-cyan-300 transition-colors w-fit font-bold group">
                 <Zap className="w-3 h-3 text-cyan-400 group-hover:animate-pulse" /> AML/KYC ENFORCEMENT
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMN 4: HARDWARE AUDIT HUD */}
        <div className="md:col-span-3 flex md:justify-end items-start mt-4 md:mt-0">
            <div className="bg-[#050508] border border-blue-900/50 p-6 flex flex-col items-center justify-center text-center w-full max-w-[280px] relative group hover:border-cyan-500/50 hover:bg-[#0A0A0E] transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {/* Tactical HUD Corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/50 transition-colors group-hover:border-cyan-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/50 transition-colors group-hover:border-cyan-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/50 transition-colors group-hover:border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/50 transition-colors group-hover:border-cyan-400" />

                <Cpu className="w-10 h-10 text-blue-500/30 mb-4 group-hover:text-cyan-400 transition-colors duration-500 drop-shadow-[0_0_10px_rgba(34,211,238,0)] group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                
                <h5 className="text-white font-black text-xs md:text-[13px] mb-2 tracking-[0.2em] uppercase">Architecture Audited</h5>
                
                <div className="flex items-center gap-2 mb-5">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   <p className="text-zinc-500 text-[9px] font-mono tracking-widest uppercase">ISO 27001 Compliant</p>
                </div>

                <div className="flex items-center gap-2 px-5 py-2 bg-cyan-500/5 border border-cyan-500/20 text-[9px] text-cyan-400 font-mono tracking-widest uppercase w-full justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/40 transition-colors shadow-[inset_0_0_15px_rgba(34,211,238,0.05)]">
                    <Activity className="w-3.5 h-3.5 shrink-0 animate-pulse" /> NETWORK SECURE
                </div>
            </div>
        </div>

      </div>

      {/* --- BOTTOM SYSTEM STATUS BAR --- */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 border-t border-blue-900/30 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] md:text-[10px] text-zinc-600 font-mono relative z-10 text-center md:text-left tracking-[0.2em] uppercase bg-[#010103]">
        <p>© 2026 CHAINABUSE INTELLIGENCE FIRM. ALL ASSETS SECURED.</p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] shrink-0 animate-pulse"/> 
                NODE_ACTIVE
            </span>
            <span className="text-blue-900/40">|</span>
            <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-blue-500" /> AES-256
            </span>
            <span className="text-blue-900/40 hidden sm:block">|</span>
            <span className="hidden sm:block">REGION: GLOBAL_DISTRIBUTED</span>
        </div>
      </div>

    </footer>
  );
}