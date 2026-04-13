"use client";
import React, { useState, useEffect } from "react";
import { 
    Users, ShieldCheck, Lock, Settings, Database, Wallet, 
    Percent, Save, Loader2, X, Info, RefreshCw, Eye, ChevronDown, ChevronUp,
    Globe, AlertOctagon, Trash2, ShieldAlert, Key, CheckCircle
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RECOVERY_COINS = ["BTC", "ETH", "USDT", "USDC", "SOL", "AVAX", "XRP", "BNB", "TRX", "SHIB"];

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

const DASHBOARD_CURRENCIES = Object.keys(CURRENCY_INFO);

const getCryptoLogo = (symbol: string) => {
    const map: Record<string, string> = {
        BTC: "https://assets.coincap.io/assets/icons/btc@2x.png",
        ETH: "https://assets.coincap.io/assets/icons/eth@2x.png",
        USDT: "https://assets.coincap.io/assets/icons/usdt@2x.png",
        USDC: "https://assets.coincap.io/assets/icons/usdc@2x.png",
        SOL: "https://assets.coincap.io/assets/icons/sol@2x.png",
        AVAX: "https://assets.coincap.io/assets/icons/avax@2x.png",
        XRP: "https://assets.coincap.io/assets/icons/xrp@2x.png",
        BNB: "https://assets.coincap.io/assets/icons/bnb@2x.png",
        TRX: "https://assets.coincap.io/assets/icons/trx@2x.png",
        SHIB: "https://assets.coincap.io/assets/icons/shib@2x.png"
    };
    return map[symbol] || "";
};

const AccordionSection = ({ 
    id, title, icon: Icon, colorClass, children, 
    openSection, setOpenSection, refreshing, isLocked, handleRefreshRecovery 
}: any) => (
    // THE FIX: Removed 'overflow-hidden' which was clipping the dropdown menu
    <div className={`bg-[#0a0f18] border border-cyan-900/30 md:border-none md:bg-transparent rounded-xl md:rounded-none mb-3 md:mb-8 transition-colors ${openSection === id ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : ''}`}>
        <button 
            type="button" 
            onClick={() => setOpenSection(openSection === id ? "" : id)}
            className="w-full p-4 flex md:hidden items-center justify-between active:bg-cyan-900/20 transition focus:outline-none"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${colorClass}`}><Icon size={16} /></div>
                <span className="font-bold text-[11px] text-white uppercase tracking-wider">{title}</span>
            </div>
            {openSection === id ? <ChevronUp size={18} className="text-cyan-500"/> : <ChevronDown size={18} className="text-slate-500"/>}
        </button>

        <div className="hidden md:flex items-center justify-between mb-4 border-b border-cyan-900/30 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Icon size={14} className={colorClass.split(' ')[0].replace('bg-', 'text-').replace('/10', '')}/> {title}
            </h4>
            {id === 'recovery' && handleRefreshRecovery && (
                <button 
                    type="button"
                    onClick={handleRefreshRecovery} disabled={refreshing || isLocked}
                    className={`bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]'}`}
                >
                    {isLocked ? <Lock size={12}/> : (refreshing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} />)}
                    {isLocked ? 'Locked' : 'Refresh Data'}
                </button>
            )}
        </div>

        {/* THE FIX: Replaced grid animation with standard visible/hidden to prevent clipping */}
        <div className={`transition-all duration-300 ease-in-out ${openSection === id ? 'block' : 'hidden md:block'}`}>
            <div className="p-4 pt-0 md:p-0 border-t border-cyan-900/30 md:border-none">
                {id === 'recovery' && handleRefreshRecovery && (
                    <button 
                        type="button"
                        onClick={handleRefreshRecovery} disabled={refreshing || isLocked}
                        className={`md:hidden w-full mb-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-2 transition ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'active:bg-cyan-500/20'}`}
                    >
                        {isLocked ? <Lock size={14}/> : (refreshing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />)}
                        {isLocked ? 'Locked' : 'Refresh Data'}
                    </button>
                )}
                <div className="bg-[#050810] rounded-xl md:border border-cyan-900/30 md:p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

