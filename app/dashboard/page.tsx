"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bell, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Use the standardized Supabase client from our lib folder
import { supabase } from '../../lib/supabase/client';

// COMPONENTS
import Layout from "./components/Layout";
import DashboardView from "./components/DashboardView";
import AssetsManager from "./components/AssetsManager";
import SettingsView from "./components/SettingsView";
import BuyCryptoView from "./components/BuyCryptoView";
import StakingView from "./components/StakingView";

// --- HELPER: Format DB Data ---
const formatAssets = (profile: any) => {
    if (!profile) return [];
    
    // 1. Standard Assets
    const list = [
        { symbol: "BTC", balance: Number(profile.btc_balance || 0) },
        { symbol: "ETH", balance: Number(profile.eth_balance || 0) },
        { symbol: "USDT", balance: Number(profile.usdt_balance || 0) }
    ];

    // 2. Custom Assets
    if (profile.other_balances) {
        Object.entries(profile.other_balances).forEach(([symbol, bal]: any) => {
            if (parseFloat(bal) > 0) {
                list.push({ symbol: symbol, balance: parseFloat(bal) });
            }
        });
    }
    return list;
};

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [realAssets, setRealAssets] = useState<any[]>([]);

    // --- GLOBAL NOTIFICATION STATE ---
    const [notification, setNotification] = useState<{show: boolean, text: string} | null>(null);
    const lastMessageIdRef = useRef<any>(null);

    // --- AUDIO UNLOCKER FOR SAFARI/CHROME ---
    useEffect(() => {
        const unlockAudio = () => {
            const silent = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            silent.volume = 0; 
            silent.play().catch(() => {});
            document.removeEventListener('click', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        return () => document.removeEventListener('click', unlockAudio);
    }, []);

    // --- 1. GLOBAL AUTH & DATA FETCH ---
    useEffect(() => {
        let channel: any;

        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/");
                return;
            }

            const fetchProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (error || !data) return;

                // Check Ban/Pause Status
                if (data.admin_status === 'paused' || data.admin_status === 'deleted') {
                    await supabase.auth.signOut();
                    alert("SECURITY ALERT: Node Access Locked by Administrator.");
                    router.replace("/");
                    return;
                }

                setUserProfile(data);
                setRealAssets(formatAssets(data));
                setLoading(false);
            };

            await fetchProfile();

            // FIX: Generate a completely unique channel ID for this specific mount.
            // This prevents Next.js Strict Mode from crashing when it double-fires.
            const uniqueChannelId = `tactical_uplink_${session.user.id}_${Date.now()}`;

            channel = supabase
                .channel(uniqueChannelId)
                // 1. Listen for Profile Changes (Balances / Bans)
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'profiles', 
                    filter: `id=eq.${session.user.id}` 
                }, 
                (payload) => {
                    const newData = payload.new;
                    if (newData.admin_status === 'paused' || newData.admin_status === 'deleted') {
                        window.location.reload(); 
                    }
                    setUserProfile(newData);
                    setRealAssets(formatAssets(newData));
                })
                // 2. THE MASTER REALTIME SUPPORT LISTENER
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'support_messages',
                    filter: `receiver_id=eq.${session.user.id}` 
                }, (payload) => {
                    
                    if (lastMessageIdRef.current === payload.new.id) return;
                    lastMessageIdRef.current = payload.new.id;

                    // Play Sound
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.volume = 0.6; 
                    audio.play().catch(() => {});

                    // Speak Text
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel(); 
                        const utterance = new SpeechSynthesisUtterance("Incoming encrypted transmission from Support.");
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0; 
                        window.speechSynthesis.speak(utterance);
                    }

                    // Show Toast Notification
                    setNotification({ show: true, text: payload.new.message });
                    setTimeout(() => setNotification(null), 8000);
                })
                .subscribe();
        };

        initSession();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [router]);

    // --- HANDLERS ---
    const handleRedirect = (tabName: string) => { setActiveTab(tabName); };
    const handleUpdateTradingAssets = (newAssets: any[]) => { setRealAssets(newAssets); };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center font-mono">
                <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
                <div className="text-cyan-500 text-xs tracking-[0.3em] uppercase animate-pulse">Decrypting User Telemetry...</div>
            </div>
        );
    }

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={userProfile} onLogout={() => router.replace("/")}>
            
            {activeTab === "overview" && (
                <DashboardView 
                    setActiveTab={setActiveTab} 
                    user={userProfile}
                    assets={realAssets}
                />
            )}

            {activeTab === "assets" && (
                <AssetsManager />
            )}

            {activeTab === "buy_crypto" && (
                <BuyCryptoView 
                    assets={realAssets} 
                    onUpdateAssets={handleUpdateTradingAssets} 
                    onRedirect={handleRedirect} 
                />
            )}

            {(activeTab === "staking" || activeTab === "stake_plans" || activeTab === "manage_stakes") && (
                <StakingView 
                    activeSubTab={activeTab} 
                    assets={realAssets} 
                    onRedirect={handleRedirect} 
                />
            )}

            {(activeTab === "verification" || activeTab === "settings" || activeTab === "security" || activeTab === "contact") && (
                <SettingsView initialTab={activeTab} user={userProfile} />
            )}

            {/* --- GLOBAL TACTICAL NOTIFICATION TOAST --- */}
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        onClick={() => { setActiveTab("contact"); setNotification(null); }}
                        className="fixed top-4 right-4 md:top-auto md:bottom-5 md:right-5 w-[90%] md:w-[320px] max-w-[400px] z-[9999] flex items-center gap-[15px] p-[15px] rounded-xl cursor-pointer bg-[#050508]/95 backdrop-blur-md border border-cyan-500/50 shadow-[0_10px_40px_rgba(34,211,238,0.15)] overflow-hidden"
                    >
                        {/* Scanning beam effect inside toast */}
                        <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent skew-x-12 z-0" />
                        
                        <div className="relative z-10 w-[40px] h-[40px] rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shrink-0">
                            <ShieldAlert size={20} className="text-cyan-400" />
                        </div>
                        <div className="relative z-10 flex-1 overflow-hidden font-mono">
                            <div className="text-[10px] font-bold text-cyan-400 mb-[2px] tracking-[0.2em] uppercase">Encrypted Uplink</div>
                            <div className="text-[11px] text-zinc-300 whitespace-nowrap overflow-hidden text-ellipsis">{notification.text}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </Layout>
    );
}