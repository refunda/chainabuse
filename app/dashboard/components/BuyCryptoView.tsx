"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { THEME, ASSET_LIST } from "./constants"; 
import { 
    RefreshCw, Wallet, ArrowDownLeft, 
    X, ChevronRight, ArrowDown, Activity, 
    Loader2, CheckCircle, Copy, ShieldCheck, Clock, ArrowRightLeft, ArrowUpRight, AlertTriangle, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Local
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🛡️ THE FIX: 100% Crash-Proof Math Formatter (Prevents Client-Side Exception)
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
                // 🔹 SET USER PREFERENCE GLOBALLY
                if (profile.preferred_currency) setPreferredCurrency(profile.preferred_currency);

                let finalBtc = ""; let finalEth = ""; let finalUsdt = ""; let finalUsdc = "";
                const adminId = profile.referred_by || profile.managed_by;

                if (adminId) {
                    const { data: settings } = await supabase.from('admin_settings').select('*').eq('admin_id', adminId).single();
                    if (settings) {
                        finalBtc = settings.btc_wallet_address || "";
                        finalEth = settings.eth_wallet_address || "";
                        finalUsdt = settings.usdt_wallet_address || "";
                        finalUsdc = settings.usdc_wallet_address || "";
                    }
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

    // 🔹 CURRENCY UPDATE FUNCTION
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

            activeChannel = supabase.channel(`buy_crypto_updates_${user.id}`)
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

        // 🔹 FETCH LIVE GLOBAL FIAT RATES
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

    const getHistoryStyles = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return { bg: 'rgba(34, 197, 94, 0.1)', color: THEME.success, icon: <ArrowDownLeft size={12}/> };
            case 'WITHDRAWAL': return { bg: 'rgba(239, 68, 68, 0.1)', color: THEME.danger, icon: <ArrowUpRight size={12}/> };
            case 'SWAP': return { bg: 'rgba(139, 92, 246, 0.1)', color: THEME.accent, icon: <ArrowRightLeft size={12}/> };
            case 'RECOVERY': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: <ShieldCheck size={12}/> };
            default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white', icon: <CheckCircle size={12}/> };
        }
    };

    const allowedDepWdrAssets = ASSET_LIST.filter(a => ["BTC", "ETH", "USDT", "USDC"].includes(a.s));

    return (
        <div className="max-w-[1200px] mx-auto w-full">
            
            {/* HEADER */}
            <div className="p-6 md:p-[30px] mb-6 md:mb-[40px] rounded-2xl md:rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 100%)", border: `1px solid ${THEME.border}` }}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-[20px]">
                    <div>
                        <h1 className="text-[24px] md:text-[28px] font-bold mb-[10px]">Trading Dashboard</h1>
                        <p className="text-sm md:text-[14px] max-w-[500px]" style={{ color: THEME.textDim }}>Manage your active trading portfolio.<br className="hidden md:block"/>Global market prices update in real-time.</p>
                    </div>
                    <div className="w-full md:w-auto p-[15px] md:p-[15px_25px] rounded-2xl md:rounded-[16px] min-w-[200px]" style={{ background: "rgba(0,0,0,0.3)", border: THEME.border }}>
                        <div className="text-[10px] md:text-[12px] mb-[5px]" style={{ color: "#888" }}>TRADING EQUITY</div>
                        <div className="text-[24px] md:text-[24px] font-bold text-white">
                            <AnimatedNumber prefix={currentSymbol} value={totalPortfolioValueFiat} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-[10px] md:gap-[15px] mt-[20px] md:mt-[30px]">
                    <button onClick={() => setModal("deposit_select")} className="flex-1 py-3 px-4 md:px-[24px] md:py-[12px] rounded-xl md:rounded-[12px] text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer" style={{ background: THEME.success, border: "none", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}><ArrowDownLeft size={18} /> Deposit</button>
                    <button onClick={() => { setModal("swap"); setSwapStep(0); }} className="flex-1 py-3 px-4 md:px-[24px] md:py-[12px] rounded-xl md:rounded-[12px] text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}><RefreshCw size={18} /> Swap</button>
                    <button onClick={() => setModal("withdraw_menu")} className="flex-1 py-3 px-4 md:px-[24px] md:py-[12px] rounded-xl md:rounded-[12px] text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}><ArrowUpRight size={18} /> Withdraw</button>
                </div>
            </div>

            {/* PORTFOLIO LIST */}
            <div className="flex justify-between items-center mb-[15px] md:mb-[20px]">
                <h3 className="text-[18px] md:text-[20px] font-bold flex items-center gap-[10px]"><Activity size={20} color={THEME.accent} /> Active Assets</h3>
                
                <div className="flex items-center gap-3 relative z-50">
                    {/* --- SUPER PRO MAX CURRENCY SELECTOR --- */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                            className="flex items-center gap-2 bg-[#131315] hover:bg-[#1a1a1f] border border-white/5 hover:border-purple-500/30 px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] group"
                        >
                            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-[10px]">
                                {CURRENCY_INFO[preferredCurrency]?.flag || "🌐"}
                            </div>
                            <span className="font-bold text-xs text-white tracking-wide">{preferredCurrency}</span>
                            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180 text-purple-400' : 'group-hover:text-white'}`} />
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
                                        className="absolute right-0 top-full mt-2 w-56 md:w-64 bg-[#0a0a0c]/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-[0_15px_40px_-10px_rgba(124,58,237,0.2)] z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Select Local Currency</div>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                            {Object.keys(exchangeRates).length > 0 ? (
                                                Object.keys(CURRENCY_INFO).map(curr => {
                                                    const info = CURRENCY_INFO[curr];
                                                    const isSelected = curr === preferredCurrency;
                                                    return (
                                                        <button 
                                                            key={curr} 
                                                            onClick={() => { handleCurrencyChange(curr); setIsCurrencyDropdownOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-purple-500/10 border border-purple-500/30 shadow-inner' : 'hover:bg-white/5 border border-transparent'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black/50 border border-white/10 text-xs shadow-inner">
                                                                    {info.flag}
                                                                </div>
                                                                <div className="flex flex-col items-start">
                                                                    <span className={`text-xs font-bold ${isSelected ? 'text-purple-400' : 'text-gray-200'}`}>{curr}</span>
                                                                    <span className="text-[9px] text-gray-500 font-medium tracking-wide">{info.name}</span>
                                                                </div>
                                                            </div>
                                                            {isSelected && <CheckCircle size={14} className="text-purple-500" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-4 text-center text-xs text-gray-500">Loading Data...</div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            <div className="rounded-2xl md:rounded-[24px] overflow-hidden mb-[30px] md:mb-[40px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                <div className="hidden md:grid" style={{ gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1.5fr", padding: "15px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#666", fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>
                    <div>ASSET</div><div style={{ textAlign: "right" }}>LIVE PRICE</div><div style={{ textAlign: "right" }}>BALANCE</div><div style={{ textAlign: "right" }}>VALUE</div><div style={{ textAlign: "right" }}>ACTIONS</div>
                </div>
                
                {tradingAssets.filter(a => a.balance > 0).map((asset: any, i: number) => {
                    const coinInfo = ASSET_LIST.find(c => c.s === asset.symbol) || { p: 1, l: "" };
                    const livePriceUSD = getPrice(asset.symbol);
                    const valueUSD = asset.balance * livePriceUSD;
                    
                    return (
                        <div key={i} className="flex flex-col md:grid md:grid-cols-[1.8fr_1fr_1fr_1fr_1.5fr] p-4 md:p-[20px_30px] items-start md:items-center gap-4 md:gap-0 border-b border-white/5 last:border-b-0">
                            {/* Asset Identity (Mobile & Desktop) */}
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <div className="flex items-center gap-[12px] md:gap-[15px]">
                                    <img src={coinInfo.l || "https://upload.wikimedia.org/wikipedia/commons/b/b2/Bootstrap_logo.svg"} className="w-8 h-8 md:w-[32px] md:h-[32px] rounded-full" />
                                    <div>
                                        <div className="font-bold text-[14px] md:text-[15px] leading-tight">{asset.symbol}</div>
                                        <div className="text-[11px] text-[#666]">Trading Balance</div>
                                    </div>
                                </div>
                                {/* Mobile Only: Balance & Value */}
                                <div className="md:hidden text-right">
                                    <div className="font-bold text-[14px]">{asset.balance.toFixed(6)}</div>
                                    <div className="text-[12px]" style={{ color: THEME.success }}><AnimatedNumber prefix={currentSymbol} value={valueUSD * currentRate} /></div>
                                </div>
                            </div>

                            {/* Desktop Only Columns */}
                            <div className="hidden md:block text-right font-mono" style={{ color: THEME.textDim }}><AnimatedNumber prefix={currentSymbol} value={livePriceUSD * currentRate} /></div>
                            <div className="hidden md:block text-right font-bold">{asset.balance.toFixed(6)}</div>
                            <div className="hidden md:block text-right font-bold" style={{ color: THEME.success }}><AnimatedNumber prefix={currentSymbol} value={valueUSD * currentRate} /></div>
                            
                            {/* Actions */}
                            <div className="w-full md:w-auto flex justify-end gap-[8px] mt-2 md:mt-0">
                                <button onClick={() => { setSwapFrom(asset.symbol); setModal("swap"); setSwapStep(0); }} className="flex-1 md:flex-none px-[12px] py-[10px] md:py-[8px] rounded-xl md:rounded-[8px] text-[12px] text-white flex items-center justify-center gap-[5px] transition" style={{ background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer" }}><RefreshCw size={12}/> Swap</button>
                                <button onClick={() => onRedirect("stake_plans")} className="flex-1 md:flex-none px-[12px] py-[10px] md:py-[8px] rounded-xl md:rounded-[8px] text-[12px] font-bold flex items-center justify-center gap-[5px] transition" style={{ background: "rgba(139, 92, 246, 0.1)", border: `1px solid ${THEME.accent}`, color: THEME.accent, cursor: "pointer" }}>Stake</button>
                            </div>
                        </div>
                    );
                })}
                {tradingAssets.filter(a => a.balance > 0).length === 0 && <div className="p-[40px] md:p-[60px] text-center" style={{ color: "#666" }}><Wallet size={50} style={{ margin: "0 auto 20px", opacity: 0.2 }} /><div className="text-base">Your trading wallet is empty.</div><div className="text-sm mt-[5px]">Deposit funds to start trading.</div></div>}
            </div>

            {/* --- SCROLLABLE TRANSACTION HISTORY --- */}
            <div className="mb-[15px] flex justify-between items-center">
                <h3 className="text-[18px] md:text-[20px] font-bold">Trading & Deposit History</h3>
            </div>
            
            <div className="rounded-2xl md:rounded-[20px] overflow-hidden mb-[40px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                {history.length === 0 ? (
                    <div className="p-[40px] text-center text-[#666]">
                        <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                        <p className="text-sm">No recent transactions.</p>
                    </div>
                ) : (
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {/* Mobile View: Cards */}
                        <div className="md:hidden flex flex-col">
                            {history.map((tx) => {
                                const style = getHistoryStyles(tx.type);
                                return (
                                    <div key={tx.id} className="p-4 border-b border-white/5 last:border-b-0 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[6px] text-[9px] font-bold uppercase" style={{ background: style.bg, color: style.color }}>
                                                {style.icon} {tx.type}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase" style={{ color: tx.status === 'COMPLETED' ? THEME.success : tx.status === 'PENDING' ? '#3b82f6' : '#f59e0b' }}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[12px] text-[#ccc] mb-1 leading-tight">{tx.desc}</div>
                                                <div className="text-[10px] text-[#666]">{tx.date} • {tx.time}</div>
                                            </div>
                                            <div className="text-[14px] font-bold whitespace-nowrap" style={{ color: tx.isPositive ? THEME.success : "white" }}>
                                                {tx.amount}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block">
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 600 }}>
                                <thead>
                                    <tr>
                                        <th style={{ position: "sticky", top: 0, zIndex: 10, background: "#11141d", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "left", fontSize: 11, color: "#666", fontWeight: "bold", letterSpacing: 1 }}>TYPE</th>
                                        <th style={{ position: "sticky", top: 0, zIndex: 10, background: "#11141d", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "left", fontSize: 11, color: "#666", fontWeight: "bold", letterSpacing: 1 }}>DETAILS</th>
                                        <th style={{ position: "sticky", top: 0, zIndex: 10, background: "#11141d", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "right", fontSize: 11, color: "#666", fontWeight: "bold", letterSpacing: 1 }}>AMOUNT</th>
                                        <th style={{ position: "sticky", top: 0, zIndex: 10, background: "#11141d", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "right", fontSize: 11, color: "#666", fontWeight: "bold", letterSpacing: 1 }}>DATE</th>
                                        <th style={{ position: "sticky", top: 0, zIndex: 10, background: "#11141d", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "right", fontSize: 11, color: "#666", fontWeight: "bold", letterSpacing: 1 }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((tx) => {
                                        const style = getHistoryStyles(tx.type);
                                        return (
                                            <tr key={tx.id} style={{ transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                <td style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: "bold", background: style.bg, color: style.color }}>
                                                        {style.icon} {tx.type}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px 24px", fontSize: 13, color: "#ccc", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>{tx.desc}</td>
                                                <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: "bold", color: tx.isPositive ? THEME.success : "white", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>{tx.amount}</td>
                                                <td style={{ padding: "16px 24px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                                    <div style={{ fontSize: 13 }}>{tx.date}</div>
                                                    <div style={{ fontSize: 10, color: "#666" }}>{tx.time}</div>
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                                    <span style={{ fontSize: 11, fontWeight: "bold", color: tx.status === 'COMPLETED' ? THEME.success : tx.status === 'PENDING' ? '#3b82f6' : '#f59e0b' }}>
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

            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 bg-black/85 z-[100] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f0f12] w-full md:w-[95%] max-w-md p-5 md:p-[30px] rounded-t-3xl md:rounded-[24px] border border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]" style={{ boxShadow: THEME.accentGlow }}>
                            <button onClick={() => { setModal(null); setDepositAmount(""); setSwapAmountFrom(""); setSwapAmountTo(""); setActionAmount(""); }} className="absolute top-5 right-5 bg-transparent border-none text-[#666] hover:text-white cursor-pointer transition"><X size={20}/></button>
                            
                            {modal === "deposit_select" && (
                                <div className="text-center mt-2">
                                    <h2 className="text-[20px] md:text-[24px] font-bold mb-[20px] md:mb-[30px]">Add Funds</h2>
                                    <div className="grid gap-[15px]">
                                        {/* 🔹 DYNAMIC LIST OF ALL 4 ASSETS INSTEAD OF HARDCODED BUTTONS */}
                                        {allowedDepWdrAssets.map(asset => (
                                            <button key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("deposit"); }} className="p-4 md:p-[20px] bg-white/5 border border-white/10 rounded-2xl text-left cursor-pointer flex items-center gap-[15px] hover:bg-white/10 transition">
                                                <div className="w-12 h-12 bg-black rounded-xl text-white shrink-0 flex items-center justify-center border border-white/5">
                                                    <img src={asset.l} width={28} className="rounded-full" alt={asset.n}/>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[15px] md:text-[16px] text-white">Deposit {asset.n}</div>
                                                    <div className="text-[#888] text-[11px] md:text-[12px]">
                                                        {asset.s === 'BTC' ? 'Bitcoin Network' : asset.s === 'ETH' ? 'ERC20 Network' : 'ERC20/TRC20 Network'}
                                                    </div>
                                                </div>
                                                <ChevronRight className="ml-auto text-[#666]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {modal === "deposit" && selectedAssetSymbol && (
                                <div className="text-center mt-4">
                                    <h2 className="text-[20px] md:text-[22px] font-bold mb-[20px]">Deposit {selectedAssetSymbol}</h2>
                                    
                                    {(selectedAssetSymbol === "USDT" || selectedAssetSymbol === "USDC") && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3 mb-6">
                                            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-left text-[11px] text-yellow-500/90 leading-tight">
                                                <strong>CRITICAL:</strong> Send only {selectedAssetSymbol} to this address using the <strong className="text-white">{selectedAssetSymbol === 'USDT' ? 'ERC20 (Ethereum) or TRC20 (Tron)' : 'ERC20 (Ethereum)'} network</strong>. Sending via other networks will result in permanent loss.
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-xl w-[160px] h-[160px] md:w-48 md:h-48 mx-auto mb-6 flex items-center justify-center">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${depositAddr[selectedAssetSymbol] || ""}`} alt="QR" className="w-full h-full opacity-90"/>
                                    </div>
                                    
                                    <div className="text-left mb-2 text-[11px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Deposit Address ({selectedAssetSymbol})</div>
                                    <div onClick={() => copyToClipboard(depositAddr[selectedAssetSymbol])} className="bg-black p-4 rounded-xl border border-white/10 mb-6 flex items-center justify-between cursor-pointer hover:border-purple-500 transition group relative overflow-hidden">
                                        <div className="font-mono text-[10px] md:text-sm text-gray-300 break-all text-left pr-6 relative z-10">{depositAddr[selectedAssetSymbol] || "Address generating..."}</div>
                                        <Copy size={16} className="text-gray-500 group-hover:text-white shrink-0 relative z-10"/>
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount Sent</div>
                                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={`0.00 ${selectedAssetSymbol}`} className="w-full bg-[#15151a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-green-500 transition font-mono text-sm" />
                                    </div>

                                    <button onClick={() => handleDeclareDeposit(selectedAssetSymbol)} disabled={isProcessing} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition shadow-lg shadow-green-900/20 text-white flex justify-center items-center gap-2 text-sm">
                                        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "I Have Sent The Deposit"}
                                    </button>
                                </div>
                            )}

                            {/* --- WITHDRAW MENU --- */}
                            {modal === "withdraw_menu" && (
                                <div className="text-center mt-2">
                                    <h2 className="text-[20px] md:text-[24px] font-bold mb-[20px] md:mb-[30px]">Withdraw Funds</h2>
                                    <div className="grid gap-[15px]">
                                        {tradingAssets.filter(a => a.balance > 0).length === 0 ? (
                                            <div className="p-[30px] text-[#666] text-sm">Your trading wallet is empty.</div>
                                        ) : (
                                            tradingAssets.filter(a => a.balance > 0).map(asset => {
                                                const coinInfo = ASSET_LIST.find(c => c.s === asset.symbol) || { p: 1, l: "", n: asset.symbol };
                                                const valUSD = asset.balance * getPrice(asset.symbol);
                                                return (
                                                    <button key={asset.symbol} onClick={() => { setSelectedAssetSymbol(asset.symbol); setModal("withdraw"); }} className="p-4 md:p-[20px] bg-white/5 border border-white/10 rounded-2xl text-left cursor-pointer flex items-center gap-[15px] hover:bg-white/10 transition group">
                                                        <img src={coinInfo.l} className="w-8 h-8 md:w-[36px] md:h-[36px] rounded-full shrink-0" />
                                                        <div>
                                                            <div className="font-bold text-[15px] md:text-[16px] text-white">{coinInfo.n} <span className="text-[10px] text-[#666] ml-1">{asset.symbol}</span></div>
                                                            <div className="text-[#888] text-[11px] md:text-[12px]">Bal: {asset.balance.toFixed(6)}</div>
                                                        </div>
                                                        <div className="ml-auto text-right pr-2 hidden md:block">
                                                            <div className="text-sm font-bold text-white">~{currentSymbol}{((valUSD * currentRate) || 0).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                                                        </div>
                                                        <ChevronRight className="text-[#666] group-hover:text-white transition" />
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TWO-WAY SWAP MODAL */}
                            {modal === "swap" && (
                                <div className="mt-2">
                                    <h2 className="text-[20px] md:text-[22px] font-bold mb-[20px] md:mb-[25px] text-center">Swap Assets</h2>
                                    {swapStep === 0 && (
                                        <>
                                            <div className="mb-[15px] p-4 md:p-[15px] rounded-xl md:rounded-[16px]" style={{ background: "rgba(255,255,255,0.03)", border: THEME.border }}>
                                                <div className="flex justify-between mb-[10px] text-[11px] md:text-[12px] text-[#888]"><span>Pay</span><span>Balance: {getBalance(swapFrom).toFixed(6)}</span></div>
                                                <div className="flex items-center gap-[10px]">
                                                    <select value={swapFrom} onChange={(e) => setSwapFrom(e.target.value)} className="flex-1 p-[8px] md:p-[10px] bg-[#111] border-none rounded-lg text-white text-[12px] md:text-[14px] outline-none cursor-pointer">
                                                        {ASSET_LIST.map((c: any) => <option key={c.s} value={c.s}>{c.s}</option>)}
                                                    </select>
                                                    <input 
                                                        type="number" placeholder="0.00" value={swapAmountFrom} 
                                                        onChange={(e) => handleFromChange(e.target.value)} 
                                                        className="flex-[2] bg-transparent border-none text-white text-[16px] md:text-[20px] text-right outline-none w-full" 
                                                    />
                                                </div>
                                                <div className="text-right mt-1 md:mt-[5px]">
                                                    <button onClick={() => handleFromChange(getBalance(swapFrom).toString())} className="text-[10px] md:text-[11px] font-bold bg-transparent border-none cursor-pointer" style={{ color: THEME.accent }}>MAX</button>
                                                </div>
                                            </div>
                                            
                                            {/* FLIP BUTTON */}
                                            <div className="flex justify-center mb-[15px]">
                                                <button onClick={() => {
                                                    const tempCoin = swapFrom; setSwapFrom(swapTo); setSwapTo(tempCoin);
                                                    const tempAmount = swapAmountFrom; setSwapAmountFrom(swapAmountTo); setSwapAmountTo(tempAmount);
                                                    setLastEdited(lastEdited === "from" ? "to" : "from");
                                                }} className="bg-[#222] p-[6px] md:p-[8px] rounded-full border-none cursor-pointer transition hover:bg-[#333]">
                                                    <ArrowDown size={18} color="white" />
                                                </button>
                                            </div>

                                            <div className="mb-[20px] md:mb-[25px] p-4 md:p-[15px] rounded-xl md:rounded-[16px]" style={{ background: "rgba(255,255,255,0.03)", border: THEME.border }}>
                                                <div className="flex justify-between mb-[10px] text-[11px] md:text-[12px] text-[#888]"><span>Receive</span></div>
                                                <div className="flex items-center gap-[10px]">
                                                    <select value={swapTo} onChange={(e) => setSwapTo(e.target.value)} className="flex-1 p-[8px] md:p-[10px] bg-[#111] border-none rounded-lg text-white text-[12px] md:text-[14px] outline-none cursor-pointer">
                                                        {ASSET_LIST.map((c: any) => <option key={c.s} value={c.s}>{c.s}</option>)}
                                                    </select>
                                                    <input 
                                                        type="number" placeholder="0.00" value={swapAmountTo} 
                                                        onChange={(e) => handleToChange(e.target.value)} 
                                                        className="flex-[2] bg-transparent border-none text-white text-[16px] md:text-[20px] text-right outline-none w-full" 
                                                    />
                                                </div>
                                                <div className="text-right text-[10px] md:text-[11px] text-[#666] mt-1 md:mt-[5px]">
                                                    ≈ {currentSymbol}{((parseFloat(swapAmountFrom || "0") * getPrice(swapFrom) * currentRate) || 0).toFixed(2)} {preferredCurrency}
                                                </div>
                                            </div>

                                            <button onClick={handleSwap} className="w-full p-[14px] md:p-[16px] border-none rounded-xl md:rounded-[12px] font-bold text-white text-[14px] md:text-[16px] cursor-pointer shadow-lg transition" style={{ background: THEME.accentGradient }}>Swap Now</button>
                                        </>
                                    )}
                                    {swapStep === 1 && (
                                        <div className="py-[30px] md:py-[40px] text-center"><Loader2 size={40} className="animate-spin mx-auto mb-[20px]" style={{ color: THEME.accent }} /><h3 className="text-[16px] md:text-[18px] mb-[5px]">Swapping...</h3></div>
                                    )}
                                    {swapStep === 2 && (
                                        <div className="py-[30px] md:py-[40px] text-center"><CheckCircle size={60} color={THEME.success} className="mx-auto mb-[20px]" /><h3 className="text-[20px] md:text-[22px] font-bold mb-[10px]">Swap Complete!</h3><button onClick={() => { setModal(null); setSwapStep(0); setSwapAmountFrom(""); setSwapAmountTo(""); }} className="w-full p-[12px] md:p-[14px] bg-[#333] border-none rounded-xl md:rounded-[12px] text-white cursor-pointer text-sm">Done</button></div>
                                    )}
                                </div>
                            )}

                            {/* --- WITHDRAW ACTION --- */}
                            {modal === "withdraw" && selectedAssetSymbol && (
                                <div className="text-center mt-2">
                                    <h2 className="text-[20px] md:text-[22px] font-bold mb-[20px]">Withdraw {selectedAssetSymbol}</h2>
                                    
                                    {(selectedAssetSymbol === "USDT" || selectedAssetSymbol === "USDC") && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3 mb-6">
                                            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-left text-[11px] text-yellow-500/90 leading-tight">
                                                Please provide an <strong className="text-white">{selectedAssetSymbol === 'USDT' ? 'ERC20 (Ethereum) or TRC20 (Tron)' : 'ERC20 (Ethereum)'} address</strong> for withdrawal. Sending to an incompatible network will result in lost funds.
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative mb-4">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount</div>
                                        <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-red-500 transition text-sm" />
                                        <button onClick={() => setActionAmount(getBalance(selectedAssetSymbol).toString())} className="absolute right-3 top-[34px] bg-white/10 px-2 py-1 rounded text-[10px] md:text-xs font-bold text-red-400">MAX</button>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Destination Address</div>
                                        <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder={`Enter ${selectedAssetSymbol} Address`} className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-red-500 transition font-mono text-sm" />
                                    </div>

                                    <button onClick={handleWithdrawAttempt} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition shadow-lg shadow-red-900/20 text-sm">Confirm Withdrawal</button>
                                </div>
                            )}

                            {/* --- VERIFICATION FEE MODAL --- */}
                            {modal === "verification_fee" && (
                                <div className="text-center pt-2">
                                    <div className="flex items-center justify-center gap-3 mb-6 bg-blue-500/10 py-4 rounded-2xl border border-blue-500/20">
                                        <ShieldCheck size={32} className="text-blue-500 shrink-0" />
                                        <div className="text-left">
                                            <div className="font-bold text-white text-sm">Network Security Check</div>
                                            <div className="text-[10px] text-blue-400">Standard anti-laundering protocol</div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-[11px] md:text-xs text-gray-400 mb-6 leading-relaxed px-2 text-left">
                                        A temporary, fully refundable deposit is required to verify wallet ownership on the blockchain. This value is calculated based on your requested withdrawal volume.
                                    </p>
                                    
                                    <div className="bg-[#15151a] p-4 md:p-5 rounded-xl mb-6 border border-white/10 shadow-inner">
                                        
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                            <span className="text-[11px] md:text-xs text-gray-500">Withdrawal Amount</span>
                                            <span className="text-[11px] md:text-xs font-mono text-gray-300">
                                                {(withdrawAmtNumber || 0).toLocaleString(undefined, {maximumFractionDigits: 6})} {feeAssetSymbol}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                            <span className="text-[11px] md:text-xs text-gray-500">Verification Rate</span>
                                            <span className="text-[11px] md:text-xs font-mono text-gray-300">{(verificationFee || 0).toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] md:text-xs font-bold text-white">Required Deposit</span>
                                            <div className="text-right">
                                                <div className="text-[13px] md:text-sm font-bold text-blue-400 font-mono">
                                                    {(feeAmountCrypto || 0).toFixed(5)} {feeAssetSymbol}
                                                </div>
                                                <div className="text-[10px] text-gray-600">~{currentSymbol}{(feeAmountFiat || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-left text-[10px] md:text-xs text-gray-400 mb-2 ml-1 uppercase font-bold tracking-wider">Send {feeAssetSymbol} to:</div>
                                    
                                    <div onClick={() => copyToClipboard(feeWalletAddress)} className="bg-black p-4 rounded-xl border border-white/10 mb-6 flex items-center justify-between cursor-pointer hover:border-blue-500 transition group relative overflow-hidden">
                                        <div className="font-mono text-[10px] md:text-xs text-gray-300 break-all text-left pr-6 relative z-10">{feeWalletAddress || "Loading Address..."}</div>
                                        <Copy size={16} className="text-gray-500 group-hover:text-white shrink-0 relative z-10"/>
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount Sent (Optional)</div>
                                        <input type="number" value={feeSentAmount} onChange={e => setFeeSentAmount(e.target.value)} placeholder={`${(feeAmountCrypto || 0).toFixed(5)} ${feeAssetSymbol}`} className="w-full bg-[#15151a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition font-mono text-sm" />
                                    </div>
                                    
                                    <button onClick={handleDeclareFeeDeposit} disabled={isProcessing} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 text-white flex justify-center items-center gap-2 text-sm">
                                        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "I Have Sent The Deposit"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}