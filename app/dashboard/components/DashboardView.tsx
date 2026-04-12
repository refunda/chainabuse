"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, CheckCircle, Lock, ArrowRight, ShieldCheck, Database, 
    Wallet, Activity, Globe, MapPin, Terminal, Shield, ChevronRight, 
    Server, LockKeyhole, RefreshCw 
} from "lucide-react";
import { ASSET_LIST } from "./constants"; 
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1. GOD-LEVEL ORBITAL RADAR SCANNER (PRO MOBILE UPGRADE) ---
const RecoveryScanner = ({ onComplete }: any) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState("INITIALIZING UPLINK");
    const [logs, setLogs] = useState<string[]>([]);
    const [activeNodes, setActiveNodes] = useState<number[]>([]);

    // Simulated global coordinates
    const mapNodes = useMemo(() => [
        { id: 0, top: "25%", left: "25%", label: "NA-EAST", status: "DECRYPTING" },
        { id: 1, top: "45%", left: "55%", label: "EU-CENT", status: "BYPASSING" },
        { id: 2, top: "35%", left: "75%", label: "AS-PAC", status: "EXTRACTING" },
        { id: 3, top: "65%", left: "35%", label: "SA-WEST", status: "ANALYZING" },
        { id: 4, top: "55%", left: "80%", label: "OC-SOUTH", status: "SECURING" },
    ], []);

    useEffect(() => {
        const duration = 12000; // 12 seconds
        const interval = 50;
        const steps = duration / interval;
        let current = 0;

        const timer = setInterval(() => {
            current++;
            const pct = Math.min((current / steps) * 100, 100);
            setProgress(pct);

            if (pct < 15) setPhase("ESTABLISHING SECURE ORBITAL LINK");
            else if (pct < 35) setPhase("SCANNING GLOBAL EXCHANGE NODES");
            else if (pct < 60) setPhase("DECRYPTING OFFSHORE LEDGERS");
            else if (pct < 85) setPhase("MATCHING IDENTITY SIGNATURES");
            else setPhase("ASSET FRAGMENTS LOCATED");

            // Light up map nodes progressively based on scan percentage
            if (pct > 20 && !activeNodes.includes(0)) setActiveNodes(prev => [...prev, 0]);
            if (pct > 40 && !activeNodes.includes(1)) setActiveNodes(prev => [...prev, 1]);
            if (pct > 60 && !activeNodes.includes(2)) setActiveNodes(prev => [...prev, 2]);
            if (pct > 75 && !activeNodes.includes(3)) setActiveNodes(prev => [...prev, 3]);
            if (pct > 90 && !activeNodes.includes(4)) setActiveNodes(prev => [...prev, 4]);

            // Generate hyper-realistic logs
            if (current % 10 === 0) {
                const hex1 = Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0');
                const hex2 = Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0');
                const ip = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.xxx`;
                
                const possibleLogs = [
                    `> [GEO] Deep packet inspection near IP: ${ip}...`,
                    `> [NET] Tracing encrypted routes via 0x${hex1} -> 0x${hex2}`,
                    `> [SYS] Decrypting AES-256 localized firewall...`,
                    `> [DB] Extracting fragmented wallet signatures...`,
                    `> [SEC] Bypassing sub-layer proxy protocol...`,
                    `> [NODE] Offshore ledger handshake authenticated.`
                ];
                const newLog = possibleLogs[Math.floor(Math.random() * possibleLogs.length)];
                setLogs(prev => [newLog, ...prev.slice(0, 7)]);
            }

            if (current >= steps) {
                clearInterval(timer);
                setTimeout(onComplete, 500);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [activeNodes]);

    return (
        <div className="h-[85vh] min-h-[550px] md:min-h-[650px] bg-[#020408] rounded-2xl md:rounded-[24px] flex flex-col p-4 md:p-8 relative overflow-hidden border border-cyan-900/50 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(6,182,212,0.05)]">
            
            {/* CYBER RADAR VISUALIZER */}
            <div className="flex-1 relative w-full border border-cyan-900/40 bg-[#010204] rounded-2xl overflow-hidden mb-4 shadow-[inset_0_0_80px_rgba(6,182,212,0.1)] flex items-center justify-center group">
                
                {/* CRT Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0),rgba(6,182,212,0.05)_50%,rgba(255,255,255,0))] bg-[length:100%_4px] opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />
                
                {/* Responsive Concentric Radar Rings */}
                <div className="absolute w-[140%] max-w-[800px] aspect-square rounded-full border border-cyan-900/30" />
                <div className="absolute w-[100%] max-w-[600px] aspect-square rounded-full border border-cyan-500/20 border-dashed animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute w-[60%] max-w-[400px] aspect-square rounded-full border border-cyan-400/20 bg-cyan-500/5 shadow-[0_0_60px_rgba(6,182,212,0.15)]" />
                <div className="absolute w-[20%] max-w-[150px] aspect-square rounded-full bg-cyan-400/10 border border-cyan-300/40 animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.3)]" />

                {/* Center Crosshairs */}
                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />

                {/* Huge Globe Watermark */}
                <Globe className="absolute text-cyan-900/30 w-[90%] max-w-[500px] aspect-square stroke-[0.5] pointer-events-none" />

                {/* Orbital Sweep */}
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }} 
                    className="absolute w-[150%] max-w-[900px] aspect-square rounded-full bg-[conic-gradient(from_0deg,transparent_270deg,rgba(6,182,212,0.25)_360deg)] border-t-2 border-cyan-300 origin-center mix-blend-screen"
                />

                {/* Glowing Coordinate Nodes */}
                {mapNodes.map((node) => (
                    <div key={node.id} className="absolute" style={{ top: node.top, left: node.left }}>
                        <AnimatePresence>
                            {activeNodes.includes(node.id) ? (
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative flex flex-col items-center justify-center">
                                    <motion.div animate={{ scale: [1, 2.5], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute w-6 h-6 border border-emerald-400 rounded-full" />
                                    <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399]" />
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 whitespace-nowrap bg-slate-950/90 border border-emerald-900/50 px-2 py-1 rounded text-[9px] md:text-[10px] font-mono font-bold text-cyan-300 tracking-widest shadow-lg z-10 backdrop-blur-md">
                                        {node.label} <span className="text-emerald-400 ml-1">[{node.status}]</span>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <div className="w-1.5 h-1.5 bg-cyan-700/50 rounded-full shadow-[0_0_5px_rgba(6,182,212,0.3)] animate-pulse" />
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* TERMINAL & PROGRESS */}
            <div className="w-full shrink-0">
                <div className="flex justify-between items-end mb-2 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                    <span className="truncate pr-4 flex items-center gap-2"><Activity size={14} className="animate-pulse text-emerald-400"/> {phase}</span>
                    <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{progress.toFixed(1)}%</span>
                </div>
                
                {/* Pro Hardware Segmented Progress Bar */}
                <div className="h-3 md:h-4 w-full bg-[#010204] rounded p-0.5 border border-cyan-900/50 mb-3 shadow-[inset_0_0_10px_rgba(0,0,0,1)] relative flex gap-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_15px_rgba(6,182,212,0.8)] rounded-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
                    </motion.div>
                </div>
                
                {/* Pro Terminal Logs */}
                <div className="h-[120px] md:h-[150px] w-full bg-[#010204] border border-cyan-900/40 rounded-xl p-4 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] flex flex-col justify-end relative">
                    <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#010204] to-transparent z-10" />
                    <AnimatePresence>
                        {logs.map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`font-mono text-[9px] md:text-[11px] tracking-widest mb-1.5 ${i === 0 ? 'text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)] font-bold' : 'text-slate-600'}`}>
                                {i === 0 && <span className="animate-pulse mr-1">_</span>}
                                {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// --- 2. GOD-LEVEL TACTICAL DISTRIBUTION ENGINE (PRO MOBILE UPGRADE) ---
const DistributionEngine = ({ onFinish }: any) => {
    const [hexCode, setHexCode] = useState("0x00000000");

    useEffect(() => { 
        setTimeout(onFinish, 7000); 
        
        // Random Hex Generator for the realistic hacking effect
        const hexInterval = setInterval(() => {
            const randomHex = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
            setHexCode(`0x${randomHex}`);
        }, 100);

        return () => clearInterval(hexInterval);
    }, []);

    return (
        <div className="h-[80vh] min-h-[550px] bg-[#02050a] rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden border border-cyan-900/50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

            <div className="relative z-10 w-full px-4 md:px-12 flex flex-col items-center">
                
                {/* 3-PART MIGRATION UI */}
                <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl mb-8 md:mb-16">
                    
                    {/* Source: Offshore Ledger */}
                    <div className="text-center flex flex-col items-center relative z-20">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-red-950 border border-red-500/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative overflow-hidden group">
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-red-500/10" />
                            <Database size={36} className="text-red-500 relative z-10" />
                        </div>
                        <div className="text-[10px] md:text-[11px] text-red-400 font-mono font-bold tracking-[0.2em] uppercase">Fragmented Ledger</div>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">{hexCode}</div>
                    </div>

                    {/* The Data Tunnel (Desktop) */}
                    <div className="hidden md:flex flex-1 h-32 relative items-center justify-center mx-6">
                        <div className="absolute w-full h-[2px] bg-slate-800" />
                        <div className="absolute w-full h-[2px] bg-cyan-900/50 top-[40%]" />
                        <div className="absolute w-full h-[2px] bg-cyan-900/50 bottom-[40%]" />
                        
                        {/* Flowing Data Packets */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div 
                                key={i} 
                                animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }} 
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3, ease: "linear" }} 
                                className="absolute w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] top-1/2 -translate-y-1/2" 
                            />
                        ))}
                        {[1, 2].map((i) => (
                            <motion.div 
                                key={`r-${i}`} 
                                animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }} 
                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.7, ease: "linear" }} 
                                className="absolute w-4 h-0.5 bg-white rounded-full shadow-[0_0_10px_white] top-[40%] -translate-y-1/2" 
                            />
                        ))}
                    </div>

                    {/* The Data Tunnel (Mobile Vertical - Upgraded) */}
                    <div className="md:hidden w-32 h-32 relative flex items-center justify-center my-4 overflow-hidden">
                        <div className="absolute h-full w-[2px] bg-slate-800" />
                        <div className="absolute h-full w-[1px] bg-cyan-900/50 left-[40%]" />
                        <div className="absolute h-full w-[1px] bg-cyan-900/50 right-[40%]" />
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div 
                                key={`m-${i}`} 
                                animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }} 
                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4, ease: "linear" }} 
                                className="absolute w-1 h-8 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] left-1/2 -translate-x-1/2" 
                            />
                        ))}
                    </div>

                    {/* Destination: Secure Vault */}
                    <div className="text-center flex flex-col items-center relative z-20">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-emerald-950/50 flex items-center justify-center mb-4 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)] relative overflow-hidden">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(16,185,129,0.5)_360deg)]" />
                            <div className="absolute inset-1 bg-[#050810] rounded-xl flex items-center justify-center">
                                <LockKeyhole size={36} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            </div>
                        </div>
                        <div className="text-[10px] md:text-[11px] text-emerald-400 font-mono font-bold tracking-[0.2em] uppercase">Secure Wallet</div>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">Status: RECEIVING...</div>
                    </div>
                </div>
                
                {/* Execution Console */}
                <div className="w-full max-w-xl bg-[#010204] border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 animate-[shimmer_2s_infinite]" />
                    <h2 className="text-sm md:text-base font-black font-mono text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={16} className="text-cyan-500" /> Executing Smart Contract
                    </h2>
                    
                    <div className="space-y-3 font-mono text-[10px] md:text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Compiling cryptographic signature...</span>
                            <CheckCircle size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Bypassing localized network locks...</span>
                            <CheckCircle size={14} className="text-emerald-500" />
                        </div>
                        <div className="flex justify-between items-center text-cyan-400 drop-shadow-[0_0_2px_rgba(6,182,212,0.8)]">
                            <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Transferring fragments to Ledger...</span>
                            <span className="animate-pulse text-emerald-400">PROCESSING</span>
                        </div>
                    </div>
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
        const channel = supabase.channel(`recovery_updates_${user?.id}_${Date.now()}`)
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

    // THE FIX: Added safety checks for missing database values
    const recoveryValue = useMemo(() => {
        return recoverableAssets.reduce((acc: number, curr: any) => {
            if (!curr || !curr.symbol) return acc; // <-- SAFETY NET
            const symbol = curr.symbol.toUpperCase();
            const price = marketPrices[symbol] || 0;
            return acc + ((parseFloat(curr.amount) || 0) * price);
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
                alert("Execution Error: " + err.message);
                setDistributing(false);
            }
        }
    };

    if (!user) return <div className="p-12 text-center text-cyan-500 font-mono text-xs tracking-widest uppercase animate-pulse flex flex-col items-center gap-4"><Activity size={32}/> Establishing Secure Uplink...</div>;
    
    // --- RENDER ---
    if (distributing) return <DistributionEngine onFinish={handleDistributionComplete} />;
    if (scanning) return <RecoveryScanner onComplete={handleScanComplete} />;

    return (
        <div className="max-w-[1200px] mx-auto w-full text-slate-300 font-sans">
            
            {/* TOP BAR: Tactical Dashboard */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mb-8 rounded-2xl md:rounded-[24px] bg-[#0a0f18]/80 backdrop-blur-sm border border-slate-800 shadow-[0_20px_50px_-12px_rgba(8,145,178,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="text-cyan-500/80 text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] mb-2 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                        <Server size={14}/> {isClaimed ? "TOTAL ASSETS SECURED" : (justRecovered ? "ASSETS FOUND" : "ESTIMATED RECOVERY")}
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter leading-none">
                        ${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="relative z-10 w-full md:w-auto text-left md:text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black font-mono tracking-widest uppercase border shadow-md ${
                        (justRecovered || isClaimed) ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : 
                        isVerified ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : 
                        "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    }`}>
                        {(justRecovered || isClaimed) ? <CheckCircle size={16}/> : isVerified ? <Shield size={16}/> : <Lock size={16}/>}
                        {(justRecovered || isClaimed) ? "ANALYSIS COMPLETE" : isVerified ? "SYSTEM READY" : "ACCESS LOCKED"}
                    </div>
                </div>
            </div>

            <div className="min-h-[400px] md:min-h-[500px]">
                
                {/* STATE A: Scan Finished (REVEAL ASSETS) */}
                {(justRecovered && !isClaimed) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 md:p-16 text-center rounded-2xl md:rounded-[24px] bg-[#0a0f18]/80 backdrop-blur-sm border border-cyan-900/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none" />

                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/40 shadow-[0_0_40px_rgba(52,211,153,0.3)] relative z-10">
                            <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase tracking-widest font-mono relative z-10">Analysis Complete</h2>
                        <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest mb-10 max-w-md mx-auto relative z-10">The following offshore assets perfectly match your cryptographic identity signature.</p>
                        
                        <div className="max-w-[600px] mx-auto mb-10 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-inner relative z-10">
                            {recoverableAssets.length > 0 ? (
                                <div className="divide-y divide-slate-800/80">
                                    {recoverableAssets.map((asset: any, i: number) => {
                                        // THE FIX: Added safety check inside the map loop
                                        if (!asset || !asset.symbol) return null; // <-- SAFETY NET

                                        const logoInfo = ASSET_LIST.find(a => a.s.toUpperCase() === asset.symbol.toUpperCase());
                                        const symbol = asset.symbol.toUpperCase();
                                        const price = marketPrices[symbol] || 0;
                                        const val = (parseFloat(asset.amount) || 0) * price;

                                        return (
                                            <div key={i} className="flex items-center justify-between p-6 bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center p-1 shadow-inner">
                                                        {logoInfo ? <img src={logoInfo.l} alt={asset.symbol} className="w-full h-full rounded-full" /> : <div className="w-full h-full rounded-full bg-slate-800"/>}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-base md:text-lg font-black text-white font-mono tracking-wider">{asset.symbol}</div>
                                                        <div className="text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-widest mt-0.5">Value: ${price.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base md:text-lg font-black font-mono text-white tracking-widest">{parseFloat(asset.amount).toFixed(6)}</div>
                                                    <div className="text-[10px] md:text-xs font-mono font-black text-emerald-400 mt-1 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">≈ ${val.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-slate-600 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-4">
                                    <Search size={32}/>
                                    No recoverable assets found across global nodes.
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => setDistributing(true)} disabled={recoverableAssets.length === 0} className="w-full md:w-auto px-10 py-5 text-xs md:text-sm rounded-xl font-black uppercase tracking-widest text-slate-900 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 flex items-center justify-center gap-3 mx-auto shadow-[0_10px_30px_rgba(6,182,212,0.3)] transition-all transform active:scale-95 relative z-10 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">
                            Execute Secure Transfer <ArrowRight size={18} />
                        </button>
                    </motion.div>
                )}

                {/* STATE B: Already Claimed */}
                {isClaimed && (
                    <div className="px-6 py-16 md:p-24 text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center bg-[#0a0f18]/80 backdrop-blur-sm border border-slate-800 shadow-xl">
                        <CheckCircle className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 text-emerald-500 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
                        <h2 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase tracking-widest font-mono">Migration Successful</h2>
                        <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest mb-10 max-w-md mx-auto leading-relaxed">Assets have been fully decrypted and securely transferred to your active portfolio ledger.</p>
                        <button onClick={() => setActiveTab("assets")} className="w-full md:w-auto px-10 py-5 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm text-slate-900 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-colors transform active:scale-95">Access Active Ledger</button>
                    </div>
                )}

                {/* STATE C: Not Verified */}
                {!justRecovered && !isClaimed && !isVerified && (
                    <div className="px-6 py-16 md:p-24 text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center bg-[#0a0505]/80 backdrop-blur-sm border border-red-900/50 shadow-[0_20px_50px_rgba(239,68,68,0.05)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl" />
                        <Lock className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] relative z-10" />
                        <h2 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase tracking-widest font-mono relative z-10">Uplink Locked</h2>
                        <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest mb-10 max-w-xl mx-auto leading-relaxed relative z-10">Global tracking nodes mandate cryptographic identity confirmation prior to initiating offshore decryption protocols.</p>
                        <button onClick={() => setActiveTab("verification")} className="w-full md:w-auto px-10 py-5 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm text-white bg-red-600 hover:bg-red-500 flex items-center justify-center gap-3 relative z-10 shadow-[0_10px_25px_rgba(239,68,68,0.3)] transition-transform active:scale-95">Verify Identity Clearance <ArrowRight size={18} /></button>
                    </div>
                )}

                {/* STATE D: Verified & Ready (START SCAN) */}
                {!justRecovered && !isClaimed && isVerified && (
                    <div className="px-6 py-16 md:p-24 text-center rounded-2xl md:rounded-[24px] flex flex-col items-center justify-center bg-[#0a0f18]/80 backdrop-blur-sm border border-cyan-900/50 shadow-[0_20px_50px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl" />
                        <div className="mb-10 relative z-10">
                            <div className="absolute inset-[-30px] rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
                            <Search className="w-20 h-20 md:w-24 md:h-24 relative z-10 text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 text-white uppercase tracking-widest font-mono relative z-10">Network Ready</h1>
                        <p className="text-xs md:text-sm font-mono text-slate-400 uppercase tracking-widest mb-12 max-w-lg mx-auto relative z-10 leading-relaxed">Encrypted uplink established successfully. Awaiting terminal command to initialize the global extraction grid.</p>
                        <button onClick={() => setScanning(true)} className="w-full md:w-auto px-10 py-5 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm text-slate-900 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 shadow-[0_10px_30px_rgba(6,182,212,0.4)] relative z-10 transition-transform active:scale-95 flex items-center justify-center gap-3 mx-auto">
                            <Activity size={20} /> Initialize Global Scan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}