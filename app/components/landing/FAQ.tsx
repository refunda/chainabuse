"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronRight, Database, ShieldAlert, Cpu } from "lucide-react";

// --- INTELLIGENCE DATABASE ---
const faqs = [
  { 
    id: "QRY_01",
    question: "IS THIS PROCESS LEGAL?", 
    answer: "AFFIRMATIVE. Chainabuse operates strictly within international forensic frameworks. We generate cryptographically signed legal reports utilized by global tax authorities, Interpol, and federal law enforcement." 
  },
  { 
    id: "QRY_02",
    question: "CAN YOU RECOVER FROM A PRIVATE WALLET?", 
    answer: "NEGATIVE ON DIRECT EXPLOIT. We cannot 'hack' a private seed phrase. However, we deploy algorithmic tracers to track outbound liquidity. When funds interact with a centralized exchange (CEX) or regulated off-ramp, we execute a jurisdictional freeze." 
  },
  { 
    id: "QRY_03",
    question: "WHAT IS THE TIMELINE FOR A FORENSIC SCAN?", 
    answer: "Initial Level-1 mempool scans complete in 60 seconds. Deep-layer forensic audits (Level-3), which track mixer hops and cross-chain bridge fragmentation, require 24-48 hours of computational runtime." 
  },
  { 
    id: "QRY_04",
    question: "DO YOU REQUIRE PRIVATE KEYS?", 
    answer: "NEVER. Chainabuse will NEVER request seed phrases or private keys. Any entity requesting this data is hostile. Our tracking protocols operate entirely on public ledger data and node RPCs." 
  },
  { 
    id: "QRY_05",
    question: "SUPPORTED BLOCKCHAIN ARCHITECTURES?", 
    answer: "Full trace capabilities deployed on Bitcoin, Ethereum, Solana, Binance Smart Chain (BSC), Polygon, Avalanche, and 40+ additional EVM and non-EVM networks." 
  },
];

export default function ThreatIntel() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-24 md:py-32 relative overflow-hidden bg-[#030305] border-t border-blue-900/30">
      
      {/* --- TACTICAL BACKGROUND ENGINE --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Deep Space Gradient */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#0A0A0E] to-[#030305]" />
         
         {/* Cyber Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
         
         {/* Terminal Ambient Glow */}
         <div className="absolute top-0 right-0 w-[60vw] h-[50vh] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* --- HEADER: INTELLIGENCE DATABASE --- */}
        <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-blue-900/40 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-cyan-400" />
                    <span className="text-[10px] md:text-[11px] font-mono text-cyan-400 uppercase tracking-[0.4em] font-bold">04 // Knowledge Base</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                    Threat <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Intelligence</span>
                </h2>
                <p className="text-zinc-500 font-mono text-[11px] md:text-xs tracking-widest uppercase">
                    Declassified parameters regarding recovery architecture.
                </p>
            </div>
            
            {/* Terminal Status Readout */}
            <div className="hidden md:flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0A0C] border border-blue-900/50">
                    <Database size={12} className="text-cyan-400" />
                    <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">CONNECTION: SECURE</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-blue-500/50 font-mono tracking-[0.3em] uppercase">
                    <ShieldAlert size={10} /> ENCRYPTED_QUERY_PORTAL
                </div>
            </div>
        </div>

        {/* --- EXECUTABLE QUERY LIST (Replaces Accordion) --- */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className={`relative border bg-[#050508] transition-all duration-300 group ${
                    isOpen 
                      ? 'border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.05)]' 
                      : 'border-blue-900/30 hover:border-blue-500/50'
                  }`}
              >
                {/* HUD Corner Brackets on Hover/Active */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors ${isOpen ? 'border-cyan-400' : 'border-transparent group-hover:border-blue-500/50'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors ${isOpen ? 'border-cyan-400' : 'border-transparent group-hover:border-blue-500/50'}`} />

                {/* THE COMMAND TRIGGER */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none relative z-10"
                >
                  <div className="flex items-center gap-4">
                      {/* Terminal Prompt Prefix */}
                      <div className="flex items-center gap-2 shrink-0">
                          <Terminal size={14} className={isOpen ? "text-cyan-400" : "text-blue-500"} />
                          <span className={`text-[10px] font-mono tracking-widest hidden sm:block ${isOpen ? "text-cyan-400" : "text-blue-500/50"}`}>
                              {faq.id}
                          </span>
                      </div>
                      
                      {/* The Question / Query */}
                      <span className={`font-black text-xs md:text-sm tracking-[0.1em] transition-colors ${isOpen ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                        <span className="text-blue-500 mr-2">&gt;</span> {faq.question}
                      </span>
                  </div>

                  {/* Execution Status */}
                  <div className="shrink-0 flex items-center gap-3">
                      <span className={`text-[9px] font-mono tracking-widest hidden md:block ${isOpen ? "text-cyan-400" : "text-zinc-600"}`}>
                          {isOpen ? "[ DECRYPTED ]" : "[ ENCRYPTED ]"}
                      </span>
                      <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronRight className={`w-4 h-4 md:w-5 md:h-5 ${isOpen ? "text-cyan-400" : "text-blue-500/50"}`} />
                      </motion.div>
                  </div>
                </button>
                
                {/* THE DECRYPTED RESPONSE */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden bg-[#0A0A0E] border-t border-blue-900/30 relative"
                    >
                      {/* Inner Matrix Grid */}
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                      
                      <div className="p-6 md:p-8 relative z-10">
                        <div className="flex items-start gap-4">
                            {/* Execution Path Visual */}
                            <div className="hidden md:flex flex-col items-center gap-1 shrink-0 pt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-400/50 to-transparent" />
                            </div>

                            <div className="w-full">
                                {/* System Response Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Cpu size={12} className="text-cyan-400" />
                                    <span className="text-[9px] font-mono text-cyan-400 tracking-[0.3em] uppercase">Sys_Response:</span>
                                </div>
                                
                                {/* Actual Answer text */}
                                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-mono tracking-wide">
                                    {faq.answer}
                                </p>
                                
                                {/* Blinking Terminal Cursor */}
                                <div className="w-2.5 h-4 bg-cyan-400 animate-pulse mt-4" />
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}