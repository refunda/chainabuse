"use client";
import React, { useState, useEffect, useRef } from "react";
import { THEME, ASSET_LIST } from "./constants"; 
import { PiggyBank, TrendingUp, Info, ArrowRight, Wallet, AlertTriangle, X, Flame, Timer, TrendingDown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js"; 

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        
        const symbols = ASSET_LIST.filter(a => a.s !== 'USDT' && a.s !== 'USDC').map(a => `${a.s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const symbol = data.s; 
            if (symbol && symbol.endsWith("USDT")) {
                const shortName = symbol.replace("USDT", "");
                pricesRef.current[shortName] = { 
                    price: parseFloat(data.c), 
                    change: parseFloat(data.o) > 0 ? ((parseFloat(data.c) - parseFloat(data.o)) / parseFloat(data.o)) * 100 : 0 
                };
            }
        };

        pricesRef.current['USDT'] = { price: 1.00, change: 0 };
        pricesRef.current['USDC'] = { price: 1.00, change: 0 };

        const intervalId = setInterval(() => {
            setLivePrices((prev: any) => ({ ...prev, ...pricesRef.current }));
        }, 1500); 

        return () => {
            ws.close();
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
                alert("Stake Successful! Your funds are now locked and earning yields.");
            } else {
                alert("Staking failed: " + error.message);
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
                alert("Stake broken successfully. Assets returned to your Trading Wallet minus the 15% penalty fee.");
            } else {
                alert("Error breaking stake: " + error.message);
            }
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full">
            {/* HEADER */}
            <div className="p-6 md:p-[30px] mb-6 md:mb-[40px] rounded-2xl md:rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0,0,0,0) 100%)", border: `1px solid ${THEME.border}` }}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-[15px] md:gap-[20px]">
                    <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center shrink-0" style={{ background: THEME.accent, boxShadow: THEME.accentGlow }}>
                        <PiggyBank className="w-6 h-6 md:w-[30px] md:h-[30px]" color="white" />
                    </div>
                    <div>
                        <h1 className="text-[22px] md:text-[28px] font-bold mb-[5px]">{isManageView ? "Manage Stakes" : "Staking Hub"}</h1>
                        <p className="text-[13px] md:text-sm" style={{ color: THEME.textDim }}>{isManageView ? "Track your real-time earnings and lock periods." : "Earn industry-leading APY on your active trading assets."}</p>
                    </div>
                </div>
            </div>

            {/* VIEWS */}
            {isManageView ? (
                <div className="grid gap-[20px]">
                    {activeStakes.length === 0 ? (
                        <div className="text-center p-[40px] md:p-[60px] rounded-2xl md:rounded-[24px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                            <Wallet className="w-10 h-10 md:w-[50px] md:h-[50px] mx-auto mb-[20px] opacity-50" color={THEME.textDim} />
                            <h3 className="text-lg md:text-xl mb-[10px] font-bold">No Active Stakes</h3>
                            <button onClick={() => onRedirect("stake_plans")} className="px-[24px] py-[12px] border-none rounded-xl md:rounded-[12px] text-white font-bold cursor-pointer transition text-sm md:text-base" style={{ background: THEME.accentGradient }}>View Plans</button>
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
                <div className="grid gap-[20px] md:gap-[25px] grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
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
                    <div className="fixed inset-0 bg-black/90 z-[200] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full md:w-[95%] max-w-[450px] p-5 md:p-[30px] rounded-t-3xl md:rounded-[24px] bg-[#0f0f12] overflow-y-auto max-h-[90vh]" style={{ border: `1px solid ${THEME.accent}`, boxShadow: THEME.accentGlow }}>
                            <div className="flex justify-between items-center mb-[20px] md:mb-[25px]">
                                <h2 className="text-[20px] md:text-[22px] font-bold">Stake {stakeModal.symbol}</h2>
                                <button onClick={() => setStakeModal(null)} className="bg-transparent border-none text-[#666] cursor-pointer"><X size={24} /></button>
                            </div>
                            
                            <div className="mb-[20px] md:mb-[25px]">
                                <div className="flex justify-between mb-[10px] text-[11px] md:text-[12px] text-[#888]">
                                    <span>Lock Duration</span>
                                    <span>APY: <span className="font-bold" style={{ color: THEME.success }}>{stakeModal.plans[duration].rate}%</span></span>
                                </div>
                                <div className="flex gap-[8px] md:gap-[10px]">
                                    {[7, 14, 30].map((d: any) => (
                                        <button key={d} onClick={() => setDuration(d)} className="flex-1 py-[10px] md:py-[12px] border-none rounded-[8px] md:rounded-[10px] text-white font-bold cursor-pointer transition text-[12px] md:text-sm" style={{ background: duration === d ? THEME.accent : "#222" }}>{d} Days</button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-[20px] md:mb-[25px]">
                                <div className="flex justify-between mb-[10px] text-[11px] md:text-[12px]">
                                    <span className="text-[#888]">Amount to Stake</span>
                                    <span className="text-[#888]">Trading Wallet: {tradingAssets.find((a: any) => a.symbol === stakeModal.symbol)?.balance.toFixed(6) || 0}</span>
                                </div>
                                <div className="relative">
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min: ${stakeModal.plans[duration].min}`} className="w-full p-[14px_65px_14px_14px] md:p-[15px_80px_15px_15px] bg-[#1a1a1a] rounded-xl md:rounded-[12px] text-white text-[16px] md:text-[18px] outline-none" style={{ border: THEME.border }} />
                                    <div className="absolute right-[8px] md:right-[10px] top-[10px] flex items-center gap-[8px]">
                                        <button onClick={handleMaxAmount} className="p-[4px_8px] md:p-[5px_10px] border-none rounded-[6px] font-bold cursor-pointer text-[10px] md:text-[11px]" style={{ background: "rgba(255,255,255,0.1)", color: THEME.accent }}>MAX</button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-[12px] md:p-[15px] rounded-xl md:rounded-[12px] flex gap-[10px] mb-[20px] md:mb-[25px] text-[11px] md:text-[12px]" style={{ background: "rgba(245, 158, 11, 0.1)", color: THEME.warning, border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                                <div><b>Market Volatility Warning:</b> Your staking returns are calculated in {stakeModal.symbol}. Early withdrawal incurs a 15% fee.</div>
                            </div>

                            <label className="flex items-center gap-[10px] mb-[20px] md:mb-[25px] text-[12px] md:text-[13px] text-[#ccc] cursor-pointer px-1">
                                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" style={{ accentColor: THEME.accent }} />
                                I agree to lock my assets for {duration} days.
                            </label>

                            <button onClick={handleConfirmStake} className="w-full py-[14px] md:py-[16px] border-none rounded-xl md:rounded-[12px] text-white font-bold cursor-pointer text-[14px] md:text-[16px] transition" style={{ background: THEME.accentGradient, opacity: agreed ? 1 : 0.5, pointerEvents: agreed ? "auto" : "none" }}>Confirm Stake</button>
                        </motion.div>
                    </div>
                )}

                {/* PENALTY WARNING */}
                {penaltyModal && (
                    <div className="fixed inset-0 bg-black/95 z-[300] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full md:w-[95%] max-w-[450px] p-5 md:p-[30px] rounded-t-3xl md:rounded-[24px] bg-[#1a0505] text-center overflow-y-auto max-h-[90vh]" style={{ border: "1px solid #ef4444", boxShadow: "0 0 50px rgba(239, 68, 68, 0.2)" }}>
                            <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center mx-auto mb-[15px] md:mb-[20px]" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                                <Flame className="w-8 h-8 md:w-10 md:h-10" color="#ef4444" />
                            </div>
                            <h2 className="text-[22px] md:text-[26px] font-bold text-[#ef4444] mb-[10px]">Wait! Are you sure?</h2>
                            <p className="text-[#aaa] text-[13px] md:text-[14px] leading-relaxed mb-[20px] md:mb-[25px]">
                                Unstaking <b>{penaltyModal.amount} {penaltyModal.symbol}</b> before the lock period ends will trigger an instant <b>15% Penalty Fee</b>.
                            </p>
                            <div className="rounded-xl md:rounded-[16px] p-[15px] md:p-[20px] mb-[20px] md:mb-[25px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <div className="flex justify-between mb-[10px] text-[12px] md:text-sm"><span className="text-[#888]">Principal</span><span className="font-bold">{penaltyModal.amount} {penaltyModal.symbol}</span></div>
                                <div className="flex justify-between mb-[10px] text-[12px] md:text-sm text-[#ef4444]"><span>Penalty Fee (15%)</span><span className="font-bold">-{(penaltyModal.amount * 0.15).toFixed(6)} {penaltyModal.symbol}</span></div>
                                <div className="border-t border-white/10 pt-[10px] flex justify-between text-[12px] md:text-sm"><span>You Receive</span><span className="font-bold text-white">{(penaltyModal.amount * 0.85).toFixed(6)} {penaltyModal.symbol}</span></div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-[10px] md:gap-[15px]">
                                <button onClick={() => setPenaltyModal(null)} className="flex-1 p-[14px] md:p-[15px] bg-white text-black border-none rounded-xl md:rounded-[12px] font-bold cursor-pointer text-sm">Keep Staking</button>
                                <button onClick={executeBreakStake} className="flex-1 p-[14px] md:p-[15px] border rounded-xl md:rounded-[12px] font-bold cursor-pointer text-sm" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderColor: "#ef4444" }}>Unstake & Pay Penalty</button>
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
                setTimeRemaining("BROKEN (PENALTY)");
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
        <div className="p-5 md:p-[25px] rounded-2xl md:rounded-[20px]" style={{ background: "#11141D", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", opacity: stake.status === 'active' ? 1 : 0.6 }}>
            <div className="flex justify-between items-start md:items-center mb-[15px] md:mb-[20px]">
                <div className="flex items-center gap-[12px] md:gap-[15px]">
                    <img src={stake.icon} className="w-10 h-10 md:w-[45px] md:h-[45px] rounded-full" />
                    <div>
                        <div className="font-bold text-[15px] md:text-[18px] text-white leading-tight">{stake.symbol} Staking</div>
                        <div className="text-[10px] md:text-[12px] font-bold flex items-center gap-[4px] md:gap-[5px] mt-1" style={{ color: stake.status === 'broken' ? THEME.danger : THEME.accent }}>
                            <Timer size={12} className="w-3 h-3 md:w-3 md:h-3" /> {timeRemaining}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] md:text-[12px] text-[#888] mb-1">Total Equity</div>
                    <div className="font-bold text-[16px] md:text-[18px] text-white leading-tight">${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
            </div>
            
            <div className="mb-[15px] md:mb-[20px]">
                <div className="flex justify-between text-[10px] md:text-[12px] mb-[6px] md:mb-[8px] text-[#aaa]">
                    <span>Real-Time Progress</span>
                    <span>{elapsedPercent.toFixed(5)}%</span>
                </div>
                <div className="w-full h-2 md:h-2 bg-[#222] rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ width: `${elapsedPercent}%` }} 
                        transition={{ ease: "linear", duration: 0.1 }}
                        className="h-full"
                        style={{ background: stake.status === 'broken' ? THEME.danger : THEME.accentGradient }} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px] md:gap-[15px] p-[12px] md:p-[15px] rounded-xl md:rounded-[12px] mb-[15px] md:mb-[20px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex justify-between md:block text-left">
                    <div className="text-[10px] md:text-[11px] text-[#888] mb-[2px] md:mb-[4px]">STAKED</div>
                    <div className="text-right md:text-left">
                        <div className="font-bold text-white text-[12px] md:text-sm">{stake.amount} {stake.symbol}</div>
                        <div className="text-[9px] md:text-[10px] text-[#666]">Entry: ${stake.entryPrice.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex justify-between md:block text-center md:text-center border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                    <div className="text-[10px] md:text-[11px] text-[#888] mb-[2px] md:mb-[4px]">EARNED</div>
                    <div className="text-right md:text-center">
                        <div className="font-bold text-[12px] md:text-sm" style={{ color: THEME.success }}>+{earnedCrypto.toFixed(7)}</div>
                        <div className="text-[9px] md:text-[10px] text-[#666]">+${earnedUsd.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex justify-between md:block text-right border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                    <div className="text-[10px] md:text-[11px] text-[#888] mb-[2px] md:mb-[4px]">PNL (PRICE)</div>
                    <div className="text-right">
                        <div className="font-bold text-[12px] md:text-sm" style={{ color: pnlPercent >= 0 ? THEME.success : THEME.danger }}>
                            {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                        </div>
                        <div className="text-[9px] md:text-[10px]" style={{ color: pnlUsd >= 0 ? THEME.success : THEME.danger }}>
                            {pnlUsd >= 0 ? "+" : ""}${pnlUsd.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {stake.status === 'active' && (
                <div className="flex justify-end">
                    <button onClick={onBreak} className="w-full md:w-auto px-[20px] py-[12px] md:py-[10px] bg-transparent rounded-xl md:rounded-[8px] text-[12px] md:text-[13px] font-bold cursor-pointer flex items-center justify-center md:justify-start gap-[8px] transition hover:bg-white/5" style={{ border: "1px solid #333", color: "#666" }}>
                        <X size={14} /> Break Stake
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
        <div className="p-5 md:p-[25px] flex flex-col rounded-2xl md:rounded-[16px]" style={{ background: "#11141D", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <div className="flex justify-between items-start mb-[15px] md:mb-[20px]">
                <div className="flex gap-[10px] md:gap-[12px]">
                    <img src={plan.icon} className="w-10 h-10 md:w-[40px] md:h-[40px] rounded-full" alt={plan.name} />
                    <div>
                        <h3 className="text-[15px] md:text-[16px] font-bold text-white leading-tight">{plan.name}</h3>
                        <div className="text-[11px] md:text-[12px]" style={{ color: THEME.accent }}>{plan.symbol}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-white text-[14px] md:text-base leading-tight">${livePrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-[10px] md:text-[11px] flex items-center justify-end gap-[2px] mt-1" style={{ color: change24h >= 0 ? THEME.success : THEME.danger }}>
                        {change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(change24h).toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-[8px] md:gap-[10px] mb-[8px] md:mb-[10px]">
                <button onClick={() => setSelectedDuration(7)} className="p-[8px] md:p-[10px] rounded-xl md:rounded-[8px] bg-transparent text-white cursor-pointer text-[12px] md:text-[13px] transition-all" style={{ border: selectedDuration === 7 ? `1px solid ${THEME.accent}` : "1px solid rgba(255,255,255,0.1)" }}>7 Days</button>
                <button onClick={() => setSelectedDuration(14)} className="p-[8px] md:p-[10px] rounded-xl md:rounded-[8px] bg-transparent text-white cursor-pointer text-[12px] md:text-[13px] transition-all" style={{ border: selectedDuration === 14 ? `1px solid ${THEME.accent}` : "1px solid rgba(255,255,255,0.1)" }}>14 Days</button>
            </div>
            <div className="mb-[20px] md:mb-[30px]">
                <button onClick={() => setSelectedDuration(30)} className="w-full p-[8px] md:p-[10px] rounded-xl md:rounded-[8px] bg-transparent text-white cursor-pointer text-[12px] md:text-[13px] transition-all" style={{ border: selectedDuration === 30 ? `1px solid ${THEME.accent}` : "1px solid rgba(255,255,255,0.1)" }}>30 Days</button>
            </div>

            <div className="grid gap-[10px] md:gap-[12px] mb-[20px] md:mb-[30px] text-[11px] md:text-[12px] text-[#888]">
                <div className="flex justify-between"><span>APY Rate</span><span className="font-bold text-white">{details.rate.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>Min Stake</span><span className="font-bold text-white">{fmt(details.min)} {plan.symbol}</span></div>
                <div className="flex justify-between pt-[8px] md:pt-[10px] border-t border-white/10">
                    <span>Potential Return ({selectedDuration}d)</span>
                    <span className="font-bold" style={{ color: THEME.success }}>+{fmt(potentialGain)} {plan.symbol}</span>
                </div>
            </div>

            {balance > 0 ? (
                <button onClick={onStake} className="w-full p-[14px] md:p-[14px] border-none rounded-xl md:rounded-[8px] text-white font-bold cursor-pointer text-[13px] md:text-[14px] transition hover:opacity-90" style={{ background: THEME.accentGradient }}>Stake</button>
            ) : (
                <button onClick={onBuy} className="w-full p-[14px] md:p-[14px] bg-[#22c55e] border-none rounded-xl md:rounded-[8px] text-white font-bold cursor-pointer flex items-center justify-center gap-[8px] text-[13px] md:text-[14px] transition hover:bg-[#16a34a]">Buy {plan.symbol}</button>
            )}
        </div>
    );
};