"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    X, Activity, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, 
    ShieldCheck, PiggyBank, Loader2, CreditCard, Clock, CheckCircle, 
    Timer, Info, BellRing, Lock, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// --- INITIALIZATION ---
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ICON_MAP: any = {
    BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
    XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
    ADA: "https://cryptologos.cc/logos/cardano-ada-logo.png",
    AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    DOT: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
    TRX: "https://cryptologos.cc/logos/tron-trx-logo.png",
    LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
    POL: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    SHIB: "https://cryptologos.cc/logos/shiba-inu-shib-logo.png",
    LTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
    BCH: "https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png",
    ATOM: "https://cryptologos.cc/logos/cosmos-atom-logo.png",
    UNI: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
    XLM: "https://cryptologos.cc/logos/stellar-xlm-logo.png"
};

// --- COMPONENT: THE MODAL (The Interface) ---
const AdminStakeCard = ({ stake, livePrice }: any) => {
    const [elapsedPercent, setElapsedPercent] = useState(0);
    const [earnedCrypto, setEarnedCrypto] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState("");

    useEffect(() => {
        const totalDurationMs = stake.duration_days * 24 * 60 * 60 * 1000;
        const startTime = new Date(stake.start_time).getTime();
        
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

    const entryUsdVal = stake.amount * (stake.entry_price || 1);
    const currentUsdVal = stake.amount * livePrice;
    const pnlPercent = entryUsdVal > 0 ? ((currentUsdVal - entryUsdVal) / entryUsdVal) * 100 : 0;
    const pnlUsd = currentUsdVal - entryUsdVal;
    const earnedUsd = earnedCrypto * livePrice;
    const totalEquity = currentUsdVal + earnedUsd;

    return (
        <div style={{ background: "#11141D", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", padding: 25, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", opacity: stake.status === 'active' ? 1 : 0.6 }}>
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <img src={ICON_MAP[stake.asset] || ICON_MAP['BTC']} width={40} height={40} className="rounded-full" />
                    <div>
                        <div className="font-bold text-base md:text-lg text-white">{stake.asset} Staking</div>
                        <div className="text-[10px] md:text-xs font-bold flex items-center gap-1" style={{ color: stake.status === 'broken' ? '#ef4444' : '#a855f7' }}>
                            <Timer size={10} /> {timeRemaining}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Equity</div>
                    <div className="font-bold text-base md:text-lg text-white">${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
            </div>
            <div className="mb-5">
                <div className="flex justify-between text-[10px] md:text-xs mb-2 text-gray-500">
                    <span>Real-Time Progress</span>
                    <span>{elapsedPercent.toFixed(5)}%</span>
                </div>
                <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ width: `${elapsedPercent}%` }} 
                        className="h-full"
                        style={{ background: stake.status === 'broken' ? '#ef4444' : 'linear-gradient(90deg, #a855f7, #6366f1)' }} 
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl">
                <div>
                    <div className="text-[9px] text-gray-500 mb-1">STAKED</div>
                    <div className="font-bold text-xs text-white">{stake.amount} {stake.asset}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-gray-500 mb-1">EARNED</div>
                    <div className="font-bold text-xs text-green-500">+{earnedCrypto.toFixed(5)}</div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-gray-500 mb-1">PNL</div>
                    <div className={`font-bold text-xs ${pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ClientActivities({ client, onClose, refreshData, isLocked }: any) {
    const [activeTab, setActiveTab] = useState<"assets" | "buy_crypto" | "stakes">("assets");
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stakes, setStakes] = useState<any[]>([]);
    
    // --- 🛡️ NEW: ANTI-SPAM LOCK ---
    const [processingTx, setProcessingTx] = useState<string | null>(null);

    // --- GOD LEVEL 1-CLICK TOAST NOTIFICATIONS ---
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); 
    };
    
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});
    const pricesRef = useRef<Record<string, number>>({});

    useEffect(() => {
        if (client) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [client]);

    const fetchHistory = async () => {
        if (!client) return;
        const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', client.id).order('created_at', { ascending: false });
        const { data: stakeData } = await supabase.from('stakes').select('*').eq('user_id', client.id).order('created_at', { ascending: false });
        
        if (txData) setTransactions(txData);
        if (stakeData) setStakes(stakeData);
        setLoading(false);
    };

    useEffect(() => {
        if (!client) return;
        const channel = supabase.channel(`modal-${client.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload: any) => {
                if (payload.new?.user_id === client.id) {
                    fetchHistory(); 
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [client]);

    useEffect(() => { 
        fetchHistory(); 
        const symbols = Object.keys(ICON_MAP).filter(s => s !== 'USDT' && s !== 'USDC').map(s => `${s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const symbol = data.s; 
            if (symbol && symbol.endsWith("USDT")) {
                pricesRef.current[symbol.replace("USDT", "")] = parseFloat(data.c);
            }
        };
        pricesRef.current['USDT'] = 1.00;
        pricesRef.current['USDC'] = 1.00;
        const intervalId = setInterval(() => setLivePrices((prev: any) => ({ ...prev, ...pricesRef.current })), 1500); 
        return () => { ws.close(); clearInterval(intervalId); };
    }, [client]);

    // 🛡️ THE FIX: 1-CLICK RESOLVE WITH EXPLICIT WALLET ROUTING
    const resolveTransaction = async (txId: string, txType: string, newStatus: 'completed' | 'rejected') => {
        if (isLocked || processingTx === txId) return;
        setProcessingTx(txId); 

        try {
            // 1. Fetch exact transaction
            const { data: tx, error: txError } = await supabase.from('transactions').select('*').eq('id', txId).single();
            if (txError || !tx) throw new Error("Transaction not found on chain.");
            if (tx.status !== 'pending') throw new Error("Transaction already processed.");

            // 2. Fetch exact client profile
            const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', tx.user_id).single();
            if (profError || !profile) throw new Error("Client profile data missing.");

            const sym = (tx.asset || tx.asset_symbol || "BTC").toUpperCase();
            const isMainCoin = ['BTC', 'ETH', 'USDT', 'USDC'].includes(sym);
            
            const currentBalance = isMainCoin 
                ? (Number(profile[`${sym.toLowerCase()}_balance`]) || 0)
                : (Number((profile.other_balances || {})[sym]) || 0);

            let shouldUpdateMainBalance = false;
            let newMainBalance = currentBalance;

            // 3. SECURE ROUTING LOGIC (Trading Wallet vs Main Wallet)
            if (newStatus === 'completed') {
                
                // --- TRADING WALLET ROUTING ---
                if (txType === 'buy_crypto' || txType === 'trading_withdrawal') {
                    const { data: tradingAsset } = await supabase
                        .from('user_assets')
                        .select('*')
                        .eq('user_id', tx.user_id)
                        .eq('type', 'trading')
                        .eq('symbol', sym)
                        .single();
                        
                    let currentTradingBal = tradingAsset?.balance || 0;
                    let newTradingBal = currentTradingBal;
                    
                    if (txType === 'buy_crypto') {
                        newTradingBal = currentTradingBal + Number(tx.amount);
                    } else if (txType === 'trading_withdrawal') {
                        newTradingBal = currentTradingBal - Number(tx.amount);
                        if (newTradingBal < 0) throw new Error("Client lacks sufficient trading funds.");
                    }

                    if (tradingAsset) {
                        const { error: updErr } = await supabase.from('user_assets').update({ balance: newTradingBal }).eq('id', tradingAsset.id);
                        if (updErr) throw new Error("Failed to update Trading Wallet.");
                    } else {
                        const { error: insErr } = await supabase.from('user_assets').insert({ user_id: tx.user_id, type: 'trading', symbol: sym, balance: newTradingBal });
                        if (insErr) throw new Error("Failed to create Trading Wallet asset.");
                    }
                } 
                // --- MAIN WALLET ROUTING ---
                else if (txType === 'deposit_crypto' || txType === 'recovery_claim') {
                    newMainBalance = currentBalance + Number(tx.amount);
                    shouldUpdateMainBalance = true;
                } 
                else if (txType === 'withdrawal') {
                    newMainBalance = currentBalance - Number(tx.amount);
                    if (newMainBalance < 0) throw new Error("Client lacks sufficient main funds.");
                    shouldUpdateMainBalance = true;
                }
            }

            // 4. Update Main Profile Balance (If applicable)
            if (shouldUpdateMainBalance) {
                let updates: any = {};
                if (isMainCoin) {
                    updates[`${sym.toLowerCase()}_balance`] = newMainBalance;
                } else {
                    updates.other_balances = { ...(profile.other_balances || {}), [sym]: newMainBalance };
                }
                const { error: updateProfError } = await supabase.from('profiles').update(updates).eq('id', profile.id);
                if (updateProfError) throw new Error(`RLS Blocked Balance Update: ${updateProfError.message}`);
            }

            // 5. Finalize Transaction Status
            const { error: updateTxError } = await supabase.from('transactions').update({ status: newStatus }).eq('id', txId);
            if (updateTxError) throw new Error(`Failed to update transaction status: ${updateTxError.message}`);

            showToast(`Action ${newStatus.toUpperCase()} successfully`, 'success');
            fetchHistory(); 
            if (refreshData) refreshData();

        } catch (error: any) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            setProcessingTx(null);
        }
    };

    if (!client) return null;

    // 🛡️ THE FIX: Keep Trading transactions securely inside the Trading Tab (FIAT BUY)
    const tradingTypes = ['buy_crypto', 'trading_withdrawal'];
    const assetTxs = transactions.filter(t => !tradingTypes.includes(t.type)); 
    const buyCryptoTxs = transactions.filter(t => tradingTypes.includes(t.type)); 
    
    const pendingAssetCount = assetTxs.filter(t => t.status === 'pending' && (t.type === 'withdrawal' || t.type === 'deposit_crypto' || t.type === 'recovery_claim')).length;
    const pendingBuyCryptoCount = buyCryptoTxs.filter(t => t.status === 'pending').length;

    const getTxIcon = (type: string) => {
        if (type === 'swap') return <ArrowRightLeft size={14} className="text-purple-400" />;
        if (type === 'withdrawal' || type === 'trading_withdrawal') return <ArrowUpRight size={14} className="text-red-400" />;
        if (type === 'recovery_claim') return <ShieldCheck size={14} className="text-blue-400" />;
        if (type === 'deposit_crypto' || type === 'buy_crypto') return <ArrowDownLeft size={14} className="text-green-400" />;
        return <Activity size={14} className="text-gray-400" />;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-[100] p-0 md:p-6 backdrop-blur-md touch-none">
                
                {/* Click outside to close */}
                <div className="absolute inset-0" onClick={onClose} />

                {/* --- CUSTOM TOAST NOTIFICATION --- */}
                <AnimatePresence>
                    {toast && (
                        <motion.div 
                            initial={{ opacity: 0, y: -50, x: "-50%" }} 
                            animate={{ opacity: 1, y: 0, x: "-50%" }} 
                            exit={{ opacity: 0, y: -20, x: "-50%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`fixed top-4 md:top-6 left-1/2 z-[9999] px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-2 md:gap-3 shadow-2xl backdrop-blur-md whitespace-nowrap ${
                                toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
                            }`}
                        >
                            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            <span className="text-xs md:text-sm font-bold tracking-wide">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.div 
                    initial={{ y: "100%", opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: "100%", opacity: 0 }} 
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-[#0a0a0c] border-t md:border border-white/10 w-full md:max-w-4xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90dvh] md:max-h-[85vh] relative z-10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Mobile Pull Indicator */}
                    <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-[#111]">
                        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                    </div>

                    <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0">
                        <div>
                            <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-blue-500 w-5 h-5" /> 
                                <span>Activity Log</span>
                            </h2>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-mono truncate max-w-[200px] md:max-w-md">{client.email}</p>
                        </div>
                        <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white shrink-0">
                            <X size={20} />
                        </button>
                    </div>

                    {/* TABS */}
                    <div className="flex border-b border-white/5 bg-[#0a0a0c] overflow-x-auto scrollbar-hide shrink-0">
                        <button onClick={() => setActiveTab('assets')} className={`flex-1 min-w-[100px] p-3 md:p-4 text-[10px] md:text-sm font-bold tracking-wide transition border-b-2 flex justify-center items-center gap-2 whitespace-nowrap ${activeTab === 'assets' ? 'border-purple-500 text-white bg-purple-500/5' : 'border-transparent text-gray-500 active:bg-white/5'}`}>
                            ASSETS
                            {pendingAssetCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">{pendingAssetCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('buy_crypto')} className={`flex-1 min-w-[100px] p-3 md:p-4 text-[10px] md:text-sm font-bold tracking-wide transition border-b-2 flex justify-center items-center gap-2 whitespace-nowrap ${activeTab === 'buy_crypto' ? 'border-green-500 text-white bg-green-500/5' : 'border-transparent text-gray-500 active:bg-white/5'}`}>
                            FIAT BUY (TRADING)
                            {pendingBuyCryptoCount > 0 && <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]">{pendingBuyCryptoCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('stakes')} className={`flex-1 min-w-[100px] p-3 md:p-4 text-[10px] md:text-sm font-bold tracking-wide transition border-b-2 whitespace-nowrap ${activeTab === 'stakes' ? 'border-orange-500 text-white bg-orange-500/5' : 'border-transparent text-gray-500 active:bg-white/5'}`}>
                            STAKES
                        </button>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-[#0a0a0c] pb-12">
                        {loading ? (
                            <div className="py-20 text-center text-gray-500 flex flex-col items-center">
                                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                                <p className="text-xs">Decrypting ledger...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'assets' && (
                                    <div className="space-y-3">
                                        {assetTxs.length === 0 ? <p className="text-center text-gray-600 py-10 text-xs">No asset transactions found.</p> : 
                                            assetTxs.map(tx => {
                                                const isPendingAction = tx.status === 'pending' && (tx.type === 'deposit_crypto' || tx.type === 'withdrawal' || tx.type === 'recovery_claim');
                                                
                                                const isWithdrawal = tx.type === 'withdrawal';
                                                const feePercent = (client.verification_fee_percent !== null && client.verification_fee_percent !== undefined) ? Number(client.verification_fee_percent) : 7;
                                                const feeAmount = isWithdrawal ? Number((tx.amount * (feePercent / 100)).toFixed(8)) : 0;

                                                return (
                                                    <div key={tx.id} className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between transition border gap-4 ${isPendingAction ? 'bg-purple-500/5 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-[#111] border-white/5'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">
                                                                {getTxIcon(tx.type)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-white uppercase flex items-center gap-2">
                                                                    {tx.type.replace('_crypto', '').replace('_', ' ')}
                                                                    {isPendingAction && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded tracking-widest animate-pulse shrink-0">ACTION</span>}
                                                                </div>
                                                                <div className="text-[10px] md:text-xs text-gray-500 truncate max-w-[200px] md:max-w-sm">{tx.description || 'System transfer'}</div>
                                                                <div className="text-[9px] text-gray-600 mt-1">{new Date(tx.created_at).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Transaction Actions */}
                                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto mt-2 md:mt-0">
                                                            
                                                            <div className="flex flex-col items-start md:items-end">
                                                                <div className={`font-mono font-bold text-sm md:text-lg ${isWithdrawal ? 'text-white' : 'text-green-400'}`}>
                                                                    {isWithdrawal ? '-' : '+'}{tx.amount} {tx.asset || tx.asset_symbol}
                                                                </div>
                                                                
                                                                {isWithdrawal && feePercent > 0 && (
                                                                    <div className="text-[9px] md:text-[10px] text-orange-400 font-mono font-bold mt-1 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 whitespace-nowrap">
                                                                        FEE ({feePercent}%): {feeAmount} {tx.asset || tx.asset_symbol}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isPendingAction ? (
                                                                isLocked ? (
                                                                    <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-[10px] font-bold flex items-center gap-1 cursor-not-allowed grayscale mt-2 md:mt-2">
                                                                        <Lock size={12}/> LOCKED
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-2 mt-0 md:mt-2">
                                                                        <button disabled={processingTx === tx.id} onClick={() => resolveTransaction(tx.id, tx.type, 'completed')} className="px-4 py-2 bg-green-500 active:bg-green-400 md:hover:bg-green-400 text-black rounded text-[10px] font-bold transition shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                                                                            {processingTx === tx.id ? <Loader2 size={12} className="animate-spin" /> : "APPROVE"}
                                                                        </button>
                                                                        <button disabled={processingTx === tx.id} onClick={() => resolveTransaction(tx.id, tx.type, 'rejected')} className="px-4 py-2 bg-red-500/20 active:bg-red-500 md:hover:bg-red-500 active:text-white md:hover:text-white text-red-400 border border-red-500/50 rounded text-[10px] font-bold transition disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                                                                            {processingTx === tx.id ? <Loader2 size={12} className="animate-spin" /> : "REJECT"}
                                                                        </button>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-0 md:mt-1 ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : tx.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>{tx.status}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                )}

                                {activeTab === 'buy_crypto' && (
                                    <div className="space-y-3">
                                        {buyCryptoTxs.length === 0 ? <div className="text-center text-gray-600 py-16"><CreditCard size={40} className="mx-auto mb-4 opacity-20" /><p className="text-xs">No trading transactions.</p></div> : 
                                            buyCryptoTxs.map(tx => {
                                                // 🛡️ THE FIX: Allow trading_withdrawal to trigger the Approve/Reject buttons
                                                const isPendingAction = tx.status === 'pending';
                                                const isWithdrawal = tx.type === 'trading_withdrawal';
                                                
                                                return (
                                                    <div key={tx.id} className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between transition border gap-4 ${isPendingAction ? 'bg-green-500/5 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-[#111] border-white/5'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-green-900/20 border border-green-500/20 flex items-center justify-center shrink-0">
                                                                {getTxIcon(tx.type)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-white uppercase flex items-center gap-2">
                                                                    {isWithdrawal ? 'TRADING WITHDRAWAL' : 'TRADING DEPOSIT'}
                                                                    {isPendingAction && <span className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded tracking-widest animate-pulse shrink-0">ACTION</span>}
                                                                </div>
                                                                <div className="text-[10px] md:text-xs text-gray-500 truncate max-w-[200px] md:max-w-sm">{tx.description || 'Awaiting confirmation'}</div>
                                                                <div className="text-[9px] text-gray-600 mt-1">{new Date(tx.created_at).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                                            <div className={`font-mono font-bold text-sm md:text-lg ${isWithdrawal ? 'text-white' : 'text-green-400'}`}>
                                                                {isWithdrawal ? '-' : '+'}{tx.amount} {tx.asset || tx.asset_symbol}
                                                            </div>
                                                            {isPendingAction ? (
                                                                isLocked ? (
                                                                    <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-[10px] font-bold flex items-center gap-1 cursor-not-allowed grayscale mt-2">
                                                                        <Lock size={12}/> LOCKED
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button disabled={processingTx === tx.id} onClick={() => resolveTransaction(tx.id, tx.type, 'completed')} className="px-4 py-2 bg-green-500 active:bg-green-400 md:hover:bg-green-400 text-black rounded text-[10px] font-bold transition shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center min-w-[80px] disabled:opacity-50">
                                                                            {processingTx === tx.id ? <Loader2 size={12} className="animate-spin" /> : "APPROVE"}
                                                                        </button>
                                                                        <button disabled={processingTx === tx.id} onClick={() => resolveTransaction(tx.id, tx.type, 'rejected')} className="px-4 py-2 bg-red-500/20 active:bg-red-500 md:hover:bg-red-500 active:text-white md:hover:text-white text-red-400 border border-red-500/50 rounded text-[10px] font-bold transition flex items-center justify-center min-w-[80px] disabled:opacity-50">
                                                                            {processingTx === tx.id ? <Loader2 size={12} className="animate-spin" /> : "REJECT"}
                                                                        </button>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : tx.status === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>{tx.status}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                )}

                                {activeTab === 'stakes' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stakes.length === 0 ? <div className="col-span-full text-center text-gray-600 py-16"><PiggyBank size={40} className="mx-auto mb-4 opacity-20" /><p className="text-xs">No active stakes.</p></div> : 
                                            stakes.map(stake => (<AdminStakeCard key={stake.id} stake={stake} livePrice={livePrices[stake.asset] || 1} />))
                                        }
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}