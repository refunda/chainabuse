"use client";
import React, { useState, useEffect } from "react";
import { 
    Users, ShieldCheck, Lock, Settings, Database, Wallet, 
    Percent, Save, Loader2, X, Info, RefreshCw, Eye, ChevronDown, ChevronUp,
    Globe // Added Globe for Currency Icon
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RECOVERY_COINS = ["BTC", "ETH", "USDT", "USDC", "SOL", "AVAX", "XRP", "BNB", "TRX", "SHIB"];

const AccordionSection = ({ 
    id, title, icon: Icon, colorClass, children, 
    openSection, setOpenSection, refreshing, isLocked, handleRefreshRecovery 
}: any) => (
    <div className="bg-[#111] border border-white/5 md:border-none md:bg-transparent rounded-xl md:rounded-none overflow-hidden mb-3 md:mb-8">
        <button 
            type="button" 
            onClick={() => setOpenSection(openSection === id ? "" : id)}
            className="w-full p-4 flex md:hidden items-center justify-between active:bg-white/5 transition focus:outline-none"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}><Icon size={16} /></div>
                <span className="font-bold text-sm text-gray-200 uppercase tracking-widest">{title}</span>
            </div>
            {openSection === id ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
        </button>

        <div className="hidden md:flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Icon size={14} className={colorClass.split(' ')[0]}/> {title}
            </h4>
            {id === 'recovery' && handleRefreshRecovery && (
                <button 
                    type="button"
                    onClick={handleRefreshRecovery} disabled={refreshing || isLocked}
                    className={`bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-purple-500/20'}`}
                >
                    {isLocked ? <Lock size={12}/> : (refreshing ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} />)}
                    {isLocked ? 'LOCKED' : 'Refresh Recovery'}
                </button>
            )}
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openSection === id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:grid-rows-[1fr] md:opacity-100'}`}>
            <div className="overflow-hidden">
                <div className="p-4 pt-0 md:p-0 border-t border-white/5 md:border-none">
                    {id === 'recovery' && handleRefreshRecovery && (
                        <button 
                            type="button"
                            onClick={handleRefreshRecovery} disabled={refreshing || isLocked}
                            className={`md:hidden w-full mb-4 bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex justify-center items-center gap-2 transition ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'active:bg-purple-500/20'}`}
                        >
                            {isLocked ? <Lock size={14}/> : (refreshing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />)}
                            {isLocked ? 'LOCKED' : 'Refresh Recovery Status'}
                        </button>
                    )}
                    <div className="bg-[#131315] rounded-xl md:border border-white/5 md:p-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default function ClientManager({ 
    selectedClient, setSelectedClient, handleKycUpdate,
    recoveryForm, setRecoveryForm, saveRecoveryInjection,
    depositForm, setDepositForm, saveDepositOverrides,
    feeOverride, setFeeOverride, saveFeeOverride,
    saving, isLocked 
}: any) {
    const [localSaving, setLocalSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [kycDocs, setKycDocs] = useState<string[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [openSection, setOpenSection] = useState<string>("kyc"); 

    // --- CURRENCY STATE ---
    const [preferredCurrency, setPreferredCurrency] = useState("USD");
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);

    useEffect(() => {
        if (selectedClient) {
            document.body.style.overflow = 'hidden';
            fetchKycDocuments(selectedClient.id);
            
            // Set current client currency and fetch list
            setPreferredCurrency(selectedClient.preferred_currency || "USD");
            fetchCurrencies();
        } else {
            document.body.style.overflow = 'unset';
            setKycDocs([]);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedClient]);

    const fetchCurrencies = async () => {
        const { data } = await supabase.from('currencies').select('code').order('code');
        if (data) setAvailableCurrencies(data.map(d => d.code));
    };

    const fetchKycDocuments = async (userId: string) => {
        setLoadingDocs(true);
        try {
            const { data, error } = await supabase.storage.from('kyc-documents').list('', { search: userId });
            if (error) throw error;
            if (data && data.length > 0) {
                const urls = data.map(file => supabase.storage.from('kyc-documents').getPublicUrl(file.name).data.publicUrl);
                setKycDocs(urls);
            } else {
                setKycDocs([]);
            }
        } catch (error) {
            console.error("Error fetching KYC docs:", error);
        } finally {
            setLoadingDocs(false);
        }
    };

    if (!selectedClient) return null;

    const saveCurrencyOverride = async () => {
        if (!selectedClient) return;
        await supabase.from('profiles').update({ preferred_currency: preferredCurrency }).eq('id', selectedClient.id);
    };

    const handleSaveAll = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setLocalSaving(true);
        await Promise.all([
            saveRecoveryInjection(),
            saveDepositOverrides(),
            saveFeeOverride(),
            saveCurrencyOverride() // Added Currency Save
        ]);
        setLocalSaving(false);
        setSelectedClient(null); 
    };

    const executeKycAndClose = async (status: string) => {
        if (isLocked) return;
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
        } catch (error: any) {
            console.error("Error refreshing recovery:", error);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-50 p-0 md:p-6 backdrop-blur-md touch-none">
                <motion.div 
                    initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} exit={{scale:0.95, opacity: 0}} 
                    className="bg-[#0f0f11] md:border border-white/10 w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
                >
                    <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10 bg-[#111] shrink-0">
                        <div className="flex items-center gap-2">
                            <Settings size={18} className="text-purple-500" />
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Client Manager</h3>
                        </div>
                        <button type="button" onClick={() => setSelectedClient(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition"><X size={18} /></button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        <div className="w-full md:w-[280px] bg-[#131315] p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
                            <h3 className="hidden md:block text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">User Profile</h3>
                            <div className="flex md:block items-center gap-4 text-left md:text-center">
                                <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-gray-800 to-black rounded-full md:mx-auto md:mb-4 border border-white/10 flex items-center justify-center shrink-0">
                                    <Users size={24} className="text-gray-500 md:w-[30px] md:h-[30px]"/>
                                </div>
                                <div className="overflow-hidden">
                                    <h2 className="font-bold text-lg md:text-xl text-white truncate">{selectedClient.full_name || "Unknown"}</h2>
                                    <p className="text-xs text-gray-500 font-mono mt-1 truncate">{selectedClient.email}</p>
                                </div>
                            </div>
                            
                            {/* ADMIN QUICK VIEW: CLIENT CURRENCY TAG */}
                            <div className="hidden md:flex justify-center mt-4">
                                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe size={12}/> Current Currency: {preferredCurrency}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0c] relative">
                            <div className="hidden md:flex p-6 border-b border-white/5 justify-between items-center shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="text-purple-500"/> Configuration</h3>
                                <button type="button" onClick={() => setSelectedClient(null)} className="text-gray-500 hover:text-white transition"><X size={24}/></button>
                            </div>

                            <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 md:p-6 pb-24 md:pb-20"> 
                                
                                <AccordionSection id="kyc" title="KYC Verification" icon={ShieldCheck} colorClass="text-purple-400 bg-purple-500/10" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="bg-blue-900/10 text-blue-400 text-[10px] md:text-[11px] p-3 rounded-lg mb-4 flex gap-2">
                                        <Info size={14} className="flex-shrink-0" />
                                        Current Status: <strong className="text-white uppercase">{selectedClient.kyc_status || 'none'}</strong>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 mb-4 md:mb-6">
                                        <button type="button" disabled={isLocked} onClick={() => executeKycAndClose('verified')} className={`p-3 rounded-xl border text-[10px] md:text-xs font-bold transition flex items-center justify-center gap-1.5 ${selectedClient.kyc_status === 'verified' ? 'bg-green-500 text-black border-green-500' : 'bg-black border-white/10 active:border-green-500 hover:border-green-500 text-gray-400'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <ShieldCheck size={14}/> VERIFY
                                        </button>
                                        <button type="button" disabled={isLocked} onClick={() => executeKycAndClose('pending')} className={`p-3 rounded-xl border text-[10px] md:text-xs font-bold transition flex items-center justify-center gap-1.5 ${selectedClient.kyc_status === 'pending' ? 'bg-orange-500 text-white border-orange-500' : 'bg-black border-white/10 active:border-orange-500 hover:border-orange-500 text-gray-400'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Loader2 size={14}/> PEND
                                        </button>
                                        <button type="button" disabled={isLocked} onClick={() => executeKycAndClose('rejected')} className={`p-3 rounded-xl border text-[10px] md:text-xs font-bold transition flex items-center justify-center gap-1.5 ${selectedClient.kyc_status === 'rejected' ? 'bg-red-500 text-white border-red-500' : 'bg-black border-white/10 active:border-red-500 hover:border-red-500 text-gray-400'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Lock size={14}/> REJECT
                                        </button>
                                    </div>

                                    <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 border-t border-white/10 pt-4">
                                        <Eye size={14}/> Client Documents
                                    </h4>
                                    {loadingDocs ? (
                                        <div className="text-center p-4"><Loader2 className="animate-spin mx-auto text-gray-500" size={20}/></div>
                                    ) : kycDocs.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {kycDocs.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-white/10 aspect-square bg-black">
                                                    <img src={url} alt={`KYC Doc ${i+1}`} className="w-full h-full object-cover opacity-80 md:group-hover:opacity-100 transition duration-300" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition duration-300">
                                                        <Eye size={20} className="text-white"/>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 bg-black/50 border border-white/5 rounded-lg">
                                            <p className="text-[10px] md:text-xs text-gray-500">No documents uploaded.</p>
                                        </div>
                                    )}
                                </AccordionSection>

                                <AccordionSection id="recovery" title="Recovery Protocol" icon={Database} colorClass="text-blue-400 bg-blue-500/10" openSection={openSection} setOpenSection={setOpenSection} refreshing={refreshing} isLocked={isLocked} handleRefreshRecovery={handleRefreshRecovery}>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                        {RECOVERY_COINS.map(coin => (
                                            <div key={coin} className="flex flex-col bg-black/50 p-2 rounded-lg border border-white/5">
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-500 mb-1">{coin}</span>
                                                <input 
                                                    type="number" placeholder="0.00" value={recoveryForm[coin] || ""} onChange={e => setRecoveryForm({...recoveryForm, [coin]: e.target.value})} disabled={isLocked}
                                                    className="bg-transparent border-none text-xs md:text-sm text-white font-mono outline-none focus:text-purple-400 transition-colors disabled:opacity-50 h-8"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </AccordionSection>

                                <AccordionSection id="wallets" title="Manual Overrides" icon={Wallet} colorClass="text-orange-400 bg-orange-500/10" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] md:text-[10px] font-bold text-orange-400 mb-1.5 block uppercase">BTC Address Override</label>
                                            <input 
                                                type="text" value={depositForm.btc_address || depositForm.btc || ''} onChange={e => setDepositForm({...depositForm, btc_address: e.target.value, btc: e.target.value})}
                                                placeholder="Leave empty to use Global BTC..." disabled={isLocked}
                                                className="w-full bg-black border border-white/10 p-3 h-12 md:h-10 rounded-xl text-white font-mono text-xs md:text-sm focus:border-orange-500 outline-none transition disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] md:text-[10px] font-bold text-blue-400 mb-1.5 block uppercase">ETH Address Override</label>
                                            <input 
                                                type="text" value={depositForm.eth_address || depositForm.eth || ''} onChange={e => setDepositForm({...depositForm, eth_address: e.target.value, eth: e.target.value})}
                                                placeholder="Leave empty to use Global ETH..." disabled={isLocked}
                                                className="w-full bg-black border border-white/10 p-3 h-12 md:h-10 rounded-xl text-white font-mono text-xs md:text-sm focus:border-blue-500 outline-none transition disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] md:text-[10px] font-bold text-green-400 mb-1.5 block uppercase">USDT Address Override (ERC20/TRC20)</label>
                                            <input 
                                                type="text" value={depositForm.usdt_address || depositForm.usdt || ''} onChange={e => setDepositForm({...depositForm, usdt_address: e.target.value, usdt: e.target.value})}
                                                placeholder="Leave empty to use Global USDT..." disabled={isLocked}
                                                className="w-full bg-black border border-white/10 p-3 h-12 md:h-10 rounded-xl text-white font-mono text-xs md:text-sm focus:border-green-500 outline-none transition disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] md:text-[10px] font-bold text-teal-400 mb-1.5 block uppercase">USDC Address Override (ERC20)</label>
                                            <input 
                                                type="text" value={depositForm.usdc_address || depositForm.usdc || ''} onChange={e => setDepositForm({...depositForm, usdc_address: e.target.value, usdc: e.target.value})}
                                                placeholder="Leave empty to use Global USDC..." disabled={isLocked}
                                                className="w-full bg-black border border-white/10 p-3 h-12 md:h-10 rounded-xl text-white font-mono text-xs md:text-sm focus:border-teal-500 outline-none transition disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </AccordionSection>

                                <AccordionSection id="fees" title="Platform Fees" icon={Percent} colorClass="text-green-400 bg-green-500/10" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div>
                                        <label className="text-[9px] md:text-[10px] font-bold text-green-400 mb-1.5 block uppercase">Client Fee Percentage (%)</label>
                                        <input 
                                            type="number" step="0.01" value={feeOverride} onChange={e => setFeeOverride(e.target.value)} disabled={isLocked}
                                            className="w-full bg-black border border-white/10 p-3 h-12 md:h-10 rounded-xl text-white font-mono text-sm md:text-base focus:border-green-500 outline-none transition disabled:opacity-50" 
                                        />
                                    </div>
                                </AccordionSection>

                                {/* 🛡️ THE NEW CURRENCY SECTION - CSS CLIPPING FIXED */}
                                <AccordionSection id="currency" title="Display Currency" icon={Globe} colorClass="text-indigo-400 bg-indigo-500/10" openSection={openSection} setOpenSection={setOpenSection}>
                                    <div>
                                        <label className="text-[9px] md:text-[10px] font-bold text-indigo-400 mb-1.5 block uppercase">Client's Dashboard Currency</label>
                                        <select 
                                            value={preferredCurrency} 
                                            onChange={e => setPreferredCurrency(e.target.value)} 
                                            disabled={isLocked}
                                            // FIX: Removed fixed heights, added py-3 px-4 for proper vertical alignment.
                                            className="w-full bg-black border border-white/10 py-3 px-4 rounded-xl text-white font-bold text-sm focus:border-indigo-500 outline-none transition cursor-pointer disabled:opacity-50"
                                        >
                                            {availableCurrencies.length > 0 ? (
                                                availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)
                                            ) : (
                                                <option value="USD">USD</option>
                                            )}
                                        </select>
                                    </div>
                                </AccordionSection>

                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-white/10 bg-[#0a0a0c] z-20 shrink-0">
                                    <button 
                                        type="submit" disabled={localSaving || saving || isLocked} 
                                        className="w-full h-12 md:h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2 md:gap-3 text-xs md:text-sm active:scale-[0.98]"
                                    >
                                        {isLocked ? <Lock size={16} /> : (localSaving || saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />)}
                                        {isLocked ? 'READ ONLY MODE' : 'SAVE ALL CONFIGURATIONS'}
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