"use client";
import React, { useState } from "react";
import { Globe, Save, Loader2, Info, Lock, AlertCircle, KeyRound, ShieldAlert } from "lucide-react";

// 🛡️ FIX: use the SHARED Supabase instance instead of creating a second client here.
// A second createClient() triggers the "Multiple GoTrueClient instances" warning and can
// desync auth/realtime. Adjust this path if your folder structure differs.
import { supabase } from "../../../lib/supabase/client";

export default function SystemConfig({ adminSettings, setAdminSettings, saveSystemSettings, saving, isLocked, showToast }: any) {
    // --- Security Update State ---
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatingSecurity, setUpdatingSecurity] = useState(false);

    const handleUpdateCredentials = async () => {
        if (isLocked) return;
        
        if (!newEmail && !newPassword) {
            if(showToast) showToast("Enter a new email or password to update.", "error");
            else alert("Enter a new email or password to update.");
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            if(showToast) showToast("New passwords do not match.", "error");
            else alert("New passwords do not match.");
            return;
        }

        if (newPassword && newPassword.length < 6) {
            if(showToast) showToast("Password must be at least 6 characters.", "error");
            else alert("Password must be at least 6 characters.");
            return;
        }

        const confirmUpdate = window.confirm("Are you sure you want to update your Master Admin credentials? You will need to log in again with the new credentials.");
        if (!confirmUpdate) return;

        setUpdatingSecurity(true);
        try {
            const updates: any = {};
            if (newEmail) updates.email = newEmail;
            if (newPassword) updates.password = newPassword;

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            if(showToast) showToast("Credentials updated successfully. Please log in again.", "success");
            else alert("Credentials updated successfully. Please log in again.");
            
            // Clear fields
            setNewEmail("");
            setNewPassword("");
            setConfirmPassword("");
            
            // Log out immediately to force re-auth
            await supabase.auth.signOut();
            window.location.href = '/login';

        } catch (error: any) {
            console.error("Auth update error:", error);
            if(showToast) showToast(error.message, "error");
            else alert(error.message);
        } finally {
            setUpdatingSecurity(false);
        }
    };

    // Safety fallback in case adminSettings is undefined during initial load
    const safeSettings = adminSettings || {};

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full pb-24 md:pb-8">
            
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3"><Globe className="text-blue-500 w-5 h-5 md:w-6 md:h-6"/> Global Configuration</h2>
                <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2">Control default deposit addresses for your clients.</p>
            </div>

            {/* --- QUICK GUIDE --- */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 md:p-5 mb-6 md:mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5"><Info size={80} /></div>
                <h4 className="text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2">
                    <Info size={14} className="shrink-0" /> Global Settings Guide
                </h4>
                <div className="text-[10px] md:text-[11px] text-gray-400 leading-relaxed relative z-10 space-y-2.5">
                    <p>• <strong className="text-white">Deposit Wallets:</strong> Addresses entered here act as the default for ALL your referred clients. They will automatically mirror to their "Buy Crypto" and "Deposit" pages.</p>
                    <p>• <strong className="text-white">Manual Overrides:</strong> If you want a specific client to send funds to a different wallet, you can override this globally by using the "Configure" button in the My Clients tab.</p>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                <div className="bg-[#0f0f11] p-4 md:p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/50">
                    <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-3">Master Deposit Wallets</h3>
                    
                    {/* --- ADMIN WARNING --- */}
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-2 items-start mb-6">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] md:text-xs text-red-300 font-medium leading-relaxed">
                            <strong className="font-bold text-red-400 uppercase tracking-wider">Warning:</strong> Double-check these addresses before saving. These wallets will be immediately visible to all your clients on their deposit dashboards.
                        </p>
                    </div>

                    <div className="space-y-5 md:space-y-6">
                        {/* BTC INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] font-bold text-orange-400 mb-2 block uppercase tracking-wide">BITCOIN (BTC) ADDRESS</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                    <img src="https://assets.coingecko.com/coins/images/1/standard/bitcoin.png" alt="BTC" width={20} className="md:w-6 md:h-6"/>
                                </div>
                                <input 
                                    type="text" 
                                    value={safeSettings.btc_wallet_address || ''} 
                                    onChange={e => setAdminSettings({...safeSettings, btc_wallet_address: e.target.value})} 
                                    placeholder="Enter your BTC wallet address..." 
                                    disabled={isLocked}
                                    className="w-full bg-black border border-white/10 h-12 px-3 md:px-4 rounded-xl text-white font-mono text-xs md:text-sm focus:border-orange-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* ETH INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] font-bold text-blue-400 mb-2 block uppercase tracking-wide">ETHEREUM (ERC20) ADDRESS</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                    <img src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png" alt="ETH" width={20} className="md:w-6 md:h-6"/>
                                </div>
                                <input 
                                    type="text" 
                                    value={safeSettings.eth_wallet_address || ''} 
                                    onChange={e => setAdminSettings({...safeSettings, eth_wallet_address: e.target.value})} 
                                    placeholder="Enter your ETH wallet address..." 
                                    disabled={isLocked}
                                    className="w-full bg-black border border-white/10 h-12 px-3 md:px-4 rounded-xl text-white font-mono text-xs md:text-sm focus:border-blue-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* USDT INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] font-bold text-green-400 mb-2 block uppercase tracking-wide">USDT (ERC20/TRC20) ADDRESS</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                    <img src="https://assets.coingecko.com/coins/images/325/standard/Tether.png" alt="USDT" width={20} className="md:w-6 md:h-6"/>
                                </div>
                                <input 
                                    type="text" 
                                    value={safeSettings.usdt_wallet_address || ''} 
                                    onChange={e => setAdminSettings({...safeSettings, usdt_wallet_address: e.target.value})} 
                                    placeholder="Enter your USDT wallet address..." 
                                    disabled={isLocked}
                                    className="w-full bg-black border border-white/10 h-12 px-3 md:px-4 rounded-xl text-white font-mono text-xs md:text-sm focus:border-green-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* USDC INPUT */}
                        <div>
                            <label className="text-[10px] md:text-[11px] font-bold text-teal-400 mb-2 block uppercase tracking-wide">USDC (ERC20) ADDRESS</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                    <img src="https://assets.coingecko.com/coins/images/6319/standard/usdc.png" alt="USDC" width={20} className="md:w-6 md:h-6"/>
                                </div>
                                <input 
                                    type="text" 
                                    value={safeSettings.usdc_wallet_address || ''} 
                                    onChange={e => setAdminSettings({...safeSettings, usdc_wallet_address: e.target.value})} 
                                    placeholder="Enter your USDC wallet address..." 
                                    disabled={isLocked}
                                    className="w-full bg-black border border-white/10 h-12 px-3 md:px-4 rounded-xl text-white font-mono text-xs md:text-sm focus:border-teal-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* SOL INPUT — added because you have a sol_wallet_address column.
                            NOTE: your client deposit page (AssetsManager) currently only offers
                            BTC/ETH/USDT/USDC, so clients won't see a SOL deposit option until that
                            page is wired for SOL too. Remove this block if you don't want it. */}
                        <div>
                            <label className="text-[10px] md:text-[11px] font-bold text-purple-400 mb-2 block uppercase tracking-wide">SOLANA (SOL) ADDRESS</label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                                    <img src="https://assets.coingecko.com/coins/images/4128/standard/solana.png" alt="SOL" width={20} className="md:w-6 md:h-6"/>
                                </div>
                                <input 
                                    type="text" 
                                    value={safeSettings.sol_wallet_address || ''} 
                                    onChange={e => setAdminSettings({...safeSettings, sol_wallet_address: e.target.value})} 
                                    placeholder="Enter your SOL wallet address..." 
                                    disabled={isLocked}
                                    className="w-full bg-black border border-white/10 h-12 px-3 md:px-4 rounded-xl text-white font-mono text-xs md:text-sm focus:border-purple-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* LOCKED: SAVE BUTTON */}
                <button 
                    onClick={saveSystemSettings} 
                    disabled={saving || isLocked} 
                    className="w-full h-12 md:h-14 bg-white text-black font-bold rounded-xl active:bg-gray-300 md:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale active:scale-[0.98] text-[11px] md:text-xs uppercase tracking-widest"
                >
                    {isLocked ? <Lock size={16} className="md:w-5 md:h-5"/> : (saving ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Save size={16} className="md:w-5 md:h-5" />)} 
                    {isLocked ? 'ACCOUNT LOCKED (READ ONLY)' : 'SAVE GLOBAL CONFIGURATION'}
                </button>

                {/* --- 🛡️ ADMIN CREDENTIALS SECTION --- */}
                <div className="bg-[#0f0f11] p-4 md:p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.05)] mt-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none"></div>
                    
                    <h3 className="text-[10px] md:text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 border-b border-purple-500/20 pb-3 flex items-center gap-2">
                        <KeyRound size={16}/> Master Admin Security
                    </h3>

                    <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex gap-2 items-start mb-6">
                        <ShieldAlert size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] md:text-xs text-purple-300/80 font-medium leading-relaxed">
                            <strong className="font-bold text-purple-400 uppercase tracking-wider">Critical:</strong> Modifying these fields will instantly update your master login credentials. You will be logged out and required to sign back in. Leave blank to keep current credentials.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">New Email Address</label>
                            <input 
                                type="email" 
                                value={newEmail} 
                                onChange={e => setNewEmail(e.target.value)} 
                                placeholder="Enter new admin email..." 
                                disabled={isLocked || updatingSecurity}
                                className="w-full bg-black border border-white/10 h-12 px-4 rounded-xl text-white text-sm focus:border-purple-500 outline-none transition disabled:opacity-50"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="Minimum 6 characters" 
                                    disabled={isLocked || updatingSecurity}
                                    className="w-full bg-black border border-white/10 h-12 px-4 rounded-xl text-white font-mono text-sm focus:border-purple-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">Confirm Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="Re-type new password" 
                                    disabled={isLocked || updatingSecurity}
                                    className="w-full bg-black border border-white/10 h-12 px-4 rounded-xl text-white font-mono text-sm focus:border-purple-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleUpdateCredentials} 
                            disabled={updatingSecurity || isLocked || (!newEmail && !newPassword)} 
                            className="w-full mt-4 h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-[11px] uppercase tracking-widest"
                        >
                            {updatingSecurity ? <Loader2 className="animate-spin w-4 h-4" /> : <ShieldAlert size={16} />} 
                            UPDATE CREDENTIALS & RESTART SESSION
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}