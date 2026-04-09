"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Phone, Loader2, AlertCircle, Eye, EyeOff, Server, Terminal, ChevronDown, CheckCircle2, ServerCrash, ShieldAlert, Fingerprint, Activity, Globe, Zap } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DATA: COUNTRY CODES
// ═══════════════════════════════════════════════════════════════════════════════
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" }, { code: "+44", country: "UK" }, { code: "+971", country: "UAE" },
  { code: "+49", country: "GER" }, { code: "+33", country: "FRA" }, { code: "+81", country: "JPN" },
  { code: "+91", country: "IND" }, { code: "+65", country: "SGP" }, { code: "+27", country: "ZAF" },
  { code: "+61", country: "AUS" }
].sort((a, b) => a.country.localeCompare(b.country));

// ═══════════════════════════════════════════════════════════════════════════════
// 2. VISUALS: HIGH-QUALITY RADAR SCANNER BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
const PremiumBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#010103] overflow-hidden">
    {/* Grid Layer */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
    
    {/* Radial Scanning Pulse */}
    <motion.div 
      animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-[120px]"
    />

    {/* Rotating Radar Sweep */}
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.05)_90deg,transparent_90deg)] pointer-events-none"
    />

    {/* Animated Random Data Pings */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, delay: i * 2, repeat: Infinity }}
        className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
        style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function AuthForm() {
  const [view, setView] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", serverNumber: "", termsAgreed: false });
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<"IDLE" | "CHECKING" | "VALID" | "INVALID">("IDLE");

  useEffect(() => {
    const urlRef = searchParams.get('ref');
    if (urlRef) {
      setForm(prev => ({ ...prev, serverNumber: urlRef }));
      validateServerNode(urlRef);
    }
  }, [searchParams]);

  const validateServerNode = (code: string) => {
    if (!code) { setNodeStatus("IDLE"); return; }
    setNodeStatus("CHECKING");
    setTimeout(() => {
      // Mock: Server numbers are valid if they are 4 digits or more
      if (code.length >= 4) setNodeStatus("VALID");
      else setNodeStatus("INVALID");
    }, 1000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(null);
    setComingSoon(false);

    if (view === "REGISTER") {
      if (!form.serverNumber || nodeStatus !== "VALID") {
        setError("AUTHENTICATION FAILED: VALID SERVER NUMBER REQUIRED.");
        return;
      }
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 7) {
        setError("TELEMETRY ERROR: INVALID PHONE STRING.");
        return;
      }
      if (!form.termsAgreed) {
        setError("PROTOCOL REJECTED: TERMS NOT ACKNOWLEDGED.");
        return;
      }
    }

    setIsLoading(true); 
    setTimeout(() => {
      setIsLoading(false);
      setComingSoon(true);
    }, 1800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-mono text-white">
      <PremiumBackground />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative z-10 w-full max-w-[450px] bg-black/40 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden"
      >
        {/* Glow Bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-1000 ${view === 'LOGIN' ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`} />

        {/* Header */}
        <div className="px-8 py-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-2">
            <div className={`p-2 rounded-lg transition-colors ${view === 'LOGIN' ? 'bg-cyan-500/10' : 'bg-emerald-500/10'}`}>
                <ShieldAlert className={view === 'LOGIN' ? 'text-cyan-400' : 'text-emerald-400'} size={24} />
            </div>
            <div>
                <h1 className="text-xl font-black tracking-[0.2em] uppercase">Security Uplink</h1>
                <p className="text-[9px] text-zinc-500 tracking-[0.3em] uppercase">Protocol v9.4.0 // Encrypted</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/20">
          <button
            onClick={() => { setView("LOGIN"); setError(null); setComingSoon(false); }}
            className={`flex-1 py-4 text-[10px] tracking-[0.2em] uppercase transition-all ${view === "LOGIN" ? "text-cyan-400 bg-cyan-500/5 shadow-[inset_0_-2px_0_#22d3ee]" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            [ Sign_In ]
          </button>
          <button
            onClick={() => { setView("REGISTER"); setError(null); setComingSoon(false); }}
            className={`flex-1 py-4 text-[10px] tracking-[0.2em] uppercase transition-all ${view === "REGISTER" ? "text-emerald-400 bg-emerald-500/5 shadow-[inset_0_-2px_0_#10b981]" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            [ Register_Node ]
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <form onSubmit={handleAuth} className="space-y-5">
                
                {view === "REGISTER" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 tracking-widest uppercase ml-1">Handshake: Server Number</label>
                      <div className="relative group">
                          <Server className={`absolute top-4 left-4 w-4 h-4 transition-colors ${nodeStatus === 'VALID' ? 'text-emerald-400' : 'text-zinc-600'}`} />
                          <input 
                              type="text" 
                              required
                              value={form.serverNumber} 
                              onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setForm({...form, serverNumber: val});
                                  validateServerNode(val);
                              }}
                              placeholder="REQUIRED SERVER DESIGNATION" 
                              className={`w-full h-12 bg-black/40 border px-10 text-xs text-white outline-none transition-all placeholder:text-zinc-700
                                  ${nodeStatus === 'VALID' ? "border-emerald-500/40 text-emerald-400" : nodeStatus === 'INVALID' ? "border-red-500/40 text-red-400" : "border-white/10 focus:border-emerald-500/50"}`} 
                          />
                          <div className="absolute right-4 top-4">
                              {nodeStatus === 'CHECKING' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                              {nodeStatus === 'VALID' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                      </div>
                    </div>

                    <Input label="Operative Designation" placeholder="FULL LEGAL NAME" icon={User} value={form.fullName} onChange={(v:any) => setForm({...form, fullName: v})} theme="emerald" />
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 tracking-widest uppercase ml-1">Telemetry Contact</label>
                      <div className="flex gap-2">
                        <div className="relative w-28 shrink-0">
                          <button type="button" onClick={() => setShowCodeDropdown(!showCodeDropdown)} className="w-full h-12 bg-black/40 border border-white/10 px-3 text-[10px] text-white flex items-center justify-between hover:border-emerald-500/40 transition-colors">
                            <span className="text-emerald-400">{phoneCode}</span>
                            <Globe size={12} className="text-zinc-600" />
                          </button>
                          <AnimatePresence>
                            {showCodeDropdown && (
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-1 w-40 max-h-48 overflow-y-auto bg-black border border-white/10 z-50 rounded-sm shadow-2xl">
                                {COUNTRY_CODES.map((item) => (
                                  <button key={item.country} type="button" onClick={() => { setPhoneCode(item.code); setShowCodeDropdown(false); }} className="w-full px-3 py-2 text-left text-[10px] hover:bg-emerald-500/10 hover:text-emerald-400 border-b border-white/5 flex justify-between uppercase">
                                    <span>{item.country}</span><span>{item.code}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="000 000 0000" className="flex-1 h-12 bg-black/40 border border-white/10 px-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700" />
                      </div>
                    </div>
                  </>
                )}

                <Input label="Comms Channel" placeholder="SECURE EMAIL ADDRESS" icon={Mail} value={form.email} onChange={(v:any) => setForm({...form, email: v})} theme={view === "LOGIN" ? "cyan" : "emerald"} />
                
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 tracking-widest uppercase ml-1">Encryption Key</label>
                  <div className="relative">
                    <Lock className={`absolute top-4 left-4 w-4 h-4 ${view === "LOGIN" ? "text-cyan-500/40" : "text-emerald-500/40"}`} />
                    <input 
                      type={showPass ? "text" : "password"} 
                      required
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      placeholder="••••••••••••"
                      className={`w-full h-12 bg-black/40 border px-10 text-xs text-white outline-none transition-all placeholder:text-zinc-800 ${view === "LOGIN" ? "border-white/10 focus:border-cyan-500/50" : "border-white/10 focus:border-emerald-500/50"}`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-zinc-600 hover:text-white transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {view === "REGISTER" && (
                    <label className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-colors">
                        <input type="checkbox" required className="mt-1 accent-emerald-500 h-3 w-3" checked={form.termsAgreed} onChange={(e) => setForm({...form, termsAgreed: e.target.checked})} />
                        <span className="text-[8px] uppercase leading-relaxed text-zinc-500">I confirm this node initialization and accept all automated recovery protocols.</span>
                    </label>
                )}

                {/* ERROR/STATUS BANNERS */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] uppercase tracking-tighter">
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                  {comingSoon && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20">
                      <ServerCrash size={18} className="text-amber-500 shrink-0" />
                      <div className="text-[9px] uppercase text-amber-500 leading-tight tracking-widest font-bold">
                        Database Link Failure: Supabase nodes are currently offline for maintenance. [ Coming Soon ]
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button disabled={isLoading} className={`w-full h-14 font-black uppercase tracking-[0.3em] text-[10px] transition-all border flex items-center justify-center gap-3 mt-4 ${
                  isLoading ? "bg-zinc-900 border-zinc-800 text-zinc-600" : view === "LOGIN" 
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_#06b6d4]" 
                    : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400 hover:text-black hover:shadow-[0_0_25px_#10b981]"
                }`}>
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : (view === "LOGIN" ? <><Fingerprint size={18} /> Authorize</> : <><Activity size={18} /> Initialize</>)}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const Input = ({ label, icon: Icon, value, onChange, placeholder, type = "text", theme = "cyan" }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] text-zinc-500 tracking-widest uppercase ml-1">{label}</label>
    <div className="relative">
      <Icon className={`absolute top-4 left-4 w-4 h-4 ${theme === 'cyan' ? 'text-cyan-500/40' : 'text-emerald-500/40'}`} />
      <input 
        type={type} 
        required
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className={`w-full h-12 bg-black/40 border border-white/10 px-10 text-xs text-white outline-none transition-all placeholder:text-zinc-800 focus:border-${theme}-500/50`} 
      />
    </div>
  </div>
);

export default function RefundaAuth() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono text-xs animate-pulse">BOOTING...</div>}>
      <AuthForm />
    </Suspense>
  );
}