export default function ClientManager({ 
    selectedClient, setSelectedClient, handleKycUpdate,
    depositForm, setDepositForm, saveDepositOverrides,
    feeOverride, setFeeOverride, saveFeeOverride,
    saving, isLocked 
}: any) {
    const [localSaving, setLocalSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [kycDocs, setKycDocs] = useState<string[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [openSection, setOpenSection] = useState<string>("kyc"); 

    const [preferredCurrency, setPreferredCurrency] = useState("USD");
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

    const [localRecoveryForm, setLocalRecoveryForm] = useState<any>({});

    const [newPassword, setNewPassword] = useState("");
    const [dangerLoading, setDangerLoading] = useState(false);

    useEffect(() => {
        if (selectedClient) {
            document.body.style.overflow = 'hidden';
            fetchKycDocuments(selectedClient.id);
            setPreferredCurrency(selectedClient.preferred_currency || "USD");
            fetchRecoveryBalances(selectedClient.id);
        } else {
            document.body.style.overflow = 'unset';
            setKycDocs([]);
            setNewPassword("");
            setLocalRecoveryForm({});
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedClient]);

    const fetchRecoveryBalances = async (userId: string) => {
        try {
            const { data, error } = await supabase.from('recovery_allocations').select('coin, amount').eq('user_id', userId);
            if (!error && data) {
                const recMap: any = {};
                data.forEach((r: any) => recMap[r.coin] = r.amount);
                setLocalRecoveryForm(recMap);
            }
        } catch (err) {}
    };

    const fetchKycDocuments = async (userId: string) => {
        setLoadingDocs(true);
        try {
            const { data, error } = await supabase.storage.from('kyc-documents').list('', { search: userId });
            if (!error && data && data.length > 0) {
                const urls = data.map(file => supabase.storage.from('kyc-documents').getPublicUrl(file.name).data.publicUrl);
                setKycDocs(urls);
            } else {
                setKycDocs([]);
            }
        } catch (error) {} 
        finally {
            setLoadingDocs(false);
        }
    };

    if (!selectedClient) return null;

    const saveCurrencyOverride = async () => {
        if (!selectedClient) return;
        await supabase.from('profiles').update({ preferred_currency: preferredCurrency }).eq('id', selectedClient.id);
    };

    // THE FIX: Hard lock to prevent double execution on rapid clicks
    const handleSaveAll = async (e: React.FormEvent) => {
        e.preventDefault(); 
        if (localSaving || saving || isLocked) return; // <-- Hard Lock
        
        setLocalSaving(true);

        try {
            const recoveryUpserts = RECOVERY_COINS.map(coin => ({
                user_id: selectedClient.id,
                coin: coin,
                amount: Number(localRecoveryForm[coin]) || 0
            }));
            if (recoveryUpserts.length > 0) {
                await supabase.from('recovery_allocations').upsert(recoveryUpserts, { onConflict: 'user_id, coin' });
            }
        } catch (err) {}

        await Promise.all([
            saveDepositOverrides(),
            saveFeeOverride(),
            saveCurrencyOverride()
        ]);

        setLocalSaving(false);
        setSelectedClient(null); 
    };

    const executeKycAndClose = async (status: string) => {
        if (isLocked || localSaving) return;
        setLocalSaving(true);
        await handleKycUpdate(status);
        setLocalSaving(false);
        setSelectedClient(null); 
    };

    const handleRefreshRecovery = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLocked || refreshing) return;
        setRefreshing(true);
        try {
            await supabase.from('profiles').update({ is_recovery_claimed: false }).eq('id', selectedClient.id);
            setSelectedClient(null); 
        } catch (error: any) {} 
        finally {
            setRefreshing(false);
        }
    };

    const handleForcePasswordChange = async () => {
        if (!newPassword || newPassword.length < 6) return alert("Password must be at least 6 characters.");
        setDangerLoading(true);
        
        const { error } = await supabase.rpc('admin_change_user_password', { 
            target_user_id: selectedClient.id, 
            new_password: newPassword 
        });

        setDangerLoading(false);
        if (error) {
            alert("Failed to change password. Make sure you ran the SQL script.");
        } else {
            alert(`Password for ${selectedClient.email} changed successfully.`);
            setNewPassword("");
        }
    };

    const handleZeroBalances = async () => {
        const confirm = window.confirm(`Are you sure you want to wipe all balances to 0 for ${selectedClient.email}?`);
        if (!confirm) return;
        
        setDangerLoading(true);
        const { error } = await supabase.rpc('admin_zero_user_balances', { target_user_id: selectedClient.id });
        setDangerLoading(false);
        
        if (error) {
            alert("Failed to zero balances.");
        } else {
            alert("All balances wiped to 0.");
            setSelectedClient(null); 
        }
    };

    const handleDeleteClient = async () => {
        const confirm1 = window.confirm(`WARNING: This will permanently delete ${selectedClient.email} from the system.`);
        if (!confirm1) return;
        const confirm2 = window.prompt(`Type "DELETE" to permanently erase this client.`);
        if (confirm2 !== "DELETE") return;

        setDangerLoading(true);
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: selectedClient.id });
        setDangerLoading(false);

        if (error) {
            alert("Failed to delete user.");
        } else {
            alert("Client permanently deleted.");
            setSelectedClient(null); 
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/95 flex items-end md:items-center justify-center z-50 p-0 md:p-6 backdrop-blur-xl touch-none">
                <motion.div 
                    initial={{scale:0.95, opacity: 0, y: 20}} animate={{scale:1, opacity: 1, y: 0}} exit={{scale:0.95, opacity: 0, y: 20}} 
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-[#050810] md:border border-cyan-900/50 w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-[24px] shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col relative font-sans"
                >
                    <div className="md:hidden flex justify-between items-center p-4 border-b border-cyan-900/50 bg-[#0a0f18] shrink-0">
                        <div className="flex items-center gap-2">
                            <Settings size={18} className="text-cyan-400" />
                            <h3 className="text-white font-bold text-xs uppercase tracking-wider">Manage Client</h3>
                        </div>
                        <button type="button" onClick={() => setSelectedClient(null)} className="p-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl text-cyan-400 transition"><X size={16} /></button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        <div className="w-full md:w-[320px] bg-[#0a0f18] p-5 md:p-8 border-b md:border-b-0 md:border-r border-cyan-900/50 flex flex-col shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>

                            <h3 className="hidden md:block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-8 border-b border-cyan-900/30 pb-3">Client Profile</h3>
                            <div className="flex md:block items-center gap-5 text-left md:text-center relative z-10">
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-[#050810] rounded-2xl md:mx-auto md:mb-5 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
                                    <Users size={28} className="text-cyan-400 md:w-[36px] md:h-[36px]"/>
                                </div>
                                <div className="overflow-hidden">
                                    <h2 className="font-bold text-xl md:text-2xl text-white truncate">{selectedClient.full_name || "Unknown Name"}</h2>
                                    <p className="text-[11px] md:text-xs text-slate-400 mt-1.5 truncate">{selectedClient.email}</p>
                                </div>
                            </div>
                            
                            <div className="hidden md:flex justify-center mt-6 z-10">
                                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                    <Globe size={14}/> Display Currency: {preferredCurrency}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-[#050810] relative">
                            <div className="hidden md:flex p-6 md:p-8 border-b border-cyan-900/30 justify-between items-center shrink-0 bg-[#0a0f18]/50">
                                <h3 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider"><Settings className="text-cyan-400"/> Client Settings</h3>
                                <button type="button" onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-cyan-400 transition bg-cyan-900/20 p-2 rounded-xl border border-cyan-900/50"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 md:p-8 pb-24 md:pb-28"> 
                                
                                <AccordionSection id="kyc" title="Verification Status" icon={ShieldCheck} colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] md:text-xs p-4 rounded-xl mb-5 flex gap-3 uppercase tracking-wider">
                                        <Info size={16} className="flex-shrink-0 text-cyan-400" />
                                        Current Status: <strong className="text-white">{selectedClient.kyc_status || 'Unverified'}</strong>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <button type="button" disabled={isLocked || localSaving} onClick={() => executeKycAndClose('verified')} className={`p-4 rounded-xl border text-[11px] md:text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 uppercase tracking-wider ${selectedClient.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0a0f18] border-cyan-900/50 hover:border-emerald-500 text-slate-400'} ${(isLocked || localSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <ShieldCheck size={18}/> Approve
                                        </button>
                                        <button type="button" disabled={isLocked || localSaving} onClick={() => executeKycAndClose('pending')} className={`p-4 rounded-xl border text-[11px] md:text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 uppercase tracking-wider ${selectedClient.kyc_status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-[#0a0f18] border-cyan-900/50 hover:border-orange-500 text-slate-400'} ${(isLocked || localSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Loader2 size={18}/> Pending
                                        </button>
                                        <button type="button" disabled={isLocked || localSaving} onClick={() => executeKycAndClose('rejected')} className={`p-4 rounded-xl border text-[11px] md:text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 uppercase tracking-wider ${selectedClient.kyc_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-[#0a0f18] border-cyan-900/50 hover:border-red-500 text-slate-400'} ${(isLocked || localSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Lock size={18}/> Reject
                                        </button>
                                    </div>

                                    <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-t border-cyan-900/30 pt-5">
                                        <Eye size={14}/> Uploaded Documents
                                    </h4>
                                    {loadingDocs ? (
                                        <div className="text-center p-6"><Loader2 className="animate-spin mx-auto text-cyan-500" size={24}/></div>
                                    ) : kycDocs.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {kycDocs.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-cyan-900/50 aspect-square bg-[#0a0f18]">
                                                    <img src={url} alt={`KYC Doc ${i+1}`} className="w-full h-full object-cover opacity-80 md:group-hover:opacity-100 transition duration-500 md:group-hover:scale-105" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 bg-[#0a0f18] border border-cyan-900/30 rounded-xl">
                                            <p className="text-[11px] md:text-xs text-slate-500">No documents uploaded.</p>
                                        </div>
                                    )}
                                </AccordionSection>

                                {/* 🟢 RECOVERY BALANCES WITH LOGOS 🟢 */}
                                <AccordionSection id="recovery" title="Recovery Balances" icon={Database} colorClass="text-blue-400 bg-blue-500/10 border-blue-500/30" openSection={openSection} setOpenSection={setOpenSection} refreshing={refreshing} isLocked={isLocked} handleRefreshRecovery={handleRefreshRecovery}>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                        {RECOVERY_COINS.map(coin => (
                                            <div key={coin} className="flex flex-col bg-[#0a0f18] p-3 rounded-xl border border-cyan-900/50 focus-within:border-blue-500/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50 flex items-center justify-center p-0.5">
                                                        <img src={getCryptoLogo(coin)} className="w-full h-full object-cover" alt={coin} onError={(e:any) => e.target.style.display='none'}/>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{coin}</span>
                                                </div>
                                                <input 
                                                    type="number" placeholder="0.00" value={localRecoveryForm[coin] || ""} onChange={e => setLocalRecoveryForm({...localRecoveryForm, [coin]: e.target.value})} disabled={isLocked}
                                                    className="bg-transparent border-none text-sm md:text-base text-white outline-none focus:text-blue-400 transition-colors disabled:opacity-50 h-8"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </AccordionSection>

                                {/* 🟢 WALLETS WITH LOGOS 🟢 */}
                                <AccordionSection id="wallets" title="Wallet Addresses" icon={Wallet} colorClass="text-orange-400 bg-orange-500/10 border-orange-500/30" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] md:text-[11px] font-bold text-orange-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50 flex items-center justify-center p-0.5">
                                                    <img src={getCryptoLogo("BTC")} className="w-full h-full object-cover" alt="BTC" onError={(e:any) => e.target.style.display='none'}/>
                                                </div>
                                                BTC Wallet Address
                                            </label>
                                            <input 
                                                type="text" value={depositForm.btc_address || depositForm.btc || ''} onChange={e => setDepositForm({...depositForm, btc_address: e.target.value, btc: e.target.value})}
                                                placeholder="Leave empty to use Global BTC Wallet..." disabled={isLocked}
                                                className="w-full bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl text-white text-xs md:text-sm focus:border-orange-500 outline-none transition disabled:opacity-50 placeholder:text-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] md:text-[11px] font-bold text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50 flex items-center justify-center p-0.5">
                                                    <img src={getCryptoLogo("ETH")} className="w-full h-full object-cover" alt="ETH" onError={(e:any) => e.target.style.display='none'}/>
                                                </div>
                                                ETH Wallet Address
                                            </label>
                                            <input 
                                                type="text" value={depositForm.eth_address || depositForm.eth || ''} onChange={e => setDepositForm({...depositForm, eth_address: e.target.value, eth: e.target.value})}
                                                placeholder="Leave empty to use Global ETH Wallet..." disabled={isLocked}
                                                className="w-full bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl text-white text-xs md:text-sm focus:border-blue-500 outline-none transition disabled:opacity-50 placeholder:text-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] md:text-[11px] font-bold text-green-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50 flex items-center justify-center p-0.5">
                                                    <img src={getCryptoLogo("USDT")} className="w-full h-full object-cover" alt="USDT" onError={(e:any) => e.target.style.display='none'}/>
                                                </div>
                                                USDT Address (ERC20/TRC20)
                                            </label>
                                            <input 
                                                type="text" value={depositForm.usdt_address || depositForm.usdt || ''} onChange={e => setDepositForm({...depositForm, usdt_address: e.target.value, usdt: e.target.value})}
                                                placeholder="Leave empty to use Global USDT Wallet..." disabled={isLocked}
                                                className="w-full bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl text-white text-xs md:text-sm focus:border-green-500 outline-none transition disabled:opacity-50 placeholder:text-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] md:text-[11px] font-bold text-teal-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50 flex items-center justify-center p-0.5">
                                                    <img src={getCryptoLogo("USDC")} className="w-full h-full object-cover" alt="USDC" onError={(e:any) => e.target.style.display='none'}/>
                                                </div>
                                                USDC Address (ERC20)
                                            </label>
                                            <input 
                                                type="text" value={depositForm.usdc_address || depositForm.usdc || ''} onChange={e => setDepositForm({...depositForm, usdc_address: e.target.value, usdc: e.target.value})}
                                                placeholder="Leave empty to use Global USDC Wallet..." disabled={isLocked}
                                                className="w-full bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl text-white text-xs md:text-sm focus:border-teal-500 outline-none transition disabled:opacity-50 placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>
                                </AccordionSection>

                                <AccordionSection id="fees" title="Platform Fees" icon={Percent} colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div>
                                        <label className="text-[10px] md:text-[11px] font-bold text-emerald-400 mb-2 block uppercase tracking-wider">Client Fee Percentage (%)</label>
                                        <input 
                                            type="number" step="0.01" value={feeOverride} onChange={e => setFeeOverride(e.target.value)} disabled={isLocked}
                                            className="w-full bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl text-white text-sm md:text-base focus:border-emerald-500 outline-none transition disabled:opacity-50" 
                                        />
                                    </div>
                                </AccordionSection>

                                {/* 🟢 THE FIX: CSS Absolute Position Override on Dropdown 🟢 */}
                                <AccordionSection id="currency" title="Display Currency" icon={Globe} colorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/30" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="relative">
                                        <label className="text-[10px] md:text-[11px] font-bold text-indigo-400 mb-2 block uppercase tracking-wider">Dashboard Currency</label>
                                        
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    e.stopPropagation(); 
                                                    if(!isLocked) setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen); 
                                                }}
                                                className={`w-full flex items-center justify-between bg-[#0a0f18] border border-cyan-900/50 p-4 rounded-xl transition-all shadow-md ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 cursor-pointer'}`}
                                            >
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="font-mono text-sm font-bold text-white">{preferredCurrency}</span>
                                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
                                                        {CURRENCY_INFO[preferredCurrency]?.name || "US Dollar"}
                                                    </span>
                                                </div>
                                                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                                            </button>

                                            {/* THE FIX: Forced absolute positioning floating above document flow */}
                                            <AnimatePresence>
                                                {isCurrencyDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[100]" onClick={() => setIsCurrencyDropdownOpen(false)} />
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{ position: 'absolute', zIndex: 9999, top: '100%', left: 0, right: 0 }}
                                                            className="mt-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                                                        >
                                                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1.5">
                                                                {DASHBOARD_CURRENCIES.map((curr: string) => {
                                                                    const info = CURRENCY_INFO[curr];
                                                                    const isSelected = curr === preferredCurrency;
                                                                    return (
                                                                        <button 
                                                                            key={curr} 
                                                                            type="button"
                                                                            onClick={(e) => { 
                                                                                e.preventDefault(); 
                                                                                e.stopPropagation(); 
                                                                                setPreferredCurrency(curr); 
                                                                                setIsCurrencyDropdownOpen(false); 
                                                                            }}
                                                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isSelected ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'}`}
                                                                        >
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="text-xs font-bold font-mono">{curr}</span>
                                                                                <span className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">{info?.name}</span>
                                                                            </div>
                                                                            {isSelected && <CheckCircle size={14} className="drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </AccordionSection>

                                {/* 🟥 ADMIN ACTIONS (DANGER ZONE) 🟥 */}
                                <AccordionSection id="danger" title="Admin Actions" icon={AlertOctagon} colorClass="text-red-400 bg-red-500/10 border-red-500/30" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="space-y-4">
                                        
                                        {/* Change Password */}
                                        <div className="bg-[#0a0f18] border border-red-900/30 p-4 md:p-5 rounded-xl">
                                            <h4 className="text-[11px] md:text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                                <Key size={14}/> Change Client Password
                                            </h4>
                                            <div className="flex flex-col md:flex-row gap-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter new 6+ char password..." 
                                                    value={newPassword} 
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    disabled={dangerLoading || isLocked}
                                                    className="flex-1 bg-black border border-red-900/50 p-3 rounded-lg text-white text-xs md:text-sm focus:border-red-500 outline-none transition disabled:opacity-50 placeholder:text-slate-600"
                                                />
                                                <button 
                                                    type="button" 
                                                    disabled={dangerLoading || isLocked || !newPassword}
                                                    onClick={handleForcePasswordChange}
                                                    className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition disabled:opacity-50"
                                                >
                                                    {dangerLoading ? <Loader2 size={14} className="animate-spin" /> : "Save Password"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Zero Balances */}
                                        <div className="bg-[#0a0f18] border border-red-900/30 p-4 md:p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-[11px] md:text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                                                    <ShieldAlert size={14}/> Zero Out Balances
                                                </h4>
                                                <p className="text-[10px] md:text-[11px] text-slate-500">Sets all client assets, stakes, and recoveries to 0.</p>
                                            </div>
                                            <button 
                                                type="button" 
                                                disabled={dangerLoading || isLocked}
                                                onClick={handleZeroBalances}
                                                className="w-full md:w-auto px-6 py-3 bg-orange-500/10 text-orange-400 border border-orange-500/50 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-orange-500/20 transition disabled:opacity-50"
                                            >
                                                Zero Balances
                                            </button>
                                        </div>

                                        {/* Delete Client */}
                                        <div className="bg-[#0a0f18] border border-red-900/30 p-4 md:p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-[11px] md:text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                                                    <Trash2 size={14}/> Delete Client
                                                </h4>
                                                <p className="text-[10px] md:text-[11px] text-slate-500">Permanently erases the client from the database.</p>
                                            </div>
                                            <button 
                                                type="button" 
                                                disabled={dangerLoading || isLocked}
                                                onClick={handleDeleteClient}
                                                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-red-500 transition disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                            >
                                                Delete Client
                                            </button>
                                        </div>

                                    </div>
                                </AccordionSection>

                                {/* FLOATING SAVE BUTTON */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-cyan-900/50 bg-[#050810]/90 backdrop-blur-md z-20 shrink-0">
                                    <button 
                                        type="submit" disabled={localSaving || saving || isLocked} 
                                        className="w-full h-12 md:h-14 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-3 text-xs md:text-sm active:scale-[0.98] border border-cyan-400/30 disabled:opacity-50 disabled:grayscale"
                                    >
                                        {isLocked ? <Lock size={16} /> : (localSaving || saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />)}
                                        {isLocked ? 'Read Only Mode' : 'Save All Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}