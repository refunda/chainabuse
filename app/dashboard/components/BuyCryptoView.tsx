"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ASSET_LIST } from "./constants"; 
import { 
    RefreshCw, Wallet, ArrowDownLeft, 
    X, ChevronRight, ArrowDown, Activity, 
    Loader2, CheckCircle, Copy, ShieldCheck, Clock, ArrowRightLeft, ArrowUpRight, AlertTriangle, ChevronDown,
    Server, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Local
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function BuyCryptoView({ assets: legacyAssets, onUpdateAssets, onRedirect }: { assets: any[], onUpdateAssets: any, onRedirect: any }) {
    const [modal, setModal] = useState<any>(null); 
    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string | null>(null);
    
    // Independent Trading State
    const [tradingAssets, setTradingAssets] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]); 
    
    // Professional Two-Way Swap State
    const [swapFrom, setSwapFrom] = useState("BTC");
    const [swapTo, setSwapTo] = useState("USDT");
    const [swapAmountFrom, setSwapAmountFrom] = useState("");
    const [swapAmountTo, setSwapAmountTo] = useState("");
    const [lastEdited, setLastEdited] = useState<"from" | "to">("from");
    const [swapStep, setSwapStep] = useState(0); 
    
    // Deposit & Withdraw State
    const [depositAddr, setDepositAddr] = useState<any>({ BTC: "", ETH: "", USDT: "", USDC: "" });
    const [depositAmount, setDepositAmount] = useState("");
    const [actionAmount, setActionAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Verification Fee State
    const [verificationFee, setVerificationFee] = useState(7); // Default to 7%
    const [feeSentAmount, setFeeSentAmount] = useState(""); 
    
    // Live Prices & Currency State
    const [livePrices, setLivePrices] = useState<any>({});
    const pricesRef = useRef<Record<string, number>>({});
    const [isMobile, setIsMobile] = useState(false);

    // 🔹 MULTI-CURRENCY STATE
    const [preferredCurrency, setPreferredCurrency] = useState("USD");
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false); 

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (profile) {
                if (profile.preferred_currency) setPreferredCurrency(profile.preferred_currency);

                let finalBtc = ""; let finalEth = ""; let finalUsdt = ""; let finalUsdc = "";
                
                // THE FIX: Fetch global admin settings directly, ignoring referral hierarchies
                const { data: settings } = await supabase.from('admin_settings').select('*').limit(1).single();
                if (settings) {
                    finalBtc = settings.btc_wallet_address || "";
                    finalEth = settings.eth_wallet_address || "";
                    finalUsdt = settings.usdt_wallet_address || "";
                    finalUsdc = settings.usdc_wallet_address || "";
                }

                if (profile.specific_btc_address?.trim()) finalBtc = profile.specific_btc_address;
                if (profile.specific_eth_address?.trim()) finalEth = profile.specific_eth_address;
                if (profile.specific_usdt_address?.trim()) finalUsdt = profile.specific_usdt_address;
                if (profile.specific_usdc_address?.trim()) finalUsdc = profile.specific_usdc_address;

                setDepositAddr({
                    BTC: finalBtc || "Contact Support", 
                    ETH: finalEth || "Contact Support",
                    USDT: finalUsdt || "Contact Support",
                    USDC: finalUsdc || "Contact Support"
                });

                if (profile.verification_fee_percent !== undefined && profile.verification_fee_percent !== null) {
                    setVerificationFee(Number(profile.verification_fee_percent));
                }
            }

            const { data: myTrading } = await supabase.from('user_assets').select('*').eq('user_id', user.id).eq('type', 'trading'); 
            if (myTrading) setTradingAssets(myTrading);
            else setTradingAssets([]); 

            const { data: txs, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).in('type', ['buy_crypto', 'swap', 'withdrawal']).order('created_at', { ascending: false });

            if (!error && txs) {
                setHistory(txs.map((t: any) => {
                    const isDeduction = (t.type === 'swap' && t.metadata?.swapped_from) || t.type === 'withdrawal';
                    let displayType = 'OTHER';
                    if (t.type === 'buy_crypto') displayType = 'DEPOSIT';
                    else if (t.type === 'swap') displayType = 'SWAP';
                    else if (t.type === 'withdrawal') displayType = 'WITHDRAWAL';

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
        }
    };

    const handleCurrencyChange = async (newCurrency: string) => {
        setPreferredCurrency(newCurrency);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ preferred_currency: newCurrency }).eq('id', user.id);
        }
    };

    useEffect(() => {
        let activeChannel: any = null;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            activeChannel = supabase.channel(`buy_crypto_updates_${user.id}_${Date.now()}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => fetchData())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_assets', filter: `user_id=eq.${user.id}` }, () => fetchData())
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => fetchData())
                .subscribe();
        };

        setupRealtime();

        return () => { 
            if(activeChannel) supabase.removeChannel(activeChannel); 
        };
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        fetchData();

        const fetchLiveFiatRates = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await res.json();
                if (data && data.rates) {
                    setExchangeRates(data.rates);
                }
            } catch (err) {
                console.error("Failed to fetch exchange rates. Defaulting to USD.");
            }
        };
        fetchLiveFiatRates();

        const initial: any = {};
        ASSET_LIST.forEach(a => {
            initial[a.s] = Number(a.p);
            pricesRef.current[a.s] = Number(a.p);
        });
        setLivePrices(initial);
        
        const symbols = ASSET_LIST.filter(a => a.s !== 'USDT' && a.s !== 'USDC').map(a => `${a.s.toLowerCase()}usdt@miniTicker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const symbol = data.s; 
            if (symbol && symbol.endsWith("USDT")) {
                const shortName = symbol.replace("USDT", "");
                pricesRef.current[shortName] = parseFloat(data.c);
            }
        };

        pricesRef.current['USDT'] = 1.00;
        pricesRef.current['USDC'] = 1.00;

        const intervalId = setInterval(() => {
            setLivePrices((prev: any) => ({ ...prev, ...pricesRef.current }));
        }, 1500); 

        return () => {
            window.removeEventListener('resize', handleResize);
            ws.close();
            clearInterval(intervalId);
        };
    }, []);

    const getPrice = (symbol: string) => {
        if (symbol === "USDT" || symbol === "USDC") return 1;
        const live = Number(livePrices[symbol]);
        if (!isNaN(live) && live > 0) return live;
        
        const fallback = ASSET_LIST.find((c: any) => c.s === symbol);
        const fbPrice = fallback ? Number(fallback.p) : 1; 
        return (!isNaN(fbPrice) && fbPrice > 0) ? fbPrice : 1;
    };

    // --- 🌍 MULTI-CURRENCY MATH ---
    const currentRate = exchangeRates[preferredCurrency] || 1;
    const currentSymbol = CURRENCY_INFO[preferredCurrency]?.symbol || "$";
    
    const totalPortfolioValueUSD = tradingAssets.reduce((acc: number, item: any) => acc + (item.balance * getPrice(item.symbol)), 0);
    const totalPortfolioValueFiat = totalPortfolioValueUSD * currentRate;
    
    const getBalance = (sym: string) => tradingAssets.find((a: any) => a.symbol === sym)?.balance || 0;

    // --- 🛡️ DYNAMIC WITHDRAWAL-BASED FEE CALCULATION ---
    const feePercentageDecimal = verificationFee / 100;
    const feeAssetSymbol = selectedAssetSymbol || "BTC"; 
    const feeAssetPriceUSD = getPrice(feeAssetSymbol);
    const feeAssetPriceFiat = feeAssetPriceUSD * currentRate;
    
    const withdrawAmtNumber = parseFloat(actionAmount) || 0;
    const feeAmountCrypto = withdrawAmtNumber * feePercentageDecimal;
    const feeAmountFiat = feeAmountCrypto * feeAssetPriceFiat; 
    
    const feeWalletAddress = selectedAssetSymbol ? depositAddr[selectedAssetSymbol] : depositAddr.BTC;

    const handleFromChange = (val: string) => {
        setSwapAmountFrom(val);
        setLastEdited("from");
        if (val === "" || isNaN(Number(val))) {
            setSwapAmountTo("");
            return;
        }
        const pFrom = getPrice(swapFrom);
        const pTo = getPrice(swapTo);
        setSwapAmountTo(((Number(val) * pFrom) / pTo).toFixed(6));
    };

    const handleToChange = (val: string) => {
        setSwapAmountTo(val);
        setLastEdited("to");
        if (val === "" || isNaN(Number(val))) {
            setSwapAmountFrom("");
            return;
        }
        const pFrom = getPrice(swapFrom);
        const pTo = getPrice(swapTo);
        setSwapAmountFrom(((Number(val) * pTo) / pFrom).toFixed(6));
    };

    useEffect(() => {
        if (lastEdited === "from" && swapAmountFrom !== "" && !isNaN(Number(swapAmountFrom))) {
            const out = (Number(swapAmountFrom) * getPrice(swapFrom)) / getPrice(swapTo);
            setSwapAmountTo(out.toFixed(6));
        } else if (lastEdited === "to" && swapAmountTo !== "" && !isNaN(Number(swapAmountTo))) {
            const req = (Number(swapAmountTo) * getPrice(swapTo)) / getPrice(swapFrom);
            setSwapAmountFrom(req.toFixed(6));
        }
    }, [livePrices, swapFrom, swapTo]);

    const handleDeclareDeposit = async (symbol: string) => {
        const val = parseFloat(depositAmount);
        if (isNaN(val) || val <= 0) return alert("Please enter a valid deposit amount.");

        setIsProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'buy_crypto', 
                asset: symbol,
                amount: val,
                status: 'pending', 
                description: `Awaiting network confirmation`
            });
            fetchData(); 
        }
        
        setIsProcessing(false);
        setModal(null);
        setDepositAmount("");
        alert(`Deposit broadcasted! Awaiting blockchain network confirmation.`);
    };

    const handleSwap = async () => {
        const valIn = parseFloat(swapAmountFrom);
        const valOut = parseFloat(swapAmountTo);
        const sourceBal = getBalance(swapFrom);
        
        if (!valIn || valIn <= 0 || !valOut || valOut <= 0) return alert("Invalid swap amounts.");
        if (valIn > sourceBal) return alert(`Insufficient ${swapFrom} balance.`);
        if (swapFrom === swapTo) return alert("Cannot swap to the same asset.");
        
        setSwapStep(1);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) throw new Error("No User");

            const amountOut = Number(valOut.toFixed(8));

            if (isNaN(amountOut) || amountOut <= 0) {
                throw new Error("Swap amount is too small. Try a larger amount.");
            }

            const { error } = await supabase.rpc('swap_trading_assets', {
                p_user_id: user.id,
                p_from_asset: swapFrom,
                p_to_asset: swapTo,
                p_amount_in: valIn,
                p_amount_out: amountOut
            });

            if (error) throw error;

            setSwapStep(2);
            await fetchData(); 
            setTimeout(() => { 
                setModal(null); 
                setSwapStep(0); 
                setSwapAmountFrom(""); 
                setSwapAmountTo(""); 
            }, 2000);

        } catch (error: any) {
            alert("Swap Error: " + error.message);
            setModal(null);
            setSwapStep(0);
        }
    };

    const handleWithdrawAttempt = async () => {
        const bal = getBalance(selectedAssetSymbol || "");
        if (parseFloat(actionAmount) > bal) {
            alert("Insufficient Balance");
            return;
        }

        setIsProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'withdrawal',
                asset: selectedAssetSymbol,
                amount: parseFloat(actionAmount),
                status: 'pending',
                description: `Trading Withdrawal to ${withdrawAddress}`
            });
            fetchData(); 
        }
        setTimeout(() => {
            setIsProcessing(false);
            setModal("verification_fee"); 
        }, 1500);
    };

    const handleDeclareFeeDeposit = async () => {
        const amt = parseFloat(feeSentAmount) || feeAmountCrypto;
        if (!amt || amt <= 0) return alert("Please enter a valid deposit amount.");

        setIsProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('transactions').insert({
                user_id: user.id,
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
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            alert("Address copied to clipboard!");
        } catch (err) {
            alert("Failed to copy. Please manually select and copy the text.");
        }
    };

    // TACTICAL HISTORY STYLES
    const getHistoryStyles = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return { bg: 'bg-emerald-500/10', color: 'text-emerald-400', icon: <ArrowDownLeft size={12}/> };
            case 'WITHDRAWAL': return { bg: 'bg-red-500/10', color: 'text-red-400', icon: <ArrowUpRight size={12}/> };
            case 'SWAP': return { bg: 'bg-cyan-500/10', color: 'text-cyan-400', icon: <ArrowRightLeft size={12}/> };
            case 'RECOVERY': return { bg: 'bg-emerald-500/20', color: 'text-emerald-400', icon: <ShieldCheck size={12}/> };
            default: return { bg: 'bg-white/5', color: 'text-white', icon: <CheckCircle size={12}/> };
        }
    };

    const allowedDepWdrAssets = ASSET_LIST.filter(a => ["BTC", "ETH", "USDT", "USDC"].includes(a.s));

    return (
        <div className="max-w-[1200px] mx-auto w-full font-sans text-zinc-300">
            
            {/* --- HEADER CARD (TACTICAL STYLE) --- */}
            <div className="p-6 md:p-8 mb-6 md:mb-10 rounded-2xl md:rounded-[24px] bg-[#050508] border border-cyan-900/30 relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-3">
                            <Activity className="text-cyan-400" size={28} /> Trading Terminal
                        </h1>
                        <p className="text-xs md:text-sm text-zinc-500 font-mono uppercase tracking-widest max-w-lg leading-relaxed">
                            Active high-frequency trading portfolio. <br className="hidden md:block"/>Live telemetry connected to global exchange nodes.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-auto p-5 rounded-2xl bg-black/40 border border-white/5 min-w-[240px]">
                        <div className="text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] text-zinc-500 mb-2">TRADING EQUITY</div>
                        <div className="text-3xl md:text-4xl font-black text-white">
                            <AnimatedNumber prefix={currentSymbol} value={totalPortfolioValueFiat} />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-4 mt-8">
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setModal("deposit_select")} className="flex-1 py-3 px-6 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-black bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-colors">
                        <ArrowDownLeft size={18} /> Deposit Funds
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => { setModal("swap"); setSwapStep(0); }} className="flex-1 py-3 px-6 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-zinc-300 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2 transition-colors">
                        <RefreshCw size={18} /> Execute Swap
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setModal("withdraw_menu")} className="flex-1 py-3 px-6 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest text-zinc-300 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2 transition-colors">
                        <ArrowUpRight size={18} /> Extract
                    </motion.button>
                </div>
            </div>

            {/* --- PORTFOLIO LIST HEADER --- */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={20} className="text-cyan-500" /> Active Assets
                </h3>
                
                <div className="flex items-center gap-3 relative z-50">
                    {/* CURRENCY SELECTOR (TACTICAL) */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                            className="flex items-center gap-2 bg-[#050508] hover:bg-white/5 border border-white/5 hover:border-cyan-500/30 px-3 py-2 rounded-xl transition-all group"
                        >
                            <span className="font-mono text-xs font-bold text-cyan-400">{preferredCurrency}</span>
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-white'}`} />
                        </button>

                        <AnimatePresence>
                            {isCurrencyDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-[#050508] backdrop-blur-xl border border-cyan-900/50 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                                    >
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                            {Object.keys(exchangeRates).length > 0 ? (
                                                Object.keys(CURRENCY_INFO).map(curr => {
                                                    const info = CURRENCY_INFO[curr];
                                                    const isSelected = curr === preferredCurrency;
                                                    return (
                                                        <button 
                                                            key={curr} 
                                                            onClick={() => { handleCurrencyChange(curr); setIsCurrencyDropdownOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isSelected ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="text-xs font-bold font-mono">{curr}</span>
                                                                <span className="text-[9px] uppercase tracking-widest opacity-70">{info.name}</span>
                                                            </div>
                                                            {isSelected && <CheckCircle size={14} />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-4 text-center text-xs font-mono text-zinc-500">Scanning...</div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {/* --- THE TRADING LIST --- */}
            <div className="rounded-2xl md:rounded-[20px] overflow-hidden mb-10 bg-[#050508] border border-white/5">
                <div className="hidden md:grid" style={{ gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1.5fr", padding: "16px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Asset</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Live Price</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Balance</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Value</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</div>
                </div>
                
                {tradingAssets.filter(a => a.balance > 0).map((asset: any, i: number) => {
                    const coinInfo = ASSET_LIST.find(c => c.s === asset.symbol) || { p: 1, l: "", n: asset.symbol };
                    const livePriceUSD = getPrice(asset.symbol);
                    const valueUSD = asset.balance * livePriceUSD;
                    
                    return (
                        <div key={i} className="flex flex-col md:grid md:grid-cols-[1.8fr_1fr_1fr_1fr_1.5fr] p-4 md:p-[20px_30px] items-start md:items-center gap-4 md:gap-0 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                            {/* Asset Identity */}
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black border border-white/10 flex items-center justify-center p-1">
                                        <img src={coinInfo.l || "https://upload.wikimedia.org/wikipedia/commons/b/b2/Bootstrap_logo.svg"} className="w-full h-full rounded-full" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm md:text-base text-white uppercase tracking-wider">{asset.symbol}</div>
                                        <div className="text-[10px] md:text-[11px] font-mono text-cyan-500/70 uppercase">Trading Balance</div>
                                    </div>
                                </div>
                                {/* Mobile Only: Balance & Value */}
                                <div className="md:hidden text-right">
                                    <div className="font-bold text-sm font-mono text-white">{asset.balance.toFixed(6)}</div>
                                    <div className="text-xs font-mono text-emerald-400"><AnimatedNumber prefix={currentSymbol} value={valueUSD * currentRate} /></div>
                                </div>
                            </div>

                            {/* Desktop Only Columns */}
                            <div className="hidden md:block text-right font-mono font-bold text-zinc-400 text-sm"><AnimatedNumber prefix={currentSymbol} value={livePriceUSD * currentRate} /></div>
                            <div className="hidden md:block text-right font-mono font-bold text-white text-sm">{asset.balance.toFixed(6)}</div>
                            <div className="hidden md:block text-right font-mono font-bold text-emerald-400 text-sm"><AnimatedNumber prefix={currentSymbol} value={valueUSD * currentRate} /></div>
                            
                            {/* Actions */}
                            <div className="w-full md:w-auto flex justify-end gap-2 mt-2 md:mt-0">
                                <button onClick={() => { setSwapFrom(asset.symbol); setModal("swap"); setSwapStep(0); }} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-colors flex items-center justify-center gap-2"><RefreshCw size={14}/> Swap</button>
                                <button onClick={() => onRedirect("stake_plans")} className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500 hover:text-black transition-colors flex items-center justify-center">Vault</button>
                            </div>
                        </div>
                    );
                })}
                {tradingAssets.filter(a => a.balance > 0).length === 0 && (
                    <div className="p-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                        <Wallet size={32} className="mx-auto mb-3 opacity-50" />
                        <div>Trading Wallet Empty.</div>
                        <div className="mt-1 opacity-60">Deposit funds to initialize.</div>
                    </div>
                )}
            </div>

            {/* --- SCROLLABLE TRANSACTION HISTORY --- */}
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest">Trading Log</h3>
            </div>
            
            <div className="rounded-2xl md:rounded-[20px] overflow-hidden mb-10 bg-[#050508] border border-white/5">
                {history.length === 0 ? (
                    <div className="p-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                        <Clock size={32} className="mx-auto mb-3 opacity-50" />
                        No Trading Activity Detected.
                    </div>
                ) : (
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {/* Mobile View: Cards */}
                        <div className="md:hidden flex flex-col">
                            {history.map((tx) => {
                                const style = getHistoryStyles(tx.type);
                                return (
                                    <div key={tx.id} className="p-4 border-b border-white/5 last:border-b-0 flex flex-col gap-3 hover:bg-white/[0.02]">
                                        <div className="flex justify-between items-start">
                                            <div className={`flex items-center gap-2 px-2 py-1 rounded text-[9px] font-bold font-mono tracking-widest uppercase ${style.bg} ${style.color}`}>
                                                {style.icon} {tx.type}
                                            </div>
                                            <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-emerald-400' : tx.status === 'PENDING' ? 'text-cyan-400' : 'text-orange-400'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-xs text-zinc-300 mb-1">{tx.desc}</div>
                                                <div className="text-[10px] font-mono text-zinc-600">{tx.date} • {tx.time}</div>
                                            </div>
                                            <div className={`text-sm font-bold font-mono ${tx.isPositive ? 'text-emerald-400' : 'text-white'}`}>
                                                {tx.amount}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 z-10 bg-[#050508] border-b border-white/5 p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                                        <th className="sticky top-0 z-10 bg-[#050508] border-b border-white/5 p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Details</th>
                                        <th className="sticky top-0 z-10 bg-[#050508] border-b border-white/5 p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Amount</th>
                                        <th className="sticky top-0 z-10 bg-[#050508] border-b border-white/5 p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Timestamp</th>
                                        <th className="sticky top-0 z-10 bg-[#050508] border-b border-white/5 p-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((tx) => {
                                        const style = getHistoryStyles(tx.type);
                                        return (
                                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 border-b border-white/5">
                                                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold font-mono tracking-widest uppercase ${style.bg} ${style.color}`}>
                                                        {style.icon} {tx.type}
                                                    </div>
                                                </td>
                                                <td className="p-4 border-b border-white/5 text-xs text-zinc-300">{tx.desc}</td>
                                                <td className={`p-4 border-b border-white/5 text-right text-sm font-bold font-mono ${tx.isPositive ? 'text-emerald-400' : 'text-white'}`}>{tx.amount}</td>
                                                <td className="p-4 border-b border-white/5 text-right">
                                                    <div className="text-xs text-zinc-300 font-mono">{tx.date}</div>
                                                    <div className="text-[10px] text-zinc-600 font-mono">{tx.time}</div>
                                                </td>
                                                <td className="p-4 border-b border-white/5 text-right">
                                                    <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-emerald-400' : tx.status === 'PENDING' ? 'text-cyan-400' : 'text-orange-400'}`}>
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

            {/* --- MODALS (TACTICAL CYBER STYLE) --- */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center backdrop-blur-sm p-0 md:p-5">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-[#050508] w-full md:w-[95%] max-w-md rounded-t-3xl md:rounded-2xl border border-cyan-900/50 shadow-[0_0_40px_rgba(0,0,0,0.9)] relative flex flex-col max-h-[90vh]">
                            
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                                    <Server size={16} className="text-cyan-400" />
                                    {modal === "deposit_select" ? "Target Protocol" : 
                                     modal === "deposit" ? "Initialize Deposit" : 
                                     modal === "withdraw_menu" ? "Extract Route" : 
                                     modal === "swap" ? "Execute Swap" : 
                                     modal === "withdraw" ? "Initialize Extraction" : 
                                     modal === "verification_fee" ? "Security Protocol" : "System Alert"}
                                </h3>
                                <button onClick={() => { setModal(null); setDepositAmount(""); setSwapAmountFrom(""); setSwapAmountTo(""); setActionAmount(""); }} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X size={18}/></button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                
                                {/* DEPOSIT MENU */}
                                {modal === "deposit_select" && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-mono text-zinc-500 mb-3 tracking-widest uppercase">Select Asset to Deposit</div>
                                        {allowedDepWdrAssets.map(asset => (
                                            <button key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("deposit"); }} className="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-left cursor-pointer flex items-center gap-4 hover:border-cyan-500/50 transition-colors group">
                                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white/10">
                                                    <img src={asset.l} className="w-full h-full rounded-full" alt={asset.n}/>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-white uppercase tracking-wider">Deposit {asset.n}</div>
                                                    <div className="text-zinc-500 font-mono text-[10px] uppercase">
                                                        {asset.s === 'BTC' ? 'Bitcoin Network' : asset.s === 'ETH' ? 'ERC20 Network' : 'ERC20/TRC20 Network'}
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-cyan-900 group-hover:text-cyan-400 transition-colors" size={20} />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEPOSIT ACTION */}
                                {modal === "deposit" && selectedAssetSymbol && (
                                    <div className="text-center">
                                        {(selectedAssetSymbol === "USDT" || selectedAssetSymbol === "USDC") && (
                                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-3 mb-6">
                                                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                <div className="text-left text-[11px] text-red-300/90 leading-tight font-mono">
                                                    <strong>WARNING:</strong> Send ONLY {selectedAssetSymbol} using the <strong className="text-white">{selectedAssetSymbol === 'USDT' ? 'ERC20 or TRC20' : 'ERC20'} network</strong>. Incorrect networks result in permanent destruction of assets.
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white p-4 rounded-xl w-40 h-40 md:w-48 md:h-48 mx-auto mb-6 flex items-center justify-center">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${depositAddr[selectedAssetSymbol] || ""}`} alt="QR" className="w-full h-full"/>
                                        </div>
                                        
                                        <div className="text-left text-[10px] font-mono text-cyan-500 mb-2 tracking-widest uppercase">Encrypted Destination ({selectedAssetSymbol})</div>
                                        <div onClick={() => copyToClipboard(depositAddr[selectedAssetSymbol])} className="bg-black p-4 rounded-xl border border-white/10 mb-6 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors group">
                                            <div className="font-mono text-xs md:text-sm text-zinc-300 break-all text-left pr-4">{depositAddr[selectedAssetSymbol] || "Address generating..."}</div>
                                            <Copy size={16} className="text-zinc-600 group-hover:text-cyan-400 shrink-0 transition-colors"/>
                                        </div>

                                        <div className="relative mb-6">
                                            <div className="text-left text-[10px] font-mono text-zinc-500 mb-2 tracking-widest uppercase">Transmission Amount</div>
                                            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={`0.00 ${selectedAssetSymbol}`} className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500 transition-colors" />
                                        </div>

                                        <button onClick={() => handleDeclareDeposit(selectedAssetSymbol)} disabled={isProcessing} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex justify-center items-center gap-2">
                                            {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Broadcast Transfer"}
                                        </button>
                                    </div>
                                )}

                                {/* WITHDRAW MENU */}
                                {modal === "withdraw_menu" && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-mono text-zinc-500 mb-3 tracking-widest uppercase">Select Trading Source</div>
                                        {tradingAssets.filter(a => a.balance > 0).length === 0 ? (
                                            <div className="p-8 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest bg-black/40 border border-white/5 rounded-xl">
                                                Trading Wallet Empty
                                            </div>
                                        ) : (
                                            tradingAssets.filter(a => a.balance > 0).map(asset => {
                                                const coinInfo = ASSET_LIST.find(c => c.s === asset.symbol) || { p: 1, l: "", n: asset.symbol };
                                                const valUSD = asset.balance * getPrice(asset.symbol);
                                                return (
                                                    <button key={asset.symbol} onClick={() => { setSelectedAssetSymbol(asset.symbol); setModal("withdraw"); }} className="w-full p-4 bg-black/40 border border-white/5 rounded-xl text-left cursor-pointer flex items-center gap-4 hover:border-red-500/50 transition-colors group">
                                                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white/10">
                                                            <img src={coinInfo.l} className="w-full h-full rounded-full" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm text-white uppercase tracking-wider">{coinInfo.n} <span className="text-[10px] text-zinc-500 font-mono ml-1">{asset.symbol}</span></div>
                                                            <div className="text-[10px] font-mono text-zinc-500">Avail: {asset.balance.toFixed(6)}</div>
                                                        </div>
                                                        <div className="text-right pr-2 hidden md:block">
                                                            <div className="text-sm font-bold text-white font-mono">~{currentSymbol}{((valUSD * currentRate) || 0).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                                                        </div>
                                                        <ChevronRight className="text-red-900 group-hover:text-red-400 transition-colors" size={20} />
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                )}

                                {/* TWO-WAY SWAP MODAL */}
                                {modal === "swap" && (
                                    <div>
                                        {swapStep === 0 && (
                                            <>
                                                {/* PAY SECTION */}
                                                <div className="mb-4 p-4 rounded-xl bg-black border border-white/5 relative group focus-within:border-cyan-500/50 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pay</span>
                                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Balance: {getBalance(swapFrom).toFixed(6)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <select value={swapFrom} onChange={(e) => setSwapFrom(e.target.value)} className="w-24 p-2 bg-[#050508] border border-white/10 rounded-lg text-white font-bold text-sm uppercase outline-none cursor-pointer focus:border-cyan-500/50 transition-colors">
                                                            {ASSET_LIST.map((c: any) => <option key={c.s} value={c.s}>{c.s}</option>)}
                                                        </select>
                                                        <input 
                                                            type="number" placeholder="0.00" value={swapAmountFrom} 
                                                            onChange={(e) => handleFromChange(e.target.value)} 
                                                            className="flex-1 bg-transparent border-none text-white text-2xl font-mono font-bold text-right outline-none w-full placeholder:text-zinc-800" 
                                                        />
                                                    </div>
                                                    <div className="text-right mt-2">
                                                        <button onClick={() => handleFromChange(getBalance(swapFrom).toString())} className="text-[10px] font-bold font-mono bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-cyan-400 transition-colors uppercase tracking-widest">MAX</button>
                                                    </div>
                                                </div>
                                                
                                                {/* FLIP BUTTON */}
                                                <div className="flex justify-center -my-3 relative z-10">
                                                    <button onClick={() => {
                                                        const tempCoin = swapFrom; setSwapFrom(swapTo); setSwapTo(tempCoin);
                                                        const tempAmount = swapAmountFrom; setSwapAmountFrom(swapAmountTo); setSwapAmountTo(tempAmount);
                                                        setLastEdited(lastEdited === "from" ? "to" : "from");
                                                    }} className="bg-[#050508] p-2 rounded-full border border-white/10 text-cyan-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                        <ArrowDown size={18} />
                                                    </button>
                                                </div>

                                                {/* RECEIVE SECTION */}
                                                <div className="mb-6 p-4 rounded-xl bg-black border border-white/5 relative group focus-within:border-cyan-500/50 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Receive</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <select value={swapTo} onChange={(e) => setSwapTo(e.target.value)} className="w-24 p-2 bg-[#050508] border border-white/10 rounded-lg text-white font-bold text-sm uppercase outline-none cursor-pointer focus:border-cyan-500/50 transition-colors">
                                                            {ASSET_LIST.map((c: any) => <option key={c.s} value={c.s}>{c.s}</option>)}
                                                        </select>
                                                        <input 
                                                            type="number" placeholder="0.00" value={swapAmountTo} 
                                                            onChange={(e) => handleToChange(e.target.value)} 
                                                            className="flex-1 bg-transparent border-none text-white text-2xl font-mono font-bold text-right outline-none w-full placeholder:text-zinc-800" 
                                                        />
                                                    </div>
                                                    <div className="text-right text-[10px] font-mono text-zinc-600 mt-2 tracking-widest uppercase">
                                                        ≈ {currentSymbol}{((parseFloat(swapAmountFrom || "0") * getPrice(swapFrom) * currentRate) || 0).toFixed(2)} {preferredCurrency}
                                                    </div>
                                                </div>

                                                <button onClick={handleSwap} className="w-full p-4 border border-cyan-500/50 rounded-xl font-bold text-black bg-cyan-500 hover:bg-cyan-400 uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-colors">Execute Swap</button>
                                            </>
                                        )}
                                        {swapStep === 1 && (
                                            <div className="py-10 text-center">
                                                <RefreshCw size={50} className="mx-auto text-cyan-500 animate-spin mb-6"/>
                                                <h3 className="text-lg font-bold font-mono text-white uppercase tracking-widest mb-2">Executing Logic...</h3>
                                            </div>
                                        )}
                                        {swapStep === 2 && (
                                            <div className="py-10 text-center">
                                                <CheckCircle size={60} className="mx-auto text-emerald-500 mb-6" />
                                                <h3 className="text-lg font-bold font-mono text-white uppercase tracking-widest mb-6">Execution Successful</h3>
                                                <button onClick={() => { setModal(null); setSwapStep(0); setSwapAmountFrom(""); setSwapAmountTo(""); }} className="w-full p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-xs uppercase tracking-widest font-bold transition-colors">Close</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* WITHDRAW ACTION */}
                                {modal === "withdraw" && selectedAssetSymbol && (
                                    <div className="text-center">
                                        {(selectedAssetSymbol === "USDT" || selectedAssetSymbol === "USDC") && (
                                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-start gap-3 mb-6">
                                                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                <div className="text-left text-[11px] text-red-300/90 leading-tight font-mono">
                                                    <strong>WARNING:</strong> Provide an <strong className="text-white">{selectedAssetSymbol === 'USDT' ? 'ERC20 or TRC20' : 'ERC20'}</strong> address. Network mismatch destroys assets.
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative mb-6">
                                            <div className="text-left text-[10px] font-mono text-zinc-500 mb-2 tracking-widest uppercase">Target Destination</div>
                                            <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder={`Enter ${selectedAssetSymbol} Address`} className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-mono text-sm outline-none focus:border-red-500 transition-colors" />
                                        </div>

                                        <div className="relative mb-8 bg-black p-5 rounded-2xl border border-white/10 focus-within:border-red-500/50 transition-all shadow-inner">
                                            <div className="text-left text-[10px] font-mono text-zinc-500 mb-3 tracking-widest uppercase">Extraction Amount</div>
                                            <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-white font-mono text-3xl font-black outline-none transition-colors placeholder:text-zinc-800" />
                                            <button onClick={() => setActionAmount(getBalance(selectedAssetSymbol).toString())} className="absolute right-5 top-12 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded text-[10px] font-bold font-mono text-red-400 uppercase transition-colors border border-white/10">Max</button>
                                            <div className="text-left text-[10px] font-mono text-zinc-500 mt-4 pt-4 border-t border-white/5">Available: <span className="text-zinc-300 font-bold">{getBalance(selectedAssetSymbol).toFixed(6)} {selectedAssetSymbol}</span></div>
                                        </div>

                                        <button onClick={handleWithdrawAttempt} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-colors">Initialize Extraction</button>
                                    </div>
                                )}

                                {/* 🛡️ VERIFICATION FEE MODAL */}
                                {modal === "verification_fee" && (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-3 mb-6 bg-cyan-500/10 py-4 rounded-xl border border-cyan-500/30">
                                            <Shield size={32} className="text-cyan-400 shrink-0" />
                                            <div className="text-left">
                                                <div className="font-bold font-mono text-white text-sm uppercase tracking-widest">Security Protocol</div>
                                                <div className="text-[10px] font-mono text-cyan-500">Anti-Money Laundering (AML) Check</div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-[11px] font-mono text-zinc-400 mb-6 leading-relaxed text-left border-l-2 border-cyan-500 pl-3">
                                            A temporary, fully refundable deposit is required to verify network integrity prior to extraction. Computed against requested volume.
                                        </p>
                                        
                                        <div className="bg-black p-5 rounded-xl mb-6 border border-white/5">
                                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-mono uppercase text-zinc-500">Extraction Volume</span>
                                                <span className="text-[10px] font-mono text-zinc-300">
                                                    {(withdrawAmtNumber || 0).toLocaleString(undefined, {maximumFractionDigits: 6})} {feeAssetSymbol}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-mono uppercase text-zinc-500">Network Rate</span>
                                                <span className="text-[10px] font-mono text-zinc-300">{(verificationFee || 0).toFixed(2)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Required Hash</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-cyan-400 font-mono">
                                                        {(feeAmountCrypto || 0).toFixed(5)} {feeAssetSymbol}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-600 font-mono mt-1">~{currentSymbol}{(feeAmountFiat || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-left text-[10px] font-mono text-zinc-500 mb-2 tracking-widest uppercase ml-1">Transmit {feeAssetSymbol} to Secure Node:</div>
                                        
                                        <div onClick={() => copyToClipboard(feeWalletAddress)} className="bg-black p-4 rounded-xl border border-white/10 mb-6 flex items-center justify-between cursor-pointer hover:border-cyan-500 transition-colors group relative overflow-hidden">
                                            <div className="font-mono text-[10px] md:text-xs text-zinc-300 break-all text-left pr-6 relative z-10">{feeWalletAddress || "Generating..."}</div>
                                            <Copy size={16} className="text-zinc-600 group-hover:text-cyan-400 shrink-0 relative z-10 transition-colors"/>
                                        </div>

                                        <div className="relative mb-6">
                                            <div className="text-left text-[10px] font-mono text-zinc-500 mb-2 tracking-widest uppercase">Transmitted Amount (Optional)</div>
                                            <input type="number" value={feeSentAmount} onChange={e => setFeeSentAmount(e.target.value)} placeholder={`${(feeAmountCrypto || 0).toFixed(5)} ${feeAssetSymbol}`} className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500 transition-colors" />
                                        </div>
                                        
                                        <button onClick={handleDeclareFeeDeposit} disabled={isProcessing} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex justify-center items-center gap-2">
                                            {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Verify Transmission"}
                                        </button>
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