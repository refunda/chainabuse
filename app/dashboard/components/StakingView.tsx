"use client";
import React, { useState, useEffect, useRef } from "react";
import { ASSET_LIST } from "./constants"; 
import { PiggyBank, TrendingUp, Info, ArrowRight, Wallet, AlertTriangle, X, Flame, Timer, TrendingDown, RefreshCw, Server, Shield, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🛡️ THE FIX 1: Import shared Supabase instance instead of creating a new one
import { supabase } from "../../../lib/supabase/client";

// --- DYNAMIC PLAN GENERATOR ---
const generateDynamicPlan = (assetSymbol: string, assetName: string, iconUrl: string, livePrice: number) => {
    const customApys: Record<string, number> = {
        "USDT": 1.85, "USDC": 1.80, "BTC": 1.25, "ETH": 1.35, "SOL": 1.50, "BNB": 1.10
    };
    const baseApy = customApys[assetSymbol] || 1.15;
    
    let minEntry = 10 / (livePrice || 1);
    if (minEntry < 1) minEntry = Number(minEntry.toPrecision(2));
    else minEntry = Math.ceil(minEntry);

    return {
        symbol: assetSymbol,
        name: assetName,
        icon: iconUrl,
        plans: {
            7: { rate: baseApy, min: minEntry },
            14: { rate: Number((baseApy * 2.5).toFixed(2)), min: minEntry },
            30: { rate: Number((baseApy * 6.5).toFixed(2)), min: minEntry },
        }
    };
};

export default function StakingView({ activeSubTab, onRedirect, onUpdateAssets }: any) {
    const isManageView = activeSubTab === "manage_stakes";
    const [livePrices, setLivePrices] = useState<any>({});
    const pricesRef = useRef<any>({});
    
    const [tradingAssets, setTradingAssets] = useState<any[]>([]);
    const [activeStakes, setActiveStakes] = useState<any[]>([]);
    
    const [stakeModal, setStakeModal] = useState<any>(null); 
    const [amount, setAmount] = useState("");
    const [duration, setDuration] = useState<7 | 14 | 30>(30);
    const [agreed, setAgreed] = useState(false);
    const [penaltyModal, setPenaltyModal] = useState<any>(null);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: stakes } = await supabase.from('stakes').select('*').eq('user_id', user.id).in('status', ['active', 'completed', 'broken']).order('created_at', { ascending: false });
            if (stakes) {
                const mapped = stakes.map((s: any) => ({
                    id: s.id,
                    symbol: s.asset,
                    amount: s.amount,
                    duration: s.duration_days,
                    startTime: new Date(s.start_time).getTime(),
                    entryPrice: s.entry_price || 1, 
                    apy: s.apy,
                    status: s.status,
                    icon: ASSET_LIST.find((a: any) => a.s === s.asset)?.l || ""
                }));
                setActiveStakes(mapped);
            }

            const { data: myTrading } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('type', 'trading'); 
            if (myTrading) setTradingAssets(myTrading);
            else setTradingAssets([]);
        }
    };

    useEffect(() => {
        fetchData();

        const initial: any = {};
        ASSET_LIST.forEach((a: any) => { 
            initial[a.s] = { price: Number(a.p), change: 0 }; 
            pricesRef.current[a.s] = { price: Number(a.p), change: 0 };
        });
        setLivePrices(initial);
        
        // FIX: use the SAME stream as the navbar ticker (!miniTicker@arr — every symbol at once),
        // then filter to the coins we care about. The old per-symbol stream URL
        // (`btcusdt@miniTicker/ethusdt@miniTicker/...`) would fail the WHOLE connection if any one
        // ASSET_LIST symbol had no Binance USDT pair, silently falling back to the stale static
        // prices in constants.tsx — which is why staking prices could disagree with the ticker.
        // We keep this component's {price, change} object shape so nothing downstream changes.
        const wanted = new Set(ASSET_LIST.map(a => a.s.toUpperCase()));
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (!Array.isArray(data)) return;
            data.forEach((d: any) => {
                const symbol = d.s;
                if (symbol && symbol.endsWith("USDT")) {
                    const shortName = symbol.replace("USDT", "");
                    if (!wanted.has(shortName)) return;
                    const closePrice = parseFloat(d.c);
                    const openPrice = parseFloat(d.o);
                    pricesRef.current[shortName] = { 
                        price: closePrice, 
                        change: openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0 
                    };
                }
            });
        };

        pricesRef.current['USDT'] = { price: 1.00, change: 0 };
        pricesRef.current['USDC'] = { price: 1.00, change: 0 };

        const intervalId = setInterval(() => {
            setLivePrices((prev: any) => ({ ...prev, ...pricesRef.current }));
        }, 1500); 

        // 🛡️ THE FIX 2: Safe WebSocket cleanup prevents the red crash
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            } else {
                ws.onopen = () => ws.close();
            }
            clearInterval(intervalId);
        };
    }, []);

    const handleMaxAmount = () => {
        if (!stakeModal) return;
        const userAsset = tradingAssets.find((a: any) => a.symbol === stakeModal.symbol);
        if (userAsset) setAmount(userAsset.balance.toString());
    };

    const handleConfirmStake = async () => {
        if (!stakeModal) return;
        const val = parseFloat(amount);
        const userAsset = tradingAssets.find((a: any) => a.symbol === stakeModal.symbol);
        
        if (!val || val <= 0) return alert("Invalid amount");
        if (val > (userAsset?.balance || 0)) return alert("Insufficient Trading Balance! Please go to Buy Crypto and swap/deposit to get more.");
        if (!agreed) return alert("Please agree to the terms");

        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            const currentLivePrice = livePrices[stakeModal.symbol]?.price || 1;

            const { error } = await supabase.rpc('user_stake_asset', {
                p_user_id: user.id,
                p_asset: stakeModal.symbol,
                p_amount: val,
                p_apy: stakeModal.plans[duration].rate,
                p_duration_days: duration,
                p_entry_price: currentLivePrice
            });

            if (!error) {
                setStakeModal(null);
                setAmount("");
                setAgreed(false);
                fetchData(); 
                if(onUpdateAssets) onUpdateAssets(); 
                onRedirect("manage_stakes");
                alert("Vault Locked Successfully! Your assets are now generating yields.");
            } else {
                alert("Execution failed: " + error.message);
            }
        }
    };

    const executeBreakStake = async () => {
        if (!penaltyModal) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            const { error } = await supabase.rpc('user_break_stake', {
                p_stake_id: penaltyModal.id,
                p_user_id: user.id
            });
            
            if(!error) {
                setPenaltyModal(null);
                fetchData(); 
                if(onUpdateAssets) onUpdateAssets(); 
                alert("Vault breached successfully. Remaining assets returned to Terminal minus the 15% breach penalty.");
            } else {
                alert("Error breaching vault: " + error.message);
            }
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full font-sans text-slate-300">
            
            {/* HEADER (TACTICAL) */}
            <div className="p-6 md:p-10 mb-8 rounded-2xl md:rounded-[24px] bg-[#050508] border border-cyan-900/30 shadow-[0_0_30px_rgba(6,182,212,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Layers className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest font-mono mb-2">
                            {isManageView ? "Active Vaults" : "High-Yield Node Setup"}
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 font-mono uppercase tracking-widest leading-relaxed">
                            {isManageView 
                            ? "Monitor real-time cryptographic yields and vault lock periods." 
                            : "Lock volatile assets into high-yield generating liquidity nodes."}
                        </p>
                    </div>
                </div>
            </div>

            {/* VIEWS */}
            {isManageView ? (
                <div className="grid gap-5">
                    {activeStakes.length === 0 ? (
                        <div className="text-center p-12 md:p-20 rounded-2xl md:rounded-[24px] bg-[#050508] border border-white/5 shadow-md">
                            <Server className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-6 text-slate-700" />
                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-widest font-mono mb-6">No Active Vaults</h3>
                            <button onClick={() => onRedirect("stake_plans")} className="px-8 py-4 border border-cyan-500/50 rounded-xl text-slate-900 bg-cyan-500 hover:bg-cyan-400 font-black uppercase tracking-widest text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">Deploy New Node</button>
                        </div>
                    ) : (
                        activeStakes.map((stake: any) => (
                            <ActiveStakeItem 
                                key={stake.id} 
                                stake={stake} 
                                livePrice={livePrices[stake.symbol]?.price || 1} 
                                onBreak={() => setPenaltyModal(stake)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="grid gap-5 md:gap-6 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
                    {ASSET_LIST.map((asset: any) => {
                        const userAsset = tradingAssets.find((a: any) => a.symbol === asset.s);
                        const balance = userAsset ? userAsset.balance : 0;
                        const livePrice = livePrices[asset.s]?.price || Number(asset.p) || 1;
                        const change24h = livePrices[asset.s]?.change || 0;
                        
                        const plan = generateDynamicPlan(asset.s, asset.n, asset.l, livePrice);
                        
                        return (
                            <StakingCard 
                                key={asset.s}
                                plan={plan}
                                balance={balance}
                                livePrice={livePrice}
                                change24h={change24h}
                                onStake={() => { setStakeModal(plan); setDuration(30); setAmount(""); }}
                                onBuy={() => onRedirect("buy_crypto")}
                            />
                        );
                    })}
                </div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {/* STAKE SETUP */}
                {stakeModal && (
                    <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-end md:items-center justify-center backdrop-blur-sm p-0 md:p-5">
                        <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full md:w-[95%] max-w-[450px] rounded-t-3xl md:rounded-[24px] bg-[#0a0f18]/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                            
                            {/* Modal Header */}
                            <div className="p-5 md:p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 shrink-0">
                                <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                    <Server size={16} className="text-cyan-400" /> Configure {stakeModal.symbol} Node
                                </h2>
                                <button onClick={() => setStakeModal(null)} className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"><X size={18} /></button>
                            </div>
                            
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex justify-between mb-3 text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-500">
                                        <span>Lock Duration</span>
                                        <span className="flex items-center gap-1">APY Yield: <span className="font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{stakeModal.plans[duration].rate}%</span></span>
                                    </div>
                                    <div className="flex gap-3">
                                        {[7, 14, 30].map((d: any) => (
                                            <button key={d} onClick={() => setDuration(d)} className={`flex-1 py-3 border rounded-xl font-bold font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all ${duration === d ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                                                {d} Days
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8 relative bg-slate-950 p-5 rounded-2xl border border-slate-700/50 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all shadow-inner group">
                                    <div className="flex justify-between mb-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                        <span>Deposit Volume</span>
                                        <span className="text-right">Avail: <span className="text-slate-300 font-bold">{tradingAssets.find((a: any) => a.symbol === stakeModal.symbol)?.balance.toFixed(6) || 0}</span></span>
                                    </div>
                                    <div className="relative">
                                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min: ${stakeModal.plans[duration].min}`} className="w-full bg-transparent border-none text-white font-mono text-3xl font-black outline-none transition-colors placeholder:text-slate-800" />
                                        <button onClick={handleMaxAmount} className="absolute right-0 top-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono text-cyan-400 uppercase transition-colors border border-slate-700 shadow-sm">Max</button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl flex gap-3 mb-6 bg-orange-500/10 border border-orange-500/30 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]">
                                    <AlertTriangle className="w-5 h-5 shrink-0 text-orange-400 mt-0.5" />
                                    <div className="text-[10px] md:text-xs font-mono text-orange-200/90 leading-relaxed">
                                        <strong className="text-white block mb-1">MARKET VOLATILITY WARNING:</strong> Yields calculate natively in {stakeModal.symbol}. Breaching the vault before term completion triggers a mandatory <b>15% penalty fee</b> on principal.
                                    </div>
                                </div>

                                <label className="flex items-start md:items-center gap-3 mb-8 text-[11px] md:text-xs font-mono uppercase tracking-widest text-slate-400 cursor-pointer p-2 hover:bg-slate-800/30 rounded-xl transition-colors">
                                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 shrink-0 mt-0.5 md:mt-0 accent-cyan-500 cursor-pointer" />
                                    I authorize locking these assets for {duration} days.
                                </label>

                                <button onClick={handleConfirmStake} className={`w-full py-4 md:py-5 border-none rounded-xl font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center transition-all ${agreed ? "bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 shadow-[0_10px_20px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>
                                    Deploy Node Contract
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* PENALTY WARNING (RED TACTICAL) */}
                {penaltyModal && (
                    <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full md:w-[95%] max-w-[450px] p-6 md:p-8 rounded-t-3xl md:rounded-[24px] bg-[#0a0505] border border-red-900/50 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(239,68,68,0.1)] text-center flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-red-500/10 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                <Flame className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest font-mono mb-3">Confirm Vault Breach</h2>
                            <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed uppercase tracking-widest mb-6 px-4">
                                Breaching this contract early triggers an instant protocol penalty.
                            </p>
                            
                            <div className="rounded-xl p-5 mb-8 bg-black/40 border border-red-900/30 shadow-inner">
                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-red-900/20">
                                    <span className="text-[10px] font-mono uppercase text-slate-500">Locked Principal</span>
                                    <span className="font-bold font-mono text-white text-xs">{penaltyModal.amount} {penaltyModal.symbol}</span>
                                </div>
                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-red-900/20">
                                    <span className="text-[10px] font-mono uppercase text-red-500">Breach Penalty (15%)</span>
                                    <span className="font-bold font-mono text-red-500 text-xs drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                                        -{(penaltyModal.amount * 0.15).toFixed(6)} {penaltyModal.symbol}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[11px] font-mono uppercase font-black text-emerald-400">Net Return</span>
                                    <span className="font-black font-mono text-emerald-400 text-sm drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                                        {(penaltyModal.amount * 0.85).toFixed(6)} {penaltyModal.symbol}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                                <button onClick={() => setPenaltyModal(null)} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-bold font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors shadow-sm">Abort Breach</button>
                                <button onClick={executeBreakStake} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white border-none rounded-xl font-black font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]">Confirm Penalty</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- ACTIVE STAKE ITEM ---
const ActiveStakeItem = ({ stake, livePrice, onBreak }: any) => {
    const [elapsedPercent, setElapsedPercent] = useState(0);
    const [earnedCrypto, setEarnedCrypto] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState("");

    useEffect(() => {
        const totalDurationMs = stake.duration * 24 * 60 * 60 * 1000;
        const startTime = stake.startTime;
        
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime;
            
            const percent = Math.min((diff / totalDurationMs) * 100, 100);
            setElapsedPercent(Math.max(0, percent));

            const yearMs = 365 * 24 * 60 * 60 * 1000;
            const earned = stake.amount * (stake.apy / 100) * (diff / yearMs);
            setEarnedCrypto(Math.max(0, earned));

            const remainingMs = totalDurationMs - diff;
            if (remainingMs > 0 && stake.status === 'active') {
                const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeRemaining(`${days}d ${hours}h left`);
            } else if (stake.status === 'broken') {
                setTimeRemaining("BREACHED (PENALTY)");
            } else {
                setTimeRemaining("COMPLETED");
            }

        }, 100); 
        return () => clearInterval(interval);
    }, [stake]);

    const entryUsdVal = stake.amount * stake.entryPrice;
    const currentUsdVal = stake.amount * livePrice;
    const pnlPercent = entryUsdVal > 0 ? ((currentUsdVal - entryUsdVal) / entryUsdVal) * 100 : 0;
    const pnlUsd = currentUsdVal - entryUsdVal;

    const earnedUsd = earnedCrypto * livePrice;
    const totalEquity = currentUsdVal + earnedUsd;

    return (
        <div className={`p-6 md:p-8 rounded-2xl md:rounded-[24px] bg-[#0a0f18]/80 backdrop-blur-sm border shadow-xl transition-all ${stake.status === 'active' ? 'border-slate-800' : 'border-red-900/30 opacity-70 grayscale-[50%]'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center p-1 shadow-inner">
                        <img src={stake.icon} className="w-full h-full rounded-full" />
                    </div>
                    <div>
                        <div className="font-black text-lg md:text-xl text-white uppercase tracking-wider font-mono">{stake.symbol} Vault</div>
                        <div className={`text-[10px] md:text-xs font-mono font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest ${stake.status === 'broken' ? 'text-red-500' : 'text-cyan-400'}`}>
                            <Timer size={12} className="animate-pulse" /> {timeRemaining}
                        </div>
                    </div>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Total Vault Equity</div>
                    <div className="font-black text-2xl md:text-3xl text-white leading-none">${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
            </div>
            
            <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                <div className="flex justify-between text-[10px] md:text-xs font-mono uppercase tracking-widest mb-3 text-slate-400">
                    <span>Cryptographic Yield Progress</span>
                    <span className="font-bold text-cyan-400">{elapsedPercent.toFixed(5)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                        animate={{ width: `${elapsedPercent}%` }} 
                        transition={{ ease: "linear", duration: 0.1 }}
                        className={`h-full ${stake.status === 'broken' ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-4 md:p-5 rounded-xl bg-slate-900/50 border border-slate-800 mb-6">
                <div className="flex justify-between md:block text-left pb-3 md:pb-0 border-b md:border-b-0 border-slate-800">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Locked Principal</div>
                    <div className="text-right md:text-left">
                        <div className="font-black text-white text-sm md:text-base font-mono">{stake.amount} {stake.symbol}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Entry: ${stake.entryPrice.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex justify-between md:block md:text-center pb-3 md:pb-0 border-b md:border-b-0 border-slate-800 md:border-l md:border-r border-slate-800">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Generated Yield</div>
                    <div className="text-right md:text-center">
                        <div className="font-black text-sm md:text-base font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">+{earnedCrypto.toFixed(7)}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">+${earnedUsd.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex justify-between md:block text-right">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Market Fluctuation</div>
                    <div className="text-right">
                        <div className={`font-black text-sm md:text-base font-mono ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${pnlUsd >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                            {pnlUsd >= 0 ? "+" : ""}${pnlUsd.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {stake.status === 'active' && (
                <div className="flex justify-end">
                    <button onClick={onBreak} className="w-full md:w-auto px-6 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-900/50 hover:border-red-500/50 rounded-xl text-red-400/80 hover:text-red-400 text-[10px] md:text-xs font-bold font-mono uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all group shadow-sm">
                        <Shield size={14} className="group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"/> Breach Vault
                    </button>
                </div>
            )}
        </div>
    );
};

// --- STAKING CARD ---
const StakingCard = ({ plan, balance, livePrice, change24h, onStake, onBuy }: any) => {
    const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(30);
    const details = plan.plans[selectedDuration];
    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    const potentialGain = details.min * (details.rate / 100) * (selectedDuration / 365);

    return (
        <div className="p-6 md:p-8 flex flex-col rounded-2xl md:rounded-[24px] bg-[#0a0f18]/80 backdrop-blur-sm border border-slate-800 shadow-xl hover:border-cyan-900/50 hover:shadow-[0_10px_30px_rgba(6,182,212,0.05)] transition-all group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center p-1 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        <img src={plan.icon} className="w-full h-full rounded-full" alt={plan.name} />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider font-mono">{plan.name}</h3>
                        <div className="text-[10px] md:text-xs font-mono uppercase tracking-widest mt-1 text-cyan-500">{plan.symbol} NODE</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-black text-white text-base md:text-lg font-mono">${livePrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className={`text-[10px] md:text-xs font-mono font-bold flex items-center justify-end gap-1 mt-1 uppercase tracking-widest ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(change24h).toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 ml-1">Select Lock Duration</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={() => setSelectedDuration(7)} className={`py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest transition-all ${selectedDuration === 7 ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}>7 Days</button>
                <button onClick={() => setSelectedDuration(14)} className={`py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest transition-all ${selectedDuration === 14 ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}>14 Days</button>
            </div>
            <div className="mb-8">
                <button onClick={() => setSelectedDuration(30)} className={`w-full py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest transition-all ${selectedDuration === 30 ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}>30 Days</button>
            </div>

            <div className="grid gap-3 mb-8 text-[10px] md:text-xs font-mono uppercase tracking-widest bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                <div className="flex justify-between text-slate-400"><span>APY Yield Rate</span><span className="font-black text-white">{details.rate.toFixed(2)}%</span></div>
                <div className="flex justify-between text-slate-400"><span>Min Configuration</span><span className="font-bold text-white">{fmt(details.min)} {plan.symbol}</span></div>
                <div className="flex justify-between pt-3 border-t border-slate-800 mt-1">
                    <span className="text-slate-500">Est. Return ({selectedDuration}d)</span>
                    <span className="font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">+{fmt(potentialGain)} {plan.symbol}</span>
                </div>
            </div>

            {balance > 0 ? (
                <button onClick={onStake} className="w-full py-4 border-none rounded-xl text-slate-900 font-black uppercase tracking-widest text-xs md:text-sm transition-all bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 shadow-[0_10px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.3)] active:scale-95">Deploy Node</button>
            ) : (
                <button onClick={onBuy} className="w-full py-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 text-white font-bold uppercase tracking-widest text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">Initialize {plan.symbol}</button>
            )}
        </div>
    );
};