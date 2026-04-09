"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Network, Cpu, Lock, Activity, Zap, Terminal, Database } from "lucide-react";

const features = [
  {
    title: "Multi-Chain Interception",
    description: "Deploy autonomous trace protocols across EVM, Solana, and Bitcoin networks simultaneously.",
    icon: <Network className="w-5 h-5 text-blue-500" />,
    colSpan: "md:col-span-2",
  },
  {
    title: "Zero-Day Heuristics",
    description: "Identify obfuscated liquidity routing through mixers like Tornado Cash instantly.",
    icon: <Activity className="w-5 h-5 text-cyan-400" />,
    colSpan: "md:col-span-1",
  },
  {
    title: "Jurisdictional Locks",
    description: "Generate legally compliant freezing orders compatible with top-tier centralized exchanges.",
    icon: <Lock className="w-5 h-5 text-blue-500" />,
    colSpan: "md:col-span-1",
  },
  {
    title: "Deep Memory Parsing",
    description: "Extract hidden wallet hashes directly from raw smart contract compilation bytecode.",
    icon: <Database className="w-5 h-5 text-cyan-400" />,
    colSpan: "md:col-span-2",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#030305] border-t border-blue-900/30">
      
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[400px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col items-center mb-16 text-center">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-cyan-900/50 bg-[#0A0A0E] mb-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] font-bold uppercase">
                    System_Proficiencies
                </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Capabilities</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs md:text-sm max-w-xl tracking-widest uppercase">
                Engineered for absolute visibility. Built to dismantle illicit blockchain infrastructure.
            </p>
        </div>

        {/* TACTICAL BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`bg-[#050508] border border-blue-900/40 p-6 md:p-8 relative group overflow-hidden ${feature.colSpan} hover:border-cyan-500/50 transition-colors duration-500`}
                >
                    {/* HUD Targeting Corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors duration-500" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors duration-500" />
                    
                    {/* Hover Scanline Effect */}
                    <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div className="w-12 h-12 bg-blue-950/30 border border-blue-900/50 flex items-center justify-center shadow-[inset_0_0_15px_rgba(37,99,235,0.1)] group-hover:shadow-[inset_0_0_20px_rgba(34,211,238,0.2)] transition-all">
                            {feature.icon}
                        </div>
                        
                        <div>
                            <h3 className="text-white font-black text-lg md:text-xl tracking-widest uppercase mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-500 font-mono text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                    
                    {/* PROPER SVG BACKGROUND GRAPHIC (Bug Free & No Percentages) */}
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-500">
                        <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 100 L 50 100 L 50 50 L 100 50 Z" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 4"/>
                            <path d="M 50 100 L 0 50" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 4"/>
                            <circle cx="50" cy="50" r="3" fill="#22d3ee"/>
                        </svg>
                    </div>

                </motion.div>
            ))}
        </div>

        {/* BOTTOM METRICS */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 border-t border-blue-900/30 pt-8">
            <div className="flex items-center gap-3 px-6 py-2 bg-[#0A0A0E] border border-blue-900/50">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">Compute: Max_Efficiency</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-2 bg-[#0A0A0E] border border-blue-900/50">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">Latency: &lt;12ms</span>
            </div>
        </div>

      </div>
    </section>
  );
}