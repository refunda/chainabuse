"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Globe, Lock, Server, Cpu, Activity, ArrowRight, Zap, Network } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// I. CONFIGURATION: PROTOCOL MODULES
// ═══════════════════════════════════════════════════════════════════════════════

const MODULES = [
  {
    id: "MOD_01",
    title: "BRIDGE SURVEILLANCE",
    subtitle: "Cross-Chain Ingestion",
    description: "Autonomous monitoring of Level 1 mempools, Layer 2 rollups, and primary decentralized mixing routers (e.g., Tornado Cash).",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500",
  },
  {
    id: "MOD_02",
    title: "DEEP-LEDGER SCAN",
    subtitle: "Algorithmic Trace",
    description: "Deployment of heuristic algorithms to unmask obfuscated liquidity paths and identify true destination wallets.",
    icon: Database,
    color: "text-cyan-400",
    bg: "bg-cyan-400",
  },
  {
    id: "MOD_03",
    title: "CEX INTERCEPT",
    subtitle: "Compliance Handshake",
    description: "Automated API integration with Tier-1 exchanges to execute jurisdictional freezing orders before asset liquidation.",
    icon: Server,
    color: "text-blue-500",
    bg: "bg-blue-500",
  },
  {
    id: "MOD_04",
    title: "DATA ENCRYPTION",
    subtitle: "AES-256 Air-Gap",
    description: "Military-grade isolation of recovered digital assets in cold-storage vaults awaiting client deployment.",
    icon: Lock,
    color: "text-cyan-400",
    bg: "bg-cyan-400",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// II. INTERACTIVE SUB-VIEWS (The Right Panel Dashboards)
// ═══════════════════════════════════════════════════════════════════════════════

// View 1: Bridge Surveillance (Data flying between nodes)
const BridgeView = () => (
  <div className="w-full h-full flex items-center justify-center relative">
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.1)_0%,transparent_70%)]" />
     <div className="flex items-center justify-between w-full max-w-sm relative z-10">
        <div className="w-16 h-16 rounded-full border-2 border-blue-500/50 flex items-center justify-center bg-[#0A0A0E] shadow-[0_0_20px_rgba(37,99,235,0.3)]">
           <span className="font-black text-blue-500 text-xs tracking-widest">ETH</span>
        </div>
        
        {/* The Bridge / Data stream */}
        <div className="flex-1 h-px bg-blue-900/50 relative overflow-hidden mx-4">
           <motion.div animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-12 h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
           <motion.div animate={{ x: ["-100%", "300%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }} className="absolute top-1/2 -translate-y-1/2 w-8 h-0.5 bg-blue-400 shadow-[0_0_10px_#3b82f6]" />
        </div>

        <div className="w-16 h-16 rounded-full border-2 border-cyan-400/50 flex items-center justify-center bg-[#0A0A0E] shadow-[0_0_20px_rgba(34,211,238,0.2)]">
           <span className="font-black text-cyan-400 text-xs tracking-widest">SOL</span>
        </div>
     </div>
     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-[0.3em] text-zinc-500 uppercase">Scanning Cross-Chain Routers...</div>
  </div>
);

// View 2: Deep Ledger Trace (Tree graph of wallets)
const LedgerView = () => (
  <div className="w-full h-full flex flex-col items-center justify-center relative">
     <Network className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-cyan-900/10" />
     <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-[10px] text-red-500 font-mono tracking-widest">0x7F2A... [SUSPECT]</div>
        <div className="w-px h-6 bg-cyan-900/50 relative">
           <motion.div animate={{ height: ["0%", "100%"] }} transition={{ duration: 1, repeat: Infinity }} className="absolute top-0 left-0 w-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        </div>
        <div className="flex items-center gap-12 border-t border-cyan-900/50 pt-6 relative w-64 justify-between">
           {/* Connection lines to the sides */}
           <div className="absolute top-0 left-0 w-0.5 h-6 bg-cyan-900/50" />
           <div className="absolute top-0 right-0 w-0.5 h-6 bg-cyan-900/50" />
           
           <div className="px-3 py-1.5 bg-[#0A0A0E] border border-blue-900/50 text-[9px] text-zinc-400 font-mono">0x11B...</div>
           <div className="px-3 py-1.5 bg-[#0A0A0E] border border-cyan-500/50 text-[9px] text-cyan-400 font-mono shadow-[0_0_15px_rgba(34,211,238,0.2)]">0x99C... [TARGET]</div>
        </div>
     </div>
  </div>
);

// View 3: CEX Intercept (Live API Terminal)
const InterceptView = () => (
  <div className="w-full h-full bg-black/50 p-6 font-mono text-[10px] leading-relaxed relative flex flex-col justify-center">
     <div className="text-zinc-500 mb-2">// EXECUTING JURISDICTIONAL FREEZE</div>
     <div className="text-blue-400 mb-1"><span className="text-cyan-400">POST</span> /api/v3/compliance/freeze</div>
     <div className="text-zinc-400 pl-4 mb-4 border-l border-blue-900/50">
        <span className="text-blue-300">"target_wallet"</span>: "0x99C8A1...",<br/>
        <span className="text-blue-300">"auth_token"</span>: "Bearer xk9...",<br/>
        <span className="text-blue-300">"network"</span>: "ETH_MAINNET"
     </div>
     <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="text-cyan-400 flex items-center gap-2"
     >
        <Zap className="w-3 h-3" /> [200 OK] ASSETS_FROZEN
     </motion.div>
  </div>
);

// View 4: Encryption (Scrambling Hash)
const EncryptionView = () => {
  const [hash, setHash] = useState("");
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHash(Array.from({ length: 32 }).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
       <Lock className="w-16 h-16 text-blue-500/20 absolute" />
       <div className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase mb-4 relative z-10 flex items-center gap-2">
          <Activity className="w-3 h-3 animate-pulse" /> Generating Air-Gap Seed
       </div>
       <div className="w-full max-w-sm break-all text-center text-xs md:text-sm font-mono text-white font-bold bg-[#0A0A0E] border border-blue-500/30 p-4 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
          {hash}
       </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// III. MAIN COMMAND ENGINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProtocolMap() {
  const [activeNode, setActiveNode] = useState(0);

  // Auto-cycle through the nodes if the user doesn't click
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % MODULES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full py-24 md:py-32 bg-[#030305] overflow-hidden flex flex-col items-center px-4 md:px-8 border-t border-blue-900/30">
      
      {/* TACTICAL LIGHTING & GRID */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#030305] to-[#0A0A0E] z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[500px] bg-blue-900/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* HEADER */}
      <div className="relative z-10 text-center mb-16 mt-4 w-full flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-blue-900/50 bg-[#0A0A0E] text-cyan-400 text-[10px] font-mono mb-6 uppercase tracking-[0.3em] font-bold shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <Cpu className="w-3 h-3 text-cyan-400" /> SYSTEM_ARCHITECTURE v9.4
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-4">
          Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Topology</span>
        </h2>
        <p className="text-zinc-500 font-mono text-[10px] md:text-xs tracking-widest uppercase max-w-xl mx-auto">
          A modular, four-phase threat resolution pipeline engineered for flawless execution.
        </p>
      </div>

      {/* THE ARCHITECTURE DASHBOARD */}
      <div className="relative z-10 w-full max-w-[1200px] bg-[#050508] border border-blue-900/40 flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">
         
         {/* LEFT PANEL: NAVIGATION MENU */}
         <div className="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-blue-900/40 bg-[#0A0A0E] flex flex-col relative">
            <div className="px-6 py-4 border-b border-blue-900/40 flex items-center justify-between bg-black/40">
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Select Module</span>
                <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-mono tracking-widest">
                   <Activity className="w-3 h-3 animate-pulse" /> ACTIVE
                </div>
            </div>

            <div className="flex-1 flex flex-col">
               {MODULES.map((mod, i) => {
                  const isActive = activeNode === i;
                  return (
                    <button 
                       key={mod.id}
                       onClick={() => setActiveNode(i)}
                       className={`flex-1 flex items-center p-6 border-b border-blue-900/20 transition-all duration-300 text-left relative overflow-hidden group ${isActive ? "bg-blue-900/10" : "hover:bg-white/[0.02]"}`}
                    >
                       {/* Active Indicator Line */}
                       {isActive && (
                          <motion.div layoutId="activeLine" className={`absolute left-0 top-0 bottom-0 w-1 ${mod.bg} shadow-[0_0_15px_currentColor]`} />
                       )}
                       
                       <div className="flex items-start gap-4 relative z-10 w-full">
                          <div className={`p-2 border transition-colors duration-300 ${isActive ? `border-cyan-500/50 bg-[#050508] ${mod.color} shadow-[0_0_15px_rgba(34,211,238,0.2)]` : "border-blue-900/30 text-zinc-600 bg-black/20 group-hover:border-blue-500/30 group-hover:text-blue-500"}`}>
                             <mod.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                             <div className={`text-[10px] font-mono tracking-widest uppercase mb-1 transition-colors ${isActive ? "text-cyan-400" : "text-zinc-500"}`}>
                                {mod.id} // {mod.subtitle}
                             </div>
                             <div className={`text-sm md:text-base font-black tracking-widest uppercase transition-colors ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                                {mod.title}
                             </div>
                          </div>
                       </div>
                    </button>
                  );
               })}
            </div>
         </div>

         {/* RIGHT PANEL: LIVE TELEMETRY VIEW */}
         <div className="flex-1 h-[400px] lg:h-auto bg-[#030305] relative overflow-hidden flex flex-col">
            
            {/* View Header */}
            <div className="px-6 py-4 border-b border-blue-900/40 flex items-center justify-between bg-black/40 relative z-20">
                <div className="flex items-center gap-3">
                   <Server className="w-4 h-4 text-blue-500" />
                   <span className="text-[10px] text-white font-mono tracking-widest uppercase">Module_Telemetry_Feed</span>
                </div>
            </div>

            {/* View Content Area */}
            <div className="flex-1 relative p-6 md:p-10 flex flex-col">
               
               {/* Description Box */}
               <AnimatePresence mode="wait">
                  <motion.div 
                     key={activeNode}
                     initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                     className="mb-8"
                  >
                     <p className="text-xs md:text-sm text-zinc-400 font-mono leading-relaxed uppercase tracking-widest border-l-2 border-blue-500/50 pl-4">
                        {MODULES[activeNode].description}
                     </p>
                  </motion.div>
               </AnimatePresence>

               {/* Dynamic Interactive Stage */}
               <div className="flex-1 border border-blue-900/40 bg-[#050508] relative overflow-hidden">
                  {/* Grid overlay inside the view */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  
                  <AnimatePresence mode="wait">
                     <motion.div 
                        key={activeNode}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                     >
                        {activeNode === 0 && <BridgeView />}
                        {activeNode === 1 && <LedgerView />}
                        {activeNode === 2 && <InterceptView />}
                        {activeNode === 3 && <EncryptionView />}
                     </motion.div>
                  </AnimatePresence>
               </div>

            </div>
         </div>

      </div>

    </section>
  );
}