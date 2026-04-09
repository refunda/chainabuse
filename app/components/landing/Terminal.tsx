"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Wifi, Cpu, Terminal as TerminalIcon, ShieldAlert, Activity } from "lucide-react";

const logs = [
  { text: "INITIATING THREAT_INTEL NODE v9.4.0...", color: "text-zinc-500" },
  { text: "ESTABLISHING ENCRYPTED LINK: ETH MAINNET", color: "text-blue-400" },
  { text: "BYPASSING OBFUSCATION LAYER [TORNADO_CASH_ROUTER]...", color: "text-blue-500" },
  { text: "SCANNING DISTRIBUTED LEDGER PARAMETERS...", color: "text-zinc-400" },
  { text: "DECRYPTING TARGET WALLET HASH...", color: "text-cyan-400" },
  { text: "MATCH ACQUIRED: SUSPECT_NODE_0x7F2A...", color: "text-white" },
  { text: "CROSS-REFERENCING CEX LIQUIDITY POOLS...", color: "text-zinc-500" },
  { text: "ILLICIT ASSETS ISOLATED [142.5 ETH] - READY FOR FREEZE.", color: "text-cyan-400" },
];

export default function Terminal() {
  const [lines, setLines] = useState<number>(0);
  const [isResetting, setIsResetting] = useState(false);
  const terminalRef = useRef(null);
  
  // Changed to 'once: false' so it knows when it's in view
  const isInView = useInView(terminalRef, { margin: "-100px" });

  useEffect(() => {
    if (!isInView || isResetting) return;

    if (lines < logs.length) {
      // Type out the lines
      const timeout = setTimeout(() => {
        setLines((prev) => prev + 1);
      }, 350); 
      return () => clearTimeout(timeout);
    } else {
      // Sequence finished. Wait 5 seconds, then reset and loop.
      const resetTimeout = setTimeout(() => {
        setIsResetting(true); // Triggers the wipe
        setTimeout(() => {
            setLines(0); // Reset lines
            setIsResetting(false); // Start typing again
        }, 500); // Quick half-second wipe
      }, 5000); // Time to hold on the success message
      return () => clearTimeout(resetTimeout);
    }
  }, [lines, isInView, isResetting]);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-[#030305] border-t border-blue-900/30">
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#030305] to-[#0A0A0E] z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] md:w-[70vw] h-[400px] md:h-[500px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      <div className="flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-[1200px] mx-auto">
        
        <div className="text-center mb-10 w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 px-3 py-1.5 border border-blue-900/50 bg-[#0A0A0E] w-fit">
                <TerminalIcon className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] md:text-[11px] font-mono text-cyan-400 uppercase tracking-[0.4em] font-bold">
                    Live_Network_Feed
                </span>
            </div>
        </div>

        <motion.div 
          ref={terminalRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full bg-[#050508] border border-blue-900/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col relative group"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/50 group-hover:border-cyan-400 transition-colors z-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/50 group-hover:border-cyan-400 transition-colors z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/50 group-hover:border-cyan-400 transition-colors z-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/50 group-hover:border-cyan-400 transition-colors z-20 pointer-events-none" />

          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-[#0A0A0E] border-b border-blue-900/50 shrink-0 z-10 relative">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-blue-400 uppercase hidden sm:block">Command Interface</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase sm:hidden">CMD_INT</span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 text-[9px] md:text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">
              <div className="flex items-center gap-1.5">
                 <Cpu className="w-3 h-3 text-cyan-400" />
                 <span>MEM: 84%</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <Wifi className="w-3 h-3" />
                <span>UPLINK <span className="hidden sm:inline">:: SECURE</span></span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 font-mono text-[10px] sm:text-xs md:text-sm h-[350px] md:h-[450px] bg-[#030305] flex-1 overflow-hidden relative z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

            <div className="space-y-3 md:space-y-4 w-full relative z-10">
              <AnimatePresence>
                  {!isResetting && logs.slice(0, lines + 1).map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }} // Fast exit when resetting
                      transition={{ duration: 0.2 }}
                      className="flex items-start md:items-center gap-3 md:gap-4 w-full"
                    >
                      <span className="text-blue-500 select-none shrink-0 mt-0.5 md:mt-0 font-bold">{">"}</span>
                      <span className={`${log.color} font-bold tracking-widest break-words w-full pr-2 uppercase`}>
                          {log.text}
                      </span>
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {!isResetting && lines < logs.length && (
                <div className="w-2.5 md:w-3 h-4 md:h-5 bg-cyan-400 ml-6 inline-block align-middle shadow-[0_0_10px_#22d3ee] animate-pulse" />
              )}

              {!isResetting && lines >= logs.length && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-blue-900/50"
                 >
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold tracking-[0.3em] uppercase text-[9px] md:text-[10px]">
                      <Activity className="w-3 h-3 animate-pulse" /> [ ASSET FROZEN :: AWAITING COMMAND ]
                   </div>
                 </motion.div>
              )}
            </div>
          </div>
          
          {/* Progress Bar that resets properly */}
          <div className="h-1 bg-black w-full shrink-0 z-20 border-t border-blue-900/50">
            <motion.div 
              className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
              animate={{ 
                  width: isResetting ? "0%" : `${Math.min(100, (lines / (logs.length - 1)) * 100)}%` 
              }}
              transition={{ 
                  duration: isResetting ? 0 : 0.35, // Instant reset, smooth fill
                  ease: "linear" 
              }}
            />
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}