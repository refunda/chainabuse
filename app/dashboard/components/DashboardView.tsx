"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle, Lock, ArrowRight, ShieldCheck, Database, Wallet, Cpu, Activity } from "lucide-react";
import { THEME, ASSET_LIST } from "./constants"; 
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1. SCANNER ANIMATION (Optimized) ---
const RecoveryScanner = ({ onComplete }: any) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState("INITIALIZING");
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const duration = 12000; // 12 seconds scan
        const interval = 50;
        const steps = duration / interval;
        let current = 0;

        const timer = setInterval(() => {
            current++;
            const pct = Math.min((current / steps) * 100, 100);
            setProgress(pct);

            if (pct < 15) setPhase("HANDSHAKE_PROTOCOL");
            else if (pct < 35) setPhase("QUANTUM_DECRYPTION");
            else if (pct < 60) setPhase("LEDGER_ANALYSIS");
            else if (pct < 85) setPhase("VERIFYING_SIGNATURES");
            else setPhase("ASSETS_LOCATED");

            if (current % 3 === 0) {
                const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
                setLogs(prev => [`> 0x${hex} :: PACKET_VERIFIED`, ...prev.slice(0, 7)]);
            }

            if (current >= steps) {
                clearInterval(timer);
                onComplete();
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-[65vh] md:h-[65vh] min-h-[450px] bg-[#020202] rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden" style={{ border: THEME.glassBorder }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: `linear-gradient(transparent 95%, ${THEME.accent} 100%)`, backgroundSize: "100% 40px", transform: "perspective(500px) rotateX(60deg) scale(2)", transformOrigin: "bottom" }} />
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                {/* Responsive Scanner Rings */}
                <div className="relative w-[200px] h-[200px] md:w-[260px] md:h-[260px] flex items-center justify-center mb-6 md:mb-[30px]">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} style={{ position: "absolute", inset: 0, border: `1px dashed ${THEME.accent}`, borderRadius: "50%", opacity: 0.3, willChange: "transform" }} />
                    <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} className="absolute inset-[15px] md:inset-[20px]" style={{ borderTop: `2px solid ${THEME.success}`, borderBottom: `2px solid ${THEME.accent}`, borderRadius: "50%", willChange: "transform" }} />
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-[45px] md:inset-[60px]" style={{ border: `4px solid rgba(255,255,255,0.05)`, borderRadius: "50%", willChange: "transform" }} />
                    <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full flex items-center justify-center" style={{ background: THEME.accentGradient, boxShadow: THEME.accentGlow }}>
                        <Cpu size={32} className="md:w-10 md:h-10 text-white" />
                    </div>
                </div>
                <div style={{ width: "90%", maxWidth: 500 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "monospace", fontSize: 12, color: THEME.accent, fontWeight: "bold" }}>
                        <span className="truncate pr-2">STATUS: {phase}</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: "#111", borderRadius: 3, overflow: "hidden", marginBottom: 20, border: "1px solid #333", position: "relative" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: "100%", background: THEME.accentGradient, boxShadow: `0 0 20px ${THEME.accent}` }} />
                    </div>
                    <div style={{ height: 100, overflow: "hidden", borderLeft: `2px solid ${THEME.accent}`, paddingLeft: 15, fontFamily: "monospace", fontSize: 11 }}>
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: i === 0 ? THEME.success : "#555", marginBottom: 4 }}>
                                    {log}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. DISTRIBUTION ENGINE (Responsive) ---
