"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { Terminal, ShieldCheck, Lock, Activity, Cpu, Crosshair, Database, Zap } from "lucide-react";

// --- Matrix Scramble Text Effect ---
const ScrambleText = ({ text, isActive }: { text: string, isActive: boolean }) => {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  
  useEffect(() => {
    if (!isActive) return;
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((letter, index) => {
        if(index < iterations) return letter;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if(iterations >= text.length) clearInterval(interval);
      iterations += 1 / 3; // Speed of scramble
    }, 30);
    return () => clearInterval(interval);
  }, [text, isActive]);

  return <span>{display}</span>;
};

export default function ForensicTerminal() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [typedHash, setTypedHash] = useState("");
  const [progress, setProgress] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const targetWallet = "0x7F2A9B81002C4E9F...88A1";

  // Hardware-accelerated money counter
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    latest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  // THE AUTOMATIC ENGINE LOOP
  useEffect(() => {
    if (!isInView) return;

    // STEP 0: Booting up
    if (step === 0) {
      setProgress(0);
      setTypedHash("");
      count.set(0);
      const t = setTimeout(() => setStep(1), 1500);
      return () => clearTimeout(t);
    }

    // STEP 1: Auto-typing the hash
    if (step === 1) {
      let i = 0;
      const t = setInterval(() => {
        setTypedHash(targetWallet.substring(0, i));
        i++;
        if (i > targetWallet.length) {
          clearInterval(t);
          // Simulate a button click highlight
          setIsClicking(true);
          setTimeout(() => {
            setIsClicking(false);
            setStep(2);
          }, 600);
        }
      }, 50); // Typing speed
      return () => clearInterval(t);
    }

    // STEP 2: Tracing Progress Bar (Stuttering effect)
    if (step === 2) {
      let current = 0;
      const interval = setInterval(() => {
        // Random stuttering jumps to simulate decryption
        current += Math.random() * 25;
        if (current >= 100) {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => setStep(3), 400); 
        } else {
          setProgress(current);
        }
      }, 250);
      return () => clearInterval(interval);
    }
    
    // STEP 3: Extraction & Reset Loop
    if (step === 3) {
      // Snappy, aggressive counter animation
      animate(count, 284590.50, { type: "spring", stiffness: 50, damping: 15 });
      
      // Wait 6 seconds, then restart the entire loop automatically
      const t = setTimeout(() => setStep(0), 8000);
      return () => clearTimeout(t);
    }
  }, [step, count, isInView]);

  return (
    <div ref={containerRef} className="w-full bg-[#050508] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col md:flex-row group">
      
      {/* Animated Scanning Laser Border */}
      <motion.div 
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }} 
        transition={{ duration: 4, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 z-0 opacity-50 p-[1px] bg-[linear-gradient(90deg,#050508_0%,rgba(34,211,238,0.5)_50%,#050508_100%)] bg-[length:200%_100%]"
      >
         <div className="w-full h-full bg-[#050508]" />
      </motion.div>

      {/* HUD Corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors pointer-events-none z-20" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/30 group-hover:border-cyan-400 transition-colors pointer-events-none z-20" />

      {/* --- LEFT PANEL: STATUS & METRICS --- */}
      <div className="w-full md:w-[280px] bg-[#0A0A0E]/80 backdrop-blur-md border-r border-blue-900/30 p-6 flex flex-col justify-between shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-8 border-b border-blue-900/30 pb-4">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px] md:text-xs font-mono font-bold text-cyan-400 tracking-[0.3em] uppercase">
                 Engine_Core
              </span>
            </div>

            {/* Sequence Steps */}
            <div className="space-y-6">
               {[
                 { id: 0, label: "SYS_HANDSHAKE" },
                 { id: 1, label: "AWAIT_TARGET" },
                 { id: 2, label: "EXECUTE_TRACE" },
                 { id: 3, label: "ASSET_SEIZURE" }
               ].map((s) => (
                 <div key={s.id} className="flex items-center gap-4">
                    <div className={`w-2 h-2 rotate-45 transition-all duration-500 ${
                      step > s.id ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : 
                      step === s.id ? "bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6] scale-125" : "border border-zinc-800"
                    }`} />
                    <span className={`text-[9px] font-mono tracking-widest uppercase transition-colors ${
                      step >= s.id ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-zinc-600"
                    }`}>
                       {s.label}
                    </span>
                 </div>
               ))}
            </div>
          </div>

          <div className="mt-12">
             <div className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase mb-2">Network Uplink</div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/10 border border-blue-900/30 w-fit group-hover:border-cyan-500/30 transition-colors">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono text-cyan-400 tracking-[0.2em]">SECURE / AES-256</span>
             </div>
          </div>
      </div>

      {/* --- RIGHT PANEL: AUTOMATIC STAGE --- */}
      <div className="flex-1 p-6 md:p-10 relative overflow-hidden min-h-[350px] flex items-center justify-center z-10">
         
         <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
         
         {/* Background ambient glow matching the active step */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] rounded-full transition-colors duration-1000 pointer-events-none ${step === 3 ? "bg-cyan-500/20" : step === 2 ? "bg-blue-500/10" : "bg-transparent"}`} />

         <AnimatePresence mode="wait">
            
            {/* STAGE 0: INITIALIZING */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }} className="flex flex-col items-center relative z-10">
                 <Cpu className="w-12 h-12 text-blue-500/50 mb-4 animate-[spin_3s_linear_infinite]" />
                 <div className="text-xs font-mono text-blue-400 tracking-[0.3em] uppercase mb-6 animate-pulse">Booting Threat Protocols...</div>
                 <div className="px-6 py-2 bg-blue-900/20 border border-blue-500/30 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Lock className="w-3 h-3" /> <ScrambleText text="INITIALIZING" isActive={true} />
                 </div>
              </motion.div>
            )}

            {/* STAGE 1: AUTO-TYPING TARGET */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md relative z-10">
                 <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    <Terminal className="w-4 h-4" /> AUTO-TARGETING SUSPECT HASH
                 </div>
                 <div className="flex flex-col gap-4">
                    <div className="w-full bg-[#0A0A0E] border border-blue-900/50 p-4 text-sm font-mono text-white shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] h-14 flex items-center">
                      {typedHash}
                      <span className="w-2 h-4 bg-cyan-400 ml-1 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                    </div>
                    {/* Simulated Button Click */}
                    <div className={`w-full py-4 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all duration-300 ${isClicking ? "bg-cyan-400 text-black shadow-[0_0_20px_#22d3ee] scale-[0.98]" : "bg-cyan-900/30 text-cyan-500 border border-cyan-500/30"}`}>
                       <Crosshair className="w-4 h-4" /> Execute Trace
                    </div>
                 </div>
              </motion.div>
            )}

            {/* STAGE 2: TRACING PROGRESS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md flex flex-col items-center relative z-10">
                 <Database className="w-10 h-10 text-cyan-400 mb-6 animate-bounce drop-shadow-[0_0_15px_#22d3ee]" />
                 <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-400 animate-spin" /> Piercing Obfuscation Layers...
                 </div>
                 
                 <div className="w-full h-2 bg-[#0A0A0E] border border-blue-900/50 relative overflow-hidden">
                    <motion.div 
                       className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" 
                       style={{ width: `${progress}%` }} 
                       transition={{ type: "spring", stiffness: 100 }} // Smooths out the stutter visually
                    />
                 </div>
                 
                 <div className="w-full flex justify-between mt-2 text-[9px] font-mono text-cyan-400">
                    <span>{progress.toFixed(1)}%</span>
                    <span><ScrambleText text={targetWallet} isActive={progress < 100} /></span>
                 </div>
              </motion.div>
            )}

            {/* STAGE 3: SUCCESS & MONEY COUNTER */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ type: "spring", damping: 15 }} className="flex flex-col items-center text-center w-full relative z-10">
                 <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    <Zap className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]" />
                 </div>
                 
                 <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.3em] mb-2">
                    <ScrambleText text="ASSETS SUCCESSFULLY ISOLATED" isActive={true} />
                 </div>
                 
                 <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 flex items-center justify-center drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <span className="text-cyan-400 mr-2">$</span>
                    <motion.span>{rounded}</motion.span>
                 </div>

                 <div className="flex gap-4">
                    <div className="px-6 py-3 bg-cyan-500 text-black font-black text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                       Awaiting Deployment
                    </div>
                 </div>
              </motion.div>
            )}

         </AnimatePresence>
      </div>

    </div>
  );
}