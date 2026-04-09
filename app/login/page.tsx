"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Phone, Loader2, AlertCircle, Eye, EyeOff, Server, Terminal, ChevronDown, CheckCircle2, ServerCrash, ShieldAlert, Fingerprint, Activity, Globe } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY CODES DATA
// ═══════════════════════════════════════════════════════════════════════════════
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" }, { code: "+44", country: "UK" }, { code: "+61", country: "AUS" },
  { code: "+49", country: "GER" }, { code: "+33", country: "FRA" }, { code: "+81", country: "JPN" },
  { code: "+86", country: "CHN" }, { code: "+91", country: "IND" }, { code: "+55", country: "BRA" },
  { code: "+52", country: "MEX" }, { code: "+971", country: "UAE" }, { code: "+65", country: "SGP" },
  { code: "+27", country: "ZAF" }, { code: "+7", country: "RUS" }, { code: "+39", country: "ITA" },
  { code: "+34", country: "ESP" }, { code: "+82", country: "KOR" }, { code: "+31", country: "NED" }
].sort((a, b) => a.country.localeCompare(b.country));

// ═══════════════════════════════════════════════════════════════════════════════
// VISUALS: TACTICAL GRID BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
const TacticalBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#020203]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-cyan-900/10 blur-[150px] rounded-full" />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIC COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function AuthForm() {
  const [view, setView] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const searchParams = useSearchParams();

  // FORM STATE
  const [form, setForm] = useState({ fullName: "", email: "", password: "", serverNode: "", termsAgreed: false });
  
  // PHONE STATE
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);

  // SERVER NODE STATUS
  const [nodeStatus, setNodeStatus] = useState<"IDLE" | "CHECKING" | "VALID" | "INVALID">("IDLE");

  // 1. CAPTURE & CHECK REFERRAL (Simulated for Demo)
  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const storedRef = localStorage.getItem('chainabuse_referral');
    const activeRef = urlRef || storedRef;

    if (activeRef) {
      if (urlRef) localStorage.setItem('chainabuse_referral', urlRef);
      setForm(prev => ({ ...prev, serverNode: activeRef }));
      validateServerNode(activeRef);
    }
  }, [searchParams]);

  // 2. VALIDATION FUNCTION (Simulated for Demo)
  const validateServerNode = (code: string) => {
    if (!code) { setNodeStatus("IDLE"); return; }
    setNodeStatus("CHECKING");
    setTimeout(() => {
      // Mock validation: any code longer than 4 chars is "valid"
      if (code.length > 4) setNodeStatus("VALID");
      else setNodeStatus("INVALID");
    }, 800);
  };

  // 3. HANDLE SUBMIT
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(null);
    setComingSoon(false);

    // Validate Phone Number Length if Registering
    if (view === "REGISTER") {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        setError("INVALID TELEMETRY CONTACT (PHONE NUMBER FORMAT INCORRECT).");
        return;
      }
      if (!form.termsAgreed) {
        setError("YOU MUST ACCEPT THE PROTOCOL TERMS TO INITIALIZE.");
        return;
      }
      if (form.serverNode && nodeStatus === "INVALID") {
        setError("NODE REJECTED. INVALID SERVER REFERENCE.");
        return;
      }
    }

    setIsLoading(true); 

    // SIMULATE BACKEND DELAY THEN SHOW COMING SOON
    setTimeout(() => {
      setIsLoading(false);
      setComingSoon(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      <TacticalBackground />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[450px] bg-[#050508] border border-blue-900/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden group">
        
        {/* Decorative Cyber Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none z-20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none z-20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none z-20" />

        {/* Header */}
        <div className="flex items-center justify-center px-6 py-5 border-b border-blue-900/50 bg-[#0A0A0E]">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase">
              Chainabuse_Uplink
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-blue-900/30 bg-[#050508]">
          <button
            type="button"
            onClick={() => { setView("LOGIN"); setError(null); setComingSoon(false); }}
            className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-all ${
              view === "LOGIN" 
                ? "text-cyan-400 bg-cyan-500/5 border-b-2 border-cyan-400" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            [ Authorize_Access ]
          </button>
          <button
            type="button"
            onClick={() => { setView("REGISTER"); setError(null); setComingSoon(false); }}
            className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-all ${
              view === "REGISTER" 
                ? "text-emerald-400 bg-emerald-500/5 border-b-2 border-emerald-400" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            [ Initialize_Node ]
          </button>
        </div>

        <div className="p-6 md:p-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              
              <form onSubmit={handleAuth} className="space-y-4">
                
                {view === "REGISTER" && (
                  <>
                    <Input placeholder="OPERATIVE DESIGNATION (FULL NAME)" icon={User} value={form.fullName} onChange={(v:any) => setForm({...form, fullName: v})} theme="emerald" />
                    
                    {/* SMART PHONE INPUT */}
                    <div className="relative flex gap-2">
                      <div className="relative w-[110px] shrink-0">
                        <button 
                          type="button" 
                          onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                          className="w-full h-12 bg-[#0A0A0E]/50 border border-emerald-900/40 px-3 text-xs font-mono text-white flex items-center justify-between hover:border-emerald-500/50 transition-colors"
                        >
                          <span className="text-emerald-400">{phoneCode}</span>
                          <ChevronDown className="w-3 h-3 text-emerald-500/50" />
                        </button>
                        
                        {/* Custom Dropdown */}
                        <AnimatePresence>
                          {showCodeDropdown && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-0 mt-1 w-[160px] max-h-[200px] overflow-y-auto bg-[#0A0A0E] border border-emerald-500/30 shadow-xl z-50 rounded-sm custom-scrollbar"
                            >
                              {COUNTRY_CODES.map((item) => (
                                <button
                                  key={`${item.country}-${item.code}`}
                                  type="button"
                                  onClick={() => { setPhoneCode(item.code); setShowCodeDropdown(false); }}
                                  className="w-full px-3 py-2 text-left text-xs font-mono text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex justify-between"
                                >
                                  <span>{item.country}</span>
                                  <span className="text-emerald-500/50">{item.code}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                        <input 
                          type="tel" 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)} 
                          placeholder="TELEMETRY CONTACT" 
                          className="w-full h-12 bg-[#0A0A0E]/50 border border-emerald-900/40 pl-10 pr-4 text-xs font-mono text-white outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all placeholder:text-zinc-600" 
                        />
                      </div>
                    </div>

                    {/* SERVER NODE INPUT */}
                    <div className="relative group">
                        <div className={`absolute top-4 left-4 transition-colors ${nodeStatus === 'VALID' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            <Server className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            value={form.serverNode} 
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setForm({...form, serverNode: val});
                                if (val.length > 0) validateServerNode(val); 
                                else setNodeStatus("IDLE");
                            }}
                            placeholder="REFERRAL SERVER NODE (OPTIONAL)" 
                            className={`w-full h-12 bg-[#0A0A0E]/50 border px-10 text-xs text-white outline-none transition-all placeholder:text-zinc-600 font-mono tracking-widest
                                ${nodeStatus === 'VALID' 
                                    ? "border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                    : nodeStatus === 'INVALID' 
                                        ? "border-red-500/50 text-red-400" 
                                        : "border-emerald-900/40 focus:border-emerald-500/50"}
                            `} 
                        />
                        <div className="absolute right-4 top-4">
                            {nodeStatus === 'CHECKING' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                            {nodeStatus === 'VALID' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        {nodeStatus === 'INVALID' && (
                            <div className="absolute -bottom-4 left-1 text-[8px] text-red-500 font-mono font-bold tracking-widest">NODE REJECTED</div>
                        )}
                    </div>
                  </>
                )}

                <Input placeholder="SECURE EMAIL ADDRESS" icon={Mail} value={form.email} onChange={(v:any) => setForm({...form, email: v})} theme={view === "LOGIN" ? "cyan" : "emerald"} />
                
                <div className="relative">
                    <Input placeholder="ENCRYPTION KEY (PASSWORD)" icon={Lock} type={showPass ? "text" : "password"} value={form.password} onChange={(v:any) => setForm({...form, password: v})} theme={view === "LOGIN" ? "cyan" : "emerald"} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-4 top-4 transition-colors ${view === "LOGIN" ? "text-cyan-500/50 hover:text-cyan-400" : "text-emerald-500/50 hover:text-emerald-400"}`}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {view === "REGISTER" && (
                    <label className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-900/30 cursor-pointer hover:bg-emerald-500/10 transition-colors mt-2">
                        <input type="checkbox" className="accent-emerald-500 w-4 h-4 rounded-sm" checked={form.termsAgreed} onChange={(e) => setForm({...form, termsAgreed: e.target.checked})} />
                        <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">I acknowledge and accept the Protocol Terms.</span>
                    </label>
                )}

                {/* ERROR BANNER */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-mono uppercase tracking-widest mt-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* COMING SOON BANNER */}
                <AnimatePresence>
                  {comingSoon && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 mt-2">
                      <ServerCrash className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-mono font-bold text-amber-500 tracking-widest uppercase mb-1">Backend Offline</div>
                        <div className="text-[9px] font-mono text-amber-500/70 uppercase leading-relaxed">
                          Supabase routing protocol is currently under construction. Authentication services will be deployed shortly. [ COMING SOON ]
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button disabled={isLoading} className={`w-full h-12 font-black uppercase tracking-[0.2em] text-[10px] transition-all border flex items-center justify-center gap-2 mt-6 ${
                  isLoading 
                    ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                    : view === "LOGIN"
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                      : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-400 hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                }`}>
                    {isLoading ? <><Activity className="w-4 h-4 animate-spin" /> ESTABLISHING LINK...</> : (view === "LOGIN" ? <><Fingerprint className="w-4 h-4" /> AUTHORIZE ACCESS</> : <><ShieldAlert className="w-4 h-4" /> DEPLOY NEW NODE</>)}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Global CSS for the custom scrollbar in the dropdown */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.8); }
      `}} />
    </div>
  );
}

const Input = ({ icon: Icon, value, onChange, placeholder, type = "text", theme = "cyan" }: any) => {
  const borderColor = theme === "cyan" ? "border-blue-900/40 focus:border-cyan-500/50" : "border-emerald-900/40 focus:border-emerald-500/50";
  const iconColor = theme === "cyan" ? "text-cyan-500/50" : "text-emerald-500/50";
  const shadowColor = theme === "cyan" ? "focus:shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]";

  return (
    <div className="relative group">
        <div className={`absolute top-4 left-4 transition-colors ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder} 
          required
          className={`w-full h-12 bg-[#0A0A0E]/50 border px-10 text-xs text-white outline-none transition-all placeholder:text-zinc-600 font-mono ${borderColor} ${shadowColor}`} 
        />
    </div>
  );
};

export default function RefundaAuth() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020203] flex items-center justify-center text-cyan-500 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Interface...</div>}>
      <AuthForm />
    </Suspense>
  );
}