const DistributionEngine = ({ onFinish }: any) => {
    useEffect(() => { setTimeout(onFinish, 6000); }, []);
    return (
        <div className="h-[65vh] min-h-[450px] bg-[#050505] rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden" style={{ border: THEME.border }}>
            {/* Desktop: Horizontal (Row), Mobile: Vertical (Col) */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-[120px] relative z-10">
                <div style={{ textAlign: "center" }}>
                    <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-xl md:rounded-[20px] bg-[#111] border border-[#333] flex items-center justify-center mb-3 md:mb-[15px]" style={{ boxShadow: "0 0 40px rgba(255,255,255,0.05)" }}>
                        <Database size={28} className="md:w-[36px] md:h-[36px]" color="#666" />
                    </div>
                    <div className="text-[10px] md:text-[11px] text-[#666] font-bold tracking-[2px]">BLOCKCHAIN</div>
                </div>

                {/* Connecting Line - Horizontal on Desktop */}
                <div className="hidden md:block absolute left-[90px] right-[90px] top-[45px] h-1 bg-[#1a1a1a] rounded overflow-hidden">
                    <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: "40%", height: "100%", background: `linear-gradient(90deg, transparent, ${THEME.success}, transparent)` }} />
                    {[1,2,3].map(i => (
                        <motion.div key={i} animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: "easeInOut" }} style={{ position: "absolute", top: -2, width: 8, height: 8, background: "white", borderRadius: "50%", boxShadow: "0 0 10px white" }} />
                    ))}
                </div>

                {/* Connecting Line - Vertical on Mobile */}
                <div className="md:hidden w-1 h-[40px] bg-[#1a1a1a] rounded overflow-hidden relative">
                    <motion.div animate={{ y: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: "100%", height: "40%", background: `linear-gradient(180deg, transparent, ${THEME.success}, transparent)` }} />
                </div>

                <div style={{ textAlign: "center" }}>
                    <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-xl md:rounded-[20px] bg-emerald-500/10 flex items-center justify-center mb-3 md:mb-[15px]" style={{ border: `1px solid ${THEME.success}`, boxShadow: `0 0 50px ${THEME.success}30` }}>
                        <Wallet size={28} className="md:w-[36px] md:h-[36px]" color={THEME.success} />
                    </div>
                    <div className="text-[10px] md:text-[11px] text-white font-bold tracking-[2px]">SECURE VAULT</div>
                </div>
            </div>
            <div className="mt-[40px] md:mt-[60px] text-center">
                <h2 className="text-xl md:text-[24px] font-bold text-white mb-2 md:mb-[10px]">Migrating Assets</h2>
                <div className="flex items-center gap-[10px] justify-center font-mono text-[11px] md:text-[12px]" style={{ color: THEME.textDim }}>
                    <Activity size={14} className="animate-spin" /> EXECUTING SMART CONTRACT...
                </div>
            </div>
        </div>
    );
};

