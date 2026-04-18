"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Phone, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
// --- PHONE VALIDATION IMPORTS ADDED ---
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// --- VISUALS: TACTICAL GRID SCANNER ---
const TacticalGridBackground = () => (
    <div className="fixed inset-0 z-0 bg-[#020203] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
        <motion.div
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[1px] bg-cyan-500/50 shadow-[0_0_15px_#22d3ee] z-0 opacity-50"
        />
    </div>
);

// --- LOGIC COMPONENT ---
function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlMode = searchParams.get('mode');

    // 1. Set initial state based on URL
    const [view, setView] = useState(urlMode === 'register' ? 'REGISTER' : 'LOGIN');

    // 2. THIS IS THE FIX: Actively watch the URL. If the user clicks "Register" in the navbar 
    // while already on the login page, this catches it and forces the switch.
    useEffect(() => {
        if (urlMode === 'register') {
            setView('REGISTER');
        } else {
            setView('LOGIN');
        }
    }, [urlMode]);

    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", termsAgreed: false });

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setIsLoading(true); 
        setError(null);
        
        try {
            if (view === "LOGIN") {
                const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (loginErr) throw loginErr;
                
                if (data.user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
                    
                    if (profile?.role === 'admin') router.push('/portal');
                    else router.push('/dashboard');
                }
            } else {
                if (!form.termsAgreed) throw new Error("Please accept the Platform Security Terms.");

                // --- STRICT PHONE VALIDATION LOGIC ADDED HERE ---
                if (!form.phone) throw new Error("Please provide a Mobile Number.");
                if (!isPossiblePhoneNumber(form.phone)) throw new Error("Invalid Mobile Number format for selected country.");

                const { data: authData, error: signUpErr } = await supabase.auth.signUp({ 
                    email: form.email, password: form.password, options: { data: { full_name: form.fullName } }
                });

                if (signUpErr) throw signUpErr;
                
                if (authData.user) {
                    await new Promise(r => setTimeout(r, 1500));
                    
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ phone: form.phone, role: 'client' })
                        .eq('id', authData.user.id);

                    if (updateError) {
                        console.error("Profile Sync Error:", updateError.message);
                        setError("Account created, but profile sync failed. Please try logging in.");
                        setIsLoading(false);
                        return;
                    }
                    
                    router.push('/dashboard'); 
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
            <TacticalGridBackground />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-[420px] bg-black/60 backdrop-blur-2xl border border-cyan-900/40 p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                
                <div className="flex flex-col items-center mb-8">
                    <img 
                        src="/assets/logo.png" 
                        alt="Asset Recovery" 
                        className="w-full max-w-[280px] h-auto mb-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.15)]" 
                    />
                    <div className="h-[1px] w-1/2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-2 mb-2" />
                    <p className="text-cyan-400 text-[9px] font-mono tracking-[0.3em] uppercase">Encrypted Uplink Established</p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={view} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <div className="text-center mb-6">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">{view === "LOGIN" ? "Login / Sign In" : "Create Account"}</h2>
                        </div>
                        
                        <form onSubmit={handleAuth} className="space-y-4">
                            {view === "REGISTER" && (
                                <>
                                    <Input placeholder="Full Name" icon={User} value={form.fullName} onChange={(v:any) => setForm({...form, fullName: v})} />
                                    
                                    {/* --- PRO PHONE INPUT ADDED HERE --- */}
                                    <div className="relative group">
                                        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors z-10"><Phone size={18} /></div>
                                        <PhoneInput
                                            international
                                            defaultCountry="US"
                                            value={form.phone}
                                            onChange={(v:any) => setForm({...form, phone: v || ""})}
                                            placeholder="Phone Number"
                                            className="w-full h-12 bg-[#050508] border border-white/10 rounded-lg px-12 text-sm text-white outline-none focus-within:border-cyan-500/50 transition-all font-medium custom-phone-input"
                                        />
                                        <style dangerouslySetInnerHTML={{__html: `
                                            .custom-phone-input .PhoneInputInput {
                                                background: transparent; border: none; color: white; outline: none; font-family: inherit; margin-left: 10px;
                                            }
                                            .custom-phone-input .PhoneInputInput::placeholder {
                                                color: #3f3f46; /* zinc-700 */
                                            }
                                            .custom-phone-input select {
                                                background-color: #050508 !important; color: white !important; cursor: pointer;
                                            }
                                            .custom-phone-input option {
                                                background-color: #0A0A0E !important; color: white !important;
                                            }
                                            .custom-phone-input .PhoneInputCountryIcon {
                                                box-shadow: none; border: 1px solid rgba(255, 255, 255, 0.1);
                                            }
                                        `}} />
                                    </div>
                                </>
                            )}
                            
                            <Input placeholder="Email Address" icon={Mail} type="email" value={form.email} onChange={(v:any) => setForm({...form, email: v})} />
                            
                            <div className="relative">
                                <Input placeholder="Password" icon={Lock} type={showPass ? "text" : "password"} value={form.password} onChange={(v:any) => setForm({...form, password: v})} />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3.5 text-zinc-600 hover:text-white transition-colors z-10">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {view === "REGISTER" && (
                                <label className="flex items-center gap-3 p-3 bg-[#050508] rounded-lg border border-white/5 cursor-pointer hover:border-white/10 transition-colors mt-2">
                                    <input type="checkbox" required className="accent-emerald-500 w-4 h-4" checked={form.termsAgreed} onChange={(e) => setForm({...form, termsAgreed: e.target.checked})} />
                                    <span className="text-[10px] uppercase font-bold text-zinc-500">I accept the Platform Security Terms.</span>
                                </label>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px] font-bold tracking-wide">
                                    <AlertCircle size={14} className="shrink-0" /> {error}
                                </div>
                            )}

                            <button disabled={isLoading} className={`w-full h-12 font-bold uppercase tracking-widest text-[11px] rounded-lg transition-all disabled:opacity-50 mt-4 border flex items-center justify-center gap-2 ${
                                view === "LOGIN" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            }`}>
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (view === "LOGIN" ? "Login" : "Create Account")}
                            </button>

                            <div className="text-center mt-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest relative z-10">
                                {view === "LOGIN" ? "Don't have an account?" : "Have an account?"} 
                                <button type="button" onClick={() => { router.push('/login?mode=register'); }} className="text-cyan-400 hover:text-white transition-colors ml-2 relative z-10">
                                    {view === "LOGIN" ? "Create Account" : "Login"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

const Input = ({ icon: Icon, value, onChange, placeholder, type = "text" }: any) => (
    <div className="relative group">
        <div className="absolute top-3.5 left-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors z-10"><Icon size={18} /></div>
        <input type={type} required value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 bg-[#050508] border border-white/10 rounded-lg px-12 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700 font-medium relative z-0" />
    </div>
);

export default function ChainabuseAuth() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020203] flex items-center justify-center text-cyan-500 text-xs font-mono tracking-widest animate-pulse">ESTABLISHING CONNECTION...</div>}>
            <AuthForm />
        </Suspense>
    );
}