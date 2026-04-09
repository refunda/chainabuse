"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "@supabase/supabase-js"; 
import { 
    createNewAdminUser, editAdminUser, toggleAdminStatus, 
    updateAdminSubscription, deleteAdmin 
} from "./actions"; 
import { 
    ShieldAlert, Search, Plus, Copy, Check, Mail, Lock, 
    Trash2, PauseCircle, PlayCircle, CalendarClock, Crown,
    Edit, LogIn, User as UserIcon, ArrowLeft, Clock, Link as LinkIcon, X, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🛡️ THE FIX: Pointing to the new secure staff folder!
import StaffPortal from "../portal/page";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getTimeLeft = (isoString?: string) => {
    if (!isoString) return { text: "Lifetime", color: "text-blue-400" };
    const diff = new Date(isoString).getTime() - new Date().getTime();
    if (diff <= 0) return { text: "Expired", color: "text-red-500" };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { text: `${days} Days Left`, color: days <= 3 ? "text-orange-500" : "text-green-500" };
};

const toDateInputValue = (iso?: string) => iso ? new Date(iso).toISOString().split('T')[0] : "";

export default function SuperAdminGodMode() {
    // ==========================================
    // 🛡️ SECURITY PROTOCOL: AUTH GUARD
    // ==========================================
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

            if (profile?.role !== 'super_admin') {
                router.push('/login');
                return;
            }

            // Passed! Let them see the Dashboard.
            setIsAuthChecking(false);
        };
        verifyAccess();
    }, [router]);


    // ==========================================
    // EXISTING DASHBOARD STATE
    // ==========================================
    const [view, setView] = useState("ADMINS"); 
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState({ admins: 0, clients: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    const [impersonatedAdmin, setImpersonatedAdmin] = useState<any>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [timerModal, setTimerModal] = useState({ isOpen: false, userId: '', currentDate: '' });
    const [editModal, setEditModal] = useState({ isOpen: false, userId: '', fullName: '', referralCode: '', password: '' });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [createForm, setCreateForm] = useState({ email: '', password: '', fullName: '', subscriptionDays: '30' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only fetch data if auth check passed
    useEffect(() => { 
        if (isAuthChecking) return;

        fetchData(); 
        const channel = supabase.channel('god-mode')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [isAuthChecking]);

    const fetchData = async () => {
        setLoading(true);
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) {
            setUsers(profiles);
            setStats({
                admins: profiles.filter((u: any) => u.role === 'admin').length,
                clients: profiles.filter((u: any) => u.role === 'client').length
            });
        }
        setLoading(false);
    };

    const getReferrerInfo = (referredBy: string) => {
        if (!referredBy) return null;
        const admin = users.find(u => u.id === referredBy || u.referral_code === referredBy);
        return admin ? { email: admin.email, code: admin.referral_code } : null;
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('email', createForm.email);
        formData.append('password', createForm.password);
        formData.append('fullName', createForm.fullName);
        formData.append('subscriptionDays', createForm.subscriptionDays);

        const result = await createNewAdminUser(formData);
        if (result.error) alert("❌ Error: " + result.error);
        else {
            alert(`✅ Success! Admin created.\n\nCode: ${result.code}`);
            setCreateForm({ email: '', password: '', fullName: '', subscriptionDays: '30' });
            setIsCreateModalOpen(false);
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleEditAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await editAdminUser(editModal.userId, {
            fullName: editModal.fullName,
            referralCode: editModal.referralCode,
            password: editModal.password
        });
        if (res.error) alert("❌ Error: " + res.error);
        else {
            alert("✅ Admin Details Updated!");
            setEditModal({ ...editModal, isOpen: false });
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleSaveTimer = async () => {
        setIsSubmitting(true);
        const isoDate = timerModal.currentDate ? new Date(timerModal.currentDate).toISOString() : null;
        const res = await updateAdminSubscription(timerModal.userId, isoDate);
        if (res.error) alert("❌ " + res.error);
        else { setTimerModal({ isOpen: false, userId: '', currentDate: '' }); fetchData(); }
        setIsSubmitting(false);
    };

    const onToggleStatus = async (id: string, currentStatus: string) => {
        const res = await toggleAdminStatus(id, currentStatus || 'active');
        if (res.error) alert("❌ " + res.error); else fetchData();
    };

    const onDeleteUser = async (id: string) => {
        if (!confirm("⚠️ WARNING: This will permanently wipe this user and all their data. Are you absolutely sure?")) return;
        const res = await deleteAdmin(id);
        if (res.error) alert("❌ " + res.error); else fetchData();
    };

    const copyLink = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/${code}`);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ==========================================
    // RENDER 0: SECURITY BOUNCER SCREEN
    // ==========================================
    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center gap-4 text-red-500 text-xs font-bold uppercase tracking-widest">
                <Loader2 size={24} className="animate-spin" />
                Verifying Secure Protocol...
            </div>
        );
    }

    // ==========================================
    // RENDER 2: IMPERSONATION VIEW (LOCKED VIEWPORT)
    // ==========================================
    if (impersonatedAdmin) {
        return (
            <div className="h-[100dvh] w-full flex flex-col bg-[#020202] overflow-hidden relative">
                <div className="absolute bottom-6 right-4 md:top-6 md:right-6 md:bottom-auto z-[999]">
                    <button 
                        onClick={() => setImpersonatedAdmin(null)} 
                        className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-5 py-3 md:py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-500/50"
                    >
                        <ArrowLeft size={18}/> EXIT: {impersonatedAdmin.full_name}
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <StaffPortal adminId={impersonatedAdmin.id} />
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter((u: any) => u.email?.toLowerCase().includes(search.toLowerCase())).filter(u => {
        if (view === 'ADMINS') return u.role === 'admin';
        if (view === 'CLIENTS') return u.role === 'client';
        return true;
    });

    return (
        <div className="h-[100dvh] w-full bg-[#050505] text-white font-sans flex flex-col overflow-hidden overscroll-none">
            
            <header className="shrink-0 h-16 md:h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-[#0a0a0a] z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        <ShieldAlert size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="font-bold text-base tracking-wide">SUPER ADMIN</h1>
                        <p className="text-[10px] text-gray-500 font-mono">GOD MODE ACTIVE</p>
                    </div>
                </div>
                
                <div className="flex gap-1 md:gap-2 bg-[#111] p-1 rounded-lg border border-white/5">
                    <button onClick={() => setView('ADMINS')} className={`px-4 md:px-6 py-2 rounded-md text-[11px] md:text-sm font-bold transition ${view === 'ADMINS' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 active:bg-white/5'}`}>Admins</button>
                    <button onClick={() => setView('CLIENTS')} className={`px-4 md:px-6 py-2 rounded-md text-[11px] md:text-sm font-bold transition ${view === 'CLIENTS' ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 active:bg-white/5'}`}>Clients</button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-white text-black p-2 md:px-4 md:py-2.5 rounded-lg text-xs font-bold active:scale-95 md:hover:bg-gray-200 transition flex items-center gap-2">
                        <Plus size={18} className="md:w-4 md:h-4" /> <span className="hidden md:inline">ADD ADMIN</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-[1600px] mx-auto custom-scrollbar">
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <div className="bg-[#0f0f11] border border-white/5 p-4 rounded-xl flex flex-col justify-center">
                        <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Active Admins</div>
                        <div className="text-xl md:text-3xl font-black text-purple-500 leading-none mt-1">{stats.admins}</div>
                    </div>
                    <div className="bg-[#0f0f11] border border-white/5 p-4 rounded-xl flex flex-col justify-center">
                        <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Total Clients</div>
                        <div className="text-xl md:text-3xl font-black text-blue-500 leading-none mt-1">{stats.clients}</div>
                    </div>
                    <div className="col-span-2 md:col-span-1 bg-[#0f0f11] border border-white/5 p-2 md:p-4 rounded-xl flex items-center px-4">
                        <Search className="text-gray-600 mr-3 shrink-0" size={18} />
                        <input type="text" placeholder="Search users by email..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white w-full placeholder-gray-700 text-sm h-10 md:h-auto" />
                    </div>
                </div>

                <div className="bg-transparent md:bg-[#0f0f11] md:border md:border-white/5 rounded-xl md:overflow-hidden min-h-[500px]">
                    
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] text-[10px] uppercase text-gray-500 font-bold border-b border-white/5">
                                <tr>
                                    <th className="p-4 pl-6">User Details</th>
                                    <th className="p-4">Role & Status</th>
                                    <th className="p-4">Info (Subscription / Referrer)</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((user: any) => {
                                    const isPaused = user.account_status === 'paused';
                                    const timer = getTimeLeft(user.subscription_ends_at);
                                    const referrer = getReferrerInfo(user.referred_by || user.managed_by);
                                    
                                    return (
                                        <tr key={user.id} className={`hover:bg-white/[0.02] transition group ${isPaused ? 'opacity-60 bg-red-900/5' : ''}`}>
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-sm text-white flex items-center gap-2">
                                                    {user.full_name || "No Name"}
                                                    <span className="text-xs text-gray-500 font-normal">({user.email})</span>
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-mono mt-1">{user.id}</div>
                                                {user.role === 'admin' && user.referral_code && (
                                                    <div onClick={() => copyLink(user.referral_code)} className="mt-2 inline-flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[10px] text-gray-400 font-mono transition">
                                                        {copiedId === user.referral_code ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                                                        Code: {user.referral_code}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-2 items-start">
                                                    {user.role === 'admin' ? (
                                                        <span className="text-purple-400 text-xs font-bold border border-purple-500/20 bg-purple-500/10 px-2 py-1 rounded">ADMIN</span>
                                                    ) : user.role === 'client' ? (
                                                        <span className="text-blue-400 text-xs font-bold border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded">CLIENT</span>
                                                    ) : (
                                                        <span className="text-red-500 text-xs font-bold border border-red-500/20 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1"><Crown size={12}/> SUPER</span>
                                                    )}
                                                    {user.role === 'admin' && (
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isPaused ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                                            {isPaused ? 'PAUSED' : 'ACTIVE'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {user.role === 'admin' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className={timer.color} />
                                                        <span className={`text-sm font-bold font-mono ${timer.color}`}>{timer.text}</span>
                                                    </div>
                                                ) : user.role === 'client' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-green-500 font-mono text-sm font-bold">
                                                            {formatCurrency((user.btc_balance || 0) * 65000 + (user.usdt_balance || 0))}
                                                        </div>
                                                        {referrer ? (
                                                            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                                                <LinkIcon size={10}/> Joined via: <span className="text-purple-400">{referrer.code}</span> ({referrer.email})
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-600">No Referrer</div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-gray-600 text-xs">-</span>}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.role === 'admin' && (
                                                        <>
                                                            <button title="View Dashboard" onClick={() => setImpersonatedAdmin(user)} className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"><LogIn size={16}/></button>
                                                            <button title="Edit Admin" onClick={() => setEditModal({ isOpen: true, userId: user.id, fullName: user.full_name || '', referralCode: user.referral_code || '', password: '' })} className="p-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 rounded-lg transition"><Edit size={16}/></button>
                                                            <button title="Set Timer" onClick={() => setTimerModal({ isOpen: true, userId: user.id, currentDate: toDateInputValue(user.subscription_ends_at) })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"><CalendarClock size={16}/></button>
                                                            <button title={isPaused ? "Activate Account" : "Pause Account"} onClick={() => onToggleStatus(user.id, user.account_status)} className={`p-2 rounded-lg transition ${isPaused ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'}`}>{isPaused ? <PlayCircle size={16}/> : <PauseCircle size={16}/>}</button>
                                                        </>
                                                    )}
                                                    {user.role !== 'superadmin' && (
                                                        <button title="Delete User" onClick={() => onDeleteUser(user.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"><Trash2 size={16}/></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden flex flex-col gap-4 pb-12">
                        {filteredUsers.map((user: any) => {
                            const isPaused = user.account_status === 'paused';
                            const timer = getTimeLeft(user.subscription_ends_at);
                            const referrer = getReferrerInfo(user.referred_by || user.managed_by);

                            return (
                                <div key={user.id} className={`bg-[#0f0f11] p-4 rounded-2xl border border-white/5 shadow-lg ${isPaused ? 'opacity-70 bg-red-900/5' : ''}`}>
                                    <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                                        <div className="overflow-hidden pr-2">
                                            <div className="font-bold text-[15px] text-white truncate">{user.full_name || "No Name"}</div>
                                            <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                                        </div>
                                        <div>
                                            {user.role === 'admin' ? (
                                                <span className="text-purple-400 text-[10px] font-bold border border-purple-500/20 bg-purple-500/10 px-2 py-1 rounded">ADMIN</span>
                                            ) : user.role === 'client' ? (
                                                <span className="text-blue-400 text-[10px] font-bold border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded">CLIENT</span>
                                            ) : (
                                                <span className="text-red-500 text-[10px] font-bold border border-red-500/20 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1"><Crown size={10}/> SUPER</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mb-4">
                                        {user.role === 'admin' && (
                                            <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${isPaused ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className={timer.color} />
                                                    <span className={`text-xs font-bold font-mono ${timer.color}`}>{timer.text}</span>
                                                </div>
                                            </div>
                                        )}
                                        {user.role === 'client' && (
                                            <div className="flex flex-col gap-1 bg-white/5 p-2.5 rounded-lg">
                                                <div className="text-green-500 font-mono text-base font-bold">
                                                    {formatCurrency((user.btc_balance || 0) * 65000 + (user.usdt_balance || 0))}
                                                </div>
                                                {referrer && (
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                                                        <LinkIcon size={10}/> Joined via: <span className="text-purple-400 font-bold">{referrer.code}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {user.role === 'admin' && user.referral_code && (
                                            <button onClick={() => copyLink(user.referral_code)} className="flex items-center gap-2 bg-[#1a1a1a] active:bg-[#222] p-3 rounded-lg text-xs text-gray-300 transition justify-center border border-white/5">
                                                {copiedId === user.referral_code ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                {copiedId === user.referral_code ? 'COPIED TO CLIPBOARD' : `COPY CODE: ${user.referral_code}`}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                                        {user.role === 'admin' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => setImpersonatedAdmin(user)} className="flex justify-center items-center gap-2 p-3 bg-purple-500/10 active:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold"><LogIn size={16}/> Login</button>
                                                    <button onClick={() => onToggleStatus(user.id, user.account_status)} className={`flex justify-center items-center gap-2 p-3 rounded-lg text-xs font-bold ${isPaused ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{isPaused ? <PlayCircle size={16}/> : <PauseCircle size={16}/>} {isPaused ? 'Activate' : 'Pause'}</button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => setEditModal({ isOpen: true, userId: user.id, fullName: user.full_name || '', referralCode: user.referral_code || '', password: '' })} className="flex justify-center items-center gap-2 p-3 bg-gray-500/10 active:bg-gray-500/20 text-gray-300 rounded-lg text-xs font-bold"><Edit size={14}/> Edit</button>
                                                    <button onClick={() => setTimerModal({ isOpen: true, userId: user.id, currentDate: toDateInputValue(user.subscription_ends_at) })} className="flex justify-center items-center gap-2 p-3 bg-blue-500/10 active:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold"><CalendarClock size={14}/> Timer</button>
                                                </div>
                                            </>
                                        )}
                                        {user.role !== 'superadmin' && (
                                            <button onClick={() => onDeleteUser(user.id)} className="w-full flex justify-center items-center gap-2 p-3 bg-red-500/10 active:bg-red-500/20 text-red-500 rounded-lg font-bold text-xs mt-1"><Trash2 size={14}/> Delete Account</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {/* 1. CREATE MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsCreateModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
                            <div className="p-5 md:p-6 border-b border-white/10 text-center bg-purple-500/5 shrink-0 flex justify-between items-center">
                                <h3 className="text-sm md:text-lg font-bold text-white uppercase tracking-wider">Create Admin</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-gray-500"><X size={18}/></button>
                            </div>
                            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleCreateAdmin} className="space-y-4">
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Admin Name</label><div className="relative"><UserIcon className="absolute left-3 top-3.5 text-gray-600" size={16} /><input className="w-full bg-black border border-white/10 p-3 h-12 pl-10 rounded-xl text-sm text-white focus:border-purple-500 outline-none" placeholder="John Doe" value={createForm.fullName} onChange={e => setCreateForm({...createForm, fullName: e.target.value})} required /></div></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-600" size={16} /><input type="email" className="w-full bg-black border border-white/10 p-3 h-12 pl-10 rounded-xl text-sm text-white focus:border-purple-500 outline-none" placeholder="admin@refunda.com" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required /></div></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Password</label><div className="relative"><Lock className="absolute left-3 top-3.5 text-gray-600" size={16} /><input type="password" className="w-full bg-black border border-white/10 p-3 h-12 pl-10 rounded-xl text-sm text-white focus:border-purple-500 outline-none" placeholder="Min 6 chars" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required /></div></div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Subscription Timer</label>
                                        <select className="w-full bg-black border border-white/10 p-3 h-12 rounded-xl text-sm text-white focus:border-purple-500 outline-none" value={createForm.subscriptionDays} onChange={e => setCreateForm({...createForm, subscriptionDays: e.target.value})}>
                                            <option value="1">1 Day</option><option value="3">3 Days</option><option value="7">7 Days</option><option value="30">1 Month (30 Days)</option><option value="365">1 Year (365 Days)</option><option value="0">Lifetime (No Timer)</option>
                                        </select>
                                    </div>
                                    <button disabled={isSubmitting} className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-6 transition shadow-lg shadow-purple-900/20">{isSubmitting ? 'Creating...' : 'Create Admin'}</button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 2. EDIT MODAL */}
                {editModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEditModal({ ...editModal, isOpen: false })}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
                            <div className="p-5 border-b border-white/5 text-center bg-gray-500/5 shrink-0 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white uppercase">Edit Admin</h3>
                                <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="p-1 text-gray-500"><X size={18}/></button>
                            </div>
                            <div className="overflow-y-auto p-5 custom-scrollbar">
                                <form onSubmit={handleEditAdmin} className="space-y-4">
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label><input className="w-full bg-black border border-white/10 p-3 h-12 rounded-xl text-sm text-white outline-none" value={editModal.fullName} onChange={e => setEditModal({...editModal, fullName: e.target.value})} required /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">Referral Code</label><input className="w-full bg-black border border-white/10 p-3 h-12 rounded-xl text-sm font-mono text-white outline-none" value={editModal.referralCode} onChange={e => setEditModal({...editModal, referralCode: e.target.value})} required /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase">New Password</label><input type="password" placeholder="Leave blank to keep current" className="w-full bg-black border border-white/10 p-3 h-12 rounded-xl text-sm text-white outline-none" value={editModal.password} onChange={e => setEditModal({...editModal, password: e.target.value})} /></div>
                                    <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-white active:bg-gray-200 text-black rounded-xl font-bold text-xs uppercase tracking-widest mt-4 transition">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 3. TIMER MODAL */}
                {timerModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setTimerModal({ isOpen: false, userId: '', currentDate: '' })}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
                            <div className="p-5 border-b border-white/5 text-center bg-blue-500/5 shrink-0 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white uppercase">Set Subscription</h3>
                                <button onClick={() => setTimerModal({ isOpen: false, userId: '', currentDate: '' })} className="p-1 text-gray-500"><X size={18}/></button>
                            </div>
                            <div className="p-5 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Expiry Date</label>
                                    <input type="date" className="w-full bg-black border border-white/10 p-3 h-12 rounded-xl text-white outline-none font-mono" value={timerModal.currentDate} onChange={e => setTimerModal({...timerModal, currentDate: e.target.value})} />
                                    <div className="flex justify-end pt-2">
                                        <button type="button" onClick={() => setTimerModal({...timerModal, currentDate: ''})} className="text-[10px] text-red-400 font-bold active:underline p-2 bg-red-500/10 rounded-lg">Clear / Set to Lifetime</button>
                                    </div>
                                </div>
                                <button onClick={handleSaveTimer} disabled={isSubmitting} className="w-full h-12 bg-blue-600 active:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-6 transition shadow-lg shadow-blue-900/20">{isSubmitting ? 'Saving...' : 'Save Timer'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}