// --- MAIN CONTROLLER ---
export default function DashboardView({ setActiveTab, user }: any) {
    const [scanning, setScanning] = useState(false);
    const [distributing, setDistributing] = useState(false);
    const [recoverableAssets, setRecoverableAssets] = useState<any[]>([]);
    const [userPortfolioValue, setUserPortfolioValue] = useState(0);
    const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

    const isVerified = user?.kyc_status === 'verified';
    const isClaimed = user?.is_recovery_claimed === true;
    const [justRecovered, setJustRecovered] = useState(false);

    // --- 1. FETCH ASSETS ---
    const fetchData = async () => {
        if (!user) return;

        if (!isClaimed) {
            const { data } = await supabase.from('recovery_allocations').select('*').eq('user_id', user.id);
            if (data) {
                const validAssets = data.filter((item: any) => parseFloat(item.amount) > 0);
                setRecoverableAssets(validAssets);
            }
        } 
        
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            let total = 0;
            ASSET_LIST.forEach(asset => {
                const col = `${asset.s.toLowerCase()}_balance`;
                const bal = profile[col] || 0;
                const price = marketPrices[asset.s] || asset.p || 0; 
                total += bal * price;
            });
            setUserPortfolioValue(total);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('recovery_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recovery_allocations', filter: `user_id=eq.${user.id}` }, () => fetchData())
            .subscribe();
        
        const streams = ASSET_LIST.map(a => `${a.s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.s.endsWith("USDT")) {
                const shortName = data.s.replace("USDT", "");
                setMarketPrices(prev => ({ ...prev, [shortName]: parseFloat(data.c) }));
            }
        };

        return () => { supabase.removeChannel(channel); ws.close(); };
    }, [user, isClaimed]);

    useEffect(() => {
        if(isClaimed) fetchData(); 
    }, [marketPrices]);

    const recoveryValue = useMemo(() => {
        return recoverableAssets.reduce((acc: number, curr: any) => {
            const symbol = curr.symbol.toUpperCase();
            const price = marketPrices[symbol] || 0;
            return acc + (parseFloat(curr.amount) * price);
        }, 0);
    }, [recoverableAssets, marketPrices]);

    const displayValue = isClaimed ? userPortfolioValue : (justRecovered ? recoveryValue : 0);

    const handleScanComplete = () => {
        setScanning(false);
        setJustRecovered(true);
    };

    const handleDistributionComplete = async () => {
        if (user) {
            try {
                const { error } = await supabase.rpc('claim_recovery_assets', { target_user_id: user.id });
                if (error) throw error;
                
                setDistributing(false);
                setJustRecovered(false);
                await fetchData(); 
                setActiveTab("assets"); 
            } catch (err: any) {
                console.error("Distribution failed:", err);
                alert("Error: " + err.message);
                setDistributing(false);
            }
        }
    };

    if (!user) return <div className="p-10 text-center text-gray-500">Connecting to secure node...</div>;
    
    // --- RENDER ---
    
    if (distributing) return <DistributionEngine onFinish={handleDistributionComplete} />;
    if (scanning) return <RecoveryScanner onComplete={handleScanComplete} />;

    return (
        <div className="max-w-[1200px] mx-auto w-full">
            
            {/* TOP BAR: Responsive Paddings & Flex */}
            <div className="p-5 md:p-[25px_35px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-[20px] md:mb-[30px] rounded-2xl md:rounded-[20px]" style={{ background: "linear-gradient(180deg, #0a0a0c 0%, #050505 100%)", border: THEME.border, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                <div>
                    <div style={{ color: "#666", fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>
                        {isClaimed ? "TOTAL ASSETS SECURED" : (justRecovered ? "ASSETS FOUND" : "ESTIMATED RECOVERY")}
                    </div>
                    <div className="text-[28px] md:text-[36px] font-[800] text-white tracking-tight leading-none">
                        ${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="w-full md:w-auto text-left md:text-right">
                    <div className="inline-block px-[10px] md:px-[14px] py-[4px] md:py-[6px] rounded-full text-[10px] md:text-[11px] font-bold" style={{ background: (justRecovered || isClaimed) ? "rgba(16,185,129,0.1)" : isVerified ? "rgba(139,92,246,0.1)" : "rgba(239,68,68,0.1)", color: (justRecovered || isClaimed) ? THEME.success : isVerified ? THEME.accent : THEME.danger, border: `1px solid ${(justRecovered || isClaimed) ? THEME.success : isVerified ? THEME.accent : THEME.danger}40` }}>
                        {(justRecovered || isClaimed) ? "ANALYSIS COMPLETE" : isVerified ? "SYSTEM READY" : "ACCESS LOCKED"}
                    </div>
                </div>
            </div>

            <div className="min-h-[400px] md:min-h-[500px]">
                
                {/* STATE A: Scan Finished (REVEAL ASSETS) */}
                {(justRecovered && !isClaimed) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-[60px] text-center rounded-2xl md:rounded-[24px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                        <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] mx-auto mb-4 md:mb-[20px]" style={{ borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${THEME.success}40` }}><ShieldCheck className="w-8 h-8 md:w-8 md:h-8" color={THEME.success} /></div>
                        <h2 className="text-2xl md:text-[32px] font-bold mb-2 md:mb-[10px] text-white">Analysis Complete</h2>
                        <p className="text-sm md:text-base mb-6 md:mb-[40px]" style={{ color: THEME.textDim }}>The following assets were found associated with your identity.</p>
                        
                        <div className="max-w-[550px] mx-auto mb-6 md:mb-[40px] rounded-xl md:rounded-[16px] overflow-hidden" style={{ background: "#050505", border: "1px solid #222" }}>
                            {recoverableAssets.length > 0 ? (
                                recoverableAssets.map((asset: any, i: number) => {
                                    const logoInfo = ASSET_LIST.find(a => a.s.toUpperCase() === asset.symbol.toUpperCase());
                                    const symbol = asset.symbol.toUpperCase();
                                    const price = marketPrices[symbol] || 0;
                                    const val = parseFloat(asset.amount) * price;

                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 md:p-[16px_24px] border-b border-[#1a1a1a]">
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                {logoInfo ? <img src={logoInfo.l} alt={asset.symbol} style={{ width: 28, height: 28, borderRadius: "50%" }} /> : <div style={{width: 28, height: 28, borderRadius: "50%", background: "#333"}}/>}
                                                <div style={{textAlign:"left"}}>
                                                    <div className="text-sm md:text-[16px] font-bold text-white">{asset.symbol}</div>
                                                    <div style={{ fontSize: 11, color: "#666"}}>${price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div style={{textAlign: "right"}}>
                                                <div className="text-sm md:text-base font-bold text-white">{parseFloat(asset.amount).toFixed(6)}</div>
                                                <div style={{ color: THEME.success, fontSize: 12 }}>≈ ${val.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-gray-500 text-sm">No recoverable assets found. Contact Support.</div>
                            )}
                        </div>
                        
                        <button onClick={() => setDistributing(true)} className="w-full md:w-auto px-6 py-4 md:px-[50px] md:py-[18px] text-sm md:text-[16px] rounded-xl md:rounded-[14px] font-bold text-white flex items-center justify-center gap-2" style={{ background: THEME.success, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(16,185,129,0.25)" }}>
                            Distribute to Wallet <ArrowRight size={18} className="md:w-5 md:h-5" />
                        </button>
                    </motion.div>
                )}

                {/* STATE B: Already Claimed */}
                {isClaimed && (
                    <div className="px-6 py-12 md:p-[80px] text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                        <CheckCircle className="w-14 h-14 md:w-[70px] md:h-[70px] mx-auto mb-4 md:mb-[25px]" color={THEME.success} />
                        <h2 className="text-2xl md:text-[32px] font-bold mb-2 md:mb-[15px] text-white">Recovery Complete</h2>
                        <p className="text-sm md:text-base mb-6 md:mb-[30px]" style={{ color: THEME.textDim }}>Your assets have already been recovered and moved to your portfolio.</p>
                        <button onClick={() => setActiveTab("assets")} className="w-full md:w-auto px-6 py-3 md:px-[40px] md:py-[14px] rounded-xl md:rounded-[12px] font-bold text-white" style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${THEME.border}`, cursor: "pointer" }}>Go to Portfolio</button>
                    </div>
                )}

                {/* STATE C: Not Verified */}
                {!justRecovered && !isClaimed && !isVerified && (
                    <div className="px-6 py-12 md:p-[80px] text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                        <Lock className="w-12 h-12 md:w-[60px] md:h-[60px] mx-auto mb-4 md:mb-[25px]" color={THEME.danger} style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.4))" }} />
                        <h2 className="text-2xl md:text-[30px] font-bold mb-2 md:mb-[15px] text-white">Recovery Engine Locked</h2>
                        <p className="text-sm md:text-base max-w-[450px] mx-auto leading-relaxed mb-6 md:mb-[40px]" style={{ color: THEME.textDim }}>The Global Recovery Engine performs deep blockchain analysis. <br className="hidden md:block"/>Restricted to verified accounts only.</p>
                        <button onClick={() => setActiveTab("verification")} className="w-full md:w-auto px-6 py-4 md:px-[45px] md:py-[16px] rounded-xl md:rounded-[12px] font-bold text-white flex items-center justify-center gap-2" style={{ background: THEME.accentGradient, border: "none", cursor: "pointer", boxShadow: THEME.accentGlow }}>Verify Identity <ArrowRight size={18} /></button>
                    </div>
                )}

                {/* STATE D: Verified & Ready (START SCAN) */}
                {!justRecovered && !isClaimed && isVerified && (
                    <div className="px-6 py-12 md:p-[80px] text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                        <div className="mb-6 md:mb-[40px] relative">
                            <div className="absolute inset-[-20px] rounded-full opacity-20" style={{ background: THEME.accent, filter: "blur(40px)" }} />
                            <Search className="w-16 h-16 md:w-[80px] md:h-[80px] relative z-10" color={THEME.accent} />
                        </div>
                        <h1 className="text-2xl md:text-[36px] font-bold mb-2 md:mb-[15px] text-white">System Ready</h1>
                        <p className="text-sm md:text-base mb-8 md:mb-[40px]" style={{ color: THEME.textDim }}>Secure Connection Established. Ready to scan.</p>
                        <button onClick={() => setScanning(true)} className="w-full md:w-auto px-6 py-4 md:px-[70px] md:py-[20px] rounded-xl md:rounded-[16px] font-bold text-white text-sm md:text-[18px]" style={{ background: THEME.accentGradient, border: "none", cursor: "pointer", boxShadow: THEME.accentGlow }}>INITIATE RECOVERY SCAN</button>
                    </div>
                )}
            </div>
        </div>
    );
}