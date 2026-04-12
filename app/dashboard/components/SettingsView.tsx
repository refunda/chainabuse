"use client";
import React, { useState, useEffect, useRef } from "react";
import { COUNTRIES } from "./constants"; 
import { 
    User, Shield, Lock, ChevronRight, X, 
    Check, Mail, FileText, Globe, Send, CheckCircle, 
    Loader2, Camera, MessageCircle, Headphones 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TICKET_REASONS = [
    "Deposit Not Credited",
    "Recovery Protocol Issue",
    "Verification Status",
    "Withdrawal Delay",
    "Technical Error",
    "Other Inquiry"
];

export default function SettingsView({ initialTab = "general", user, onProfileUpdate }: any) {
    const [activeTab, setActiveTab] = useState("general");
    const [currentUser, setCurrentUser] = useState<any>(user);

    // --- 2. INITIAL DATA LOADING ---
    useEffect(() => {
        if (initialTab === "verification") setActiveTab("verification");
        else if (initialTab === "security") setActiveTab("security");
        else if (initialTab === "contact") setActiveTab("support");
        else setActiveTab("general");

        if (user) {
            if (!user.full_name && user.raw_user_meta_data?.full_name) {
                user.full_name = user.raw_user_meta_data.full_name;
            }
            setCurrentUser(user);
            
            // THE FIX: Completely removed the old Telegram/Support Link fetching. 
            // We now just rely on the hardcoded support@chainabuse.ai in the UI.
        }
    }, [initialTab, user]);

    const handleLocalUpdate = (updates: any) => {
        const newUserState = { ...currentUser, ...updates };
        setCurrentUser(newUserState);
        if (onProfileUpdate) onProfileUpdate(newUserState); 
    };

    const TABS = [
        { id: "general", label: "Profile", icon: <User size={16} /> },
        { id: "support", label: "Support", icon: <Mail size={16} /> },
        { id: "verification", label: "Verification", icon: <Shield size={16} /> },
        { id: "security", label: "Security", icon: <Lock size={16} /> },
    ];

    if (!currentUser) return <div className="p-12 text-center text-cyan-500 font-mono text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin" size={32}/> Loading Profile...</div>;

    return (
        <div className="max-w-[1000px] mx-auto w-full text-slate-300 font-sans">
            
            {/* TABS HEADER - Tactical Glass styling */}
            <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 overflow-x-auto pb-2 border-b border-slate-800/50 custom-scrollbar">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest whitespace-nowrap transition-all border ${
                                isActive 
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]" 
                                : "bg-slate-900/50 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeTab === "general" && <GeneralTab user={currentUser} onUpdate={handleLocalUpdate} />}
                        {activeTab === "support" && <SupportTab user={currentUser} />}
                        {activeTab === "verification" && <VerificationTab user={currentUser} onUpdate={handleLocalUpdate} />}
                        {activeTab === "security" && <SecurityTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- SUPPORT TAB (CHATS & WORKING API EMAIL) ---
const SupportTab = ({ user }: any) => {
    const [view, setView] = useState<"menu" | "ticket" | "chat" | "email_form" | "email_success">("menu");
    const [ticketReason, setTicketReason] = useState(TICKET_REASONS[0]);
    
    // Live Chat States
    const [initialMessage, setInitialMessage] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<any>(null);

    // Email Support States
    const [userEmail, setUserEmail] = useState(user?.email || "");
    const [emailMessage, setEmailMessage] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        let isMounted = true;

        const loadMessages = async () => {
            const { data, error } = await supabase.from('support_messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error("Database fetch blocked:", error.message);
                return;
            }

            if (isMounted && data) {
                const visibleMessages = data.filter((m: any) => m.subject !== 'New Registration');
                setMessages(visibleMessages);
                if (visibleMessages.length > 0 && view !== "email_form" && view !== "email_success") setView("chat");
            }
        };

        loadMessages();
        const pollInterval = setInterval(loadMessages, 3000);

        const channel = supabase.channel(`chat-room-${user.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
                if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) loadMessages();
            })
            .subscribe();

        return () => { 
            isMounted = false;
            clearInterval(pollInterval);
            supabase.removeChannel(channel); 
        };
    }, [user?.id, view]);

    useEffect(() => {
        if (view === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);

    const handleSubmitTicket = async () => {
        if (!initialMessage.trim()) return;
        setLoading(true);

        // THE FIX: Find the global admin directly instead of using referred_by
        const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
        
        if (!adminProfile) {
            alert("System Notice: No Support Agent assigned.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('support_messages').insert({
            sender_id: user.id,
            receiver_id: adminProfile.id, 
            message: initialMessage,
            subject: ticketReason,
            is_read: false
        });

        if (!error) {
            setInitialMessage("");
            setView("chat");
        }
        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        
        // THE FIX: Find the global admin directly instead of using referred_by
        const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
        
        if (!adminProfile) {
            alert("Error: No admin assigned to this account.");
            return;
        }

        const msg = chatInput;
        setChatInput(""); 

        const { error } = await supabase.from('support_messages').insert({
            sender_id: user.id,
            receiver_id: adminProfile.id, 
            message: msg,
            is_read: false
        });

        if (error) {
            console.error("Failed to send:", error);
            alert("Message failed to send. Check console.");
        }
    };

    const handleSendEmail = async () => {
        if (!emailMessage.trim() || !userEmail.trim()) return;
        setEmailLoading(true);

        try {
            // Transmit payload to the Next.js backend API
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderEmail: userEmail,
                    userId: user?.id || "Unknown",
                    topic: ticketReason,
                    message: emailMessage
                })
            });

            if (!response.ok) throw new Error("Mail server rejected payload.");

            setView("email_success");
        } catch (error: any) {
            console.error("Transmission Error:", error);
            alert("Failed to reach mail servers. Please try again later.");
        } finally {
            setEmailLoading(false);
            setEmailMessage("");
        }
    };

    return (
        <div className="h-[500px] md:h-[650px] flex flex-col rounded-2xl md:rounded-[24px] overflow-hidden bg-[#050508] border border-cyan-900/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* VIEW 1: MENU */}
            {view === "menu" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-[40px] text-center relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
                    
                    <div className="mb-10 relative z-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <Headphones className="w-8 h-8 md:w-10 md:h-10 text-cyan-400"/>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest font-mono">Support Center</h2>
                        <p className="text-xs md:text-sm text-slate-500 font-mono uppercase tracking-widest mt-2">Start a conversation with an agent or send us an email.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-[80%] max-w-[600px] relative z-10">
                        <button onClick={() => setView("email_form")} className="flex-1 p-6 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                            <Send className="w-8 h-8 mx-auto mb-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            <div className="font-black text-white uppercase tracking-widest mb-1 text-sm md:text-base">Email Support</div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">support@chainabuse.ai</div>
                        </button>

                        <button onClick={() => setView("ticket")} className="flex-1 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] group">
                            <MessageCircle className="w-8 h-8 mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div className="font-black text-cyan-400 uppercase tracking-widest mb-1 text-sm md:text-base">Live Chat</div>
                            <div className="text-[10px] font-mono text-cyan-500/70 uppercase">Talk to an agent</div>
                        </button>
                    </div>
                </div>
            )}

            {/* EMAIL VIEW: TICKET FORM */}
            {view === "email_form" && (
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
                    <button onClick={() => setView("menu")} className="bg-transparent border-none text-slate-500 cursor-pointer flex items-center gap-2 mb-6 text-xs uppercase font-bold tracking-widest font-mono hover:text-cyan-400 transition-colors w-fit">
                        <ChevronRight className="rotate-180" size={16}/> Back to Menu
                    </button>
                    <h3 className="text-xl md:text-2xl font-black mb-8 text-white uppercase tracking-widest font-mono">Email Support</h3>
                    
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">Your Email</label>
                            <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter your email address" className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors font-mono text-sm" />
                        </div>

                        <div>
                            <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">Topic</label>
                            <select value={ticketReason} onChange={(e) => setTicketReason(e.target.value)} className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors font-mono text-sm appearance-none">
                                {TICKET_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">Message</label>
                            <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Describe your issue..." className="w-full h-[120px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors resize-none custom-scrollbar font-mono text-sm" />
                        </div>
                    </div>
                    
                    <button onClick={handleSendEmail} disabled={emailLoading || !emailMessage.trim() || !userEmail.trim()} className="w-full mt-8 p-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 border-none rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_10px_20px_rgba(6,182,212,0.2)]">
                        {emailLoading ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Send Email</>}
                    </button>
                </div>
            )}

            {/* EMAIL VIEW: SUCCESS SCREEN */}
            {view === "email_success" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                        <CheckCircle className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 font-mono uppercase tracking-widest">Email Sent</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-mono leading-relaxed max-w-sm mx-auto mb-10 uppercase tracking-widest">
                        Your message has been sent successfully. We will reply to your email address within 24 hours.
                    </p>
                    <button onClick={() => setView("menu")} className="px-8 py-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-cyan-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                        Return to Support Menu
                    </button>
                </div>
            )}

            {/* LIVE CHAT VIEW 2: TICKET FORM */}
            {view === "ticket" && (
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
                    <button onClick={() => setView("menu")} className="bg-transparent border-none text-slate-500 cursor-pointer flex items-center gap-2 mb-6 text-xs uppercase font-bold tracking-widest font-mono hover:text-cyan-400 transition-colors w-fit">
                        <ChevronRight className="rotate-180" size={16}/> Back
                    </button>
                    <h3 className="text-xl md:text-2xl font-black mb-8 text-white uppercase tracking-widest font-mono">Start New Conversation</h3>
                    
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">Topic</label>
                            <select value={ticketReason} onChange={(e) => setTicketReason(e.target.value)} className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors font-mono text-sm appearance-none">
                                {TICKET_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">Message</label>
                            <textarea value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} placeholder="How can we help?" className="w-full h-[120px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors resize-none custom-scrollbar font-mono text-sm" />
                        </div>
                    </div>
                    <button onClick={handleSubmitTicket} disabled={loading || !initialMessage.trim()} className="w-full mt-8 p-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 border-none rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_10px_20px_rgba(6,182,212,0.2)]">
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <><MessageCircle size={18}/> Start Chat</>}
                    </button>
                </div>
            )}

            {/* LIVE CHAT VIEW 3: CHAT WINDOW */}
            {view === "chat" && (
                <div className="flex flex-col h-full bg-[#020203]">
                    <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-900/50 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-950 border border-cyan-900/50 flex items-center justify-center"><User className="w-5 h-5 md:w-6 md:h-6 text-cyan-500"/></div>
                                <div className="w-3 h-3 rounded-full absolute -bottom-1 -right-1 border-2 border-slate-900 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                            </div>
                            <div>
                                <div className="font-black text-sm md:text-base text-white uppercase tracking-widest font-mono">Support Agent</div>
                                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">Online</div>
                            </div>
                        </div>
                        <button onClick={() => setView("menu")} className="px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1 transition-colors">
                            <X size={14}/> Close
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] custom-scrollbar">
                        {messages.length === 0 && <div className="text-center text-slate-600 font-mono text-xs uppercase tracking-widest py-10">Chat started.</div>}
                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div key={msg.id || i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                                    <div className={`p-3 md:p-4 rounded-2xl text-[13px] md:text-sm font-mono shadow-md ${
                                        isMe 
                                        ? 'bg-cyan-600 text-white rounded-br-sm shadow-[0_5px_15px_rgba(6,182,212,0.2)]' 
                                        : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-bl-sm'
                                    }`}>
                                        {msg.message}
                                    </div>
                                    <div className={`text-[9px] font-mono text-slate-600 mt-1.5 uppercase tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
                        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 focus-within:border-cyan-500/50 transition-colors">
                            <textarea 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Type a message..." 
                                className="flex-1 bg-transparent p-3 text-white outline-none font-mono text-sm resize-none max-h-24 custom-scrollbar placeholder:text-slate-600"
                                rows={1}
                            />
                            <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="w-12 h-12 self-end border-none rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 cursor-pointer flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:grayscale mb-0.5 mr-0.5">
                                <Send size={18} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---
const GeneralTab = ({ user, onUpdate }: any) => {
    const [formData, setFormData] = useState({ 
        fullName: user.full_name || "", 
        email: user.email, 
        address: user.address || "", 
        country: user.country || "United States", 
        city: user.city || "", 
        zip: user.zip || ""
    });
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (event: any) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;
            setAvatarUrl(publicUrl);
            onUpdate({ avatar_url: publicUrl }); 
            alert("Profile photo updated!");
        } catch (error: any) {
            alert("Error uploading: " + error.message);
        } finally {
            setUploading(false);
        }
    };
    
    const handleSave = async () => {
        const btn = document.getElementById("save-btn");
        if(btn) btn.innerText = "Saving...";
        const { error } = await supabase.from('profiles').update({ 
            full_name: formData.fullName,
            address: formData.address,
            country: formData.country,
            city: formData.city,
            zip: formData.zip
        }).eq('id', user.id);
        if(btn) {
            if(error) {
                btn.innerText = "Failed";
                btn.style.background = "#ef4444";
                btn.style.color = "white";
                alert("Save failed: " + error.message);
            } else {
                btn.innerText = "Saved!";
                btn.style.background = "#10b981";
                btn.style.color = "white";
                onUpdate({ full_name: formData.fullName }); 
            }
            setTimeout(() => { 
                btn.innerText = "Save Changes"; 
                btn.style.background = "#06b6d4";
                btn.style.color = "#050508";
            }, 2000);
        }
    };

    return (
        <div className="p-6 md:p-8 rounded-2xl md:rounded-[24px] bg-[#050508] border border-cyan-900/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg md:text-xl mb-8 font-black text-white uppercase tracking-widest font-mono flex items-center gap-3">
                <User className="text-cyan-500" /> General Information
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center shrink-0 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl md:text-4xl font-black text-slate-700 font-mono uppercase">{formData.fullName?.[0] || "U"}</span>
                        )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-cyan-500 hover:bg-cyan-400 rounded-full p-2 md:p-2.5 cursor-pointer text-slate-900 shadow-lg border border-cyan-200 transition-colors">
                        {uploading ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16} />}
                    </label>
                    <input type="file" id="avatar-upload" accept="image/*" capture="user" onChange={handleAvatarUpload} className="hidden" disabled={uploading}/>
                </div>
                <div>
                    <div className="font-black text-sm md:text-base text-white uppercase tracking-widest font-mono">Profile Photo</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase mt-1 tracking-widest">Click camera icon to change</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <InputGroup label="Full Name" value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} placeholder="Your Name" />
                <InputGroup label="Email Address" value={formData.email} onChange={() => {}} disabled={true} />
                <InputGroup label="Address" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
                <div>
                    <label className="block text-slate-500 text-[10px] md:text-xs mb-2 uppercase font-bold font-mono tracking-widest">Country</label>
                    <select value={formData.country} onChange={(e: any) => setFormData({...formData, country: e.target.value})} className="w-full p-4 bg-slate-950 rounded-xl border border-slate-800 text-white outline-none cursor-pointer appearance-none text-sm font-mono focus:border-cyan-500 transition-colors">
                        {COUNTRIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <InputGroup label="City" value={formData.city} onChange={(e: any) => setFormData({...formData, city: e.target.value})} />
                <InputGroup label="Postal Code" value={formData.zip} onChange={(e: any) => setFormData({...formData, zip: e.target.value})} />
            </div>
            <div className="mt-8 text-right">
                <button id="save-btn" onClick={handleSave} className="w-full md:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 border-none rounded-xl font-black uppercase tracking-widest cursor-pointer text-xs md:text-sm transition-colors shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-95">Save Changes</button>
            </div>
        </div>
    );
};

const VerificationTab = ({ user, onUpdate }: any) => {
    const [expanded, setExpanded] = useState(true);
    const [frontFile, setFrontFile] = useState<any>(null);
    const [backFile, setBackFile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [docType, setDocType] = useState("passport");
    
    const status = user?.kyc_status === "verified" ? "Verified" : user?.kyc_status === "rejected" ? "Rejected" : user?.kyc_status === "pending" ? "Pending" : "Not Verified";
    
    const handleFileSelect = (side: string) => { 
        const input = document.createElement("input"); 
        input.type = "file"; 
        input.accept = "image/*"; 
        input.capture = "environment";
        input.onchange = (e: any) => { 
            const file = e.target.files[0]; 
            if (file) { 
                if (side === "front") setFrontFile(file); 
                else setBackFile(file); 
            } 
        }; 
        input.click(); 
    };
    
    const canSubmit = docType === "passport" ? !!frontFile : (!!frontFile && !!backFile);
    
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        const upload = async (file: File) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('kyc-documents').upload(fileName, file);
            if(error) throw error;
            return supabase.storage.from('kyc-documents').getPublicUrl(fileName).data.publicUrl;
        };
        try {
            await upload(frontFile);
            if (docType === "id") await upload(backFile);
            const { error } = await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id);
            if (error) throw error;
            setLoading(false);
            alert("Documents submitted for review.");
            onUpdate({ kyc_status: 'pending' });
        } catch (error: any) {
            alert("Upload failed: " + error.message);
            setLoading(false);
        }
    };
    
    const getStatusColor = () => { if (status === "Verified") return "text-emerald-400"; if (status === "Pending") return "text-cyan-400"; if (status === "Rejected") return "text-red-400"; return "text-slate-500"; };
    const getStatusBg = () => { if (status === "Verified") return "bg-emerald-500/10 border-emerald-500/30"; if (status === "Pending") return "bg-cyan-500/10 border-cyan-500/30"; if (status === "Rejected") return "bg-red-500/10 border-red-500/30"; return "bg-slate-900 border-slate-700"; };

    return (
        <div className="p-6 md:p-8 rounded-2xl md:rounded-[24px] bg-[#050508] border border-cyan-900/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg md:text-xl mb-6 font-black text-white uppercase tracking-widest font-mono flex items-center gap-3 border-b border-slate-800 pb-4">
                <Shield className="text-cyan-500" /> Identity Verification
            </h3>
            
            <div className="grid gap-4">
                <VerificationItem label="Personal Information" status="Completed" icon={<Check size={16} className="text-emerald-400"/>} bgClass="bg-emerald-500/10 border-emerald-500/30" textColor="text-emerald-400" />
                
                <div className={`p-4 md:p-6 rounded-2xl border transition-colors ${expanded ? 'bg-slate-900/50 border-cyan-900/50' : 'bg-slate-950 border-slate-800 cursor-pointer hover:border-cyan-900/50'}`}>
                    <div className="flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
                        <span className="font-black text-sm md:text-base text-white uppercase tracking-widest font-mono">Identity Documents</span>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest font-mono px-3 py-1 rounded-lg border ${getStatusColor()} ${getStatusBg()}`}>{status}</span>
                            <ChevronRight className="w-5 h-5 text-slate-500 transition-transform duration-200" style={{ transform: expanded ? "rotate(90deg)" : "none" }} />
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {expanded && status === "Not Verified" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    
                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Document Type</div>
                                    <div className="flex gap-4 mb-6">
                                        <button onClick={() => { setDocType("passport"); setFrontFile(null); setBackFile(null); }} className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-3 border transition-all ${docType === "passport" ? "bg-cyan-500/10 border-cyan-500 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)] text-cyan-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}>
                                            <Globe size={20} /> <span className="font-bold font-mono uppercase tracking-widest text-xs">Passport</span>
                                        </button>
                                        <button onClick={() => { setDocType("id"); setFrontFile(null); setBackFile(null); }} className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-3 border transition-all ${docType === "id" ? "bg-cyan-500/10 border-cyan-500 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)] text-cyan-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}>
                                            <FileText size={20} /> <span className="font-bold font-mono uppercase tracking-widest text-xs">ID / License</span>
                                        </button>
                                    </div>

                                    <div className="grid gap-4 mb-8">
                                        <div onClick={() => handleFileSelect("front")} className={`p-6 rounded-xl text-center cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center ${frontFile ? "border-cyan-500 bg-cyan-500/5" : "border-slate-700 bg-slate-950 hover:border-cyan-500/50 hover:bg-slate-900"}`}>
                                            {frontFile ? 
                                                <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-mono text-cyan-400 break-all"><CheckCircle size={18} className="shrink-0"/> <span className="truncate max-w-[200px]">{frontFile.name}</span></div> : 
                                                <div className="flex flex-col items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest"><Camera size={24} className="mb-2 text-slate-600"/> Tap to Scan {docType === "passport" ? "Passport" : "Front of ID"}</div>
                                            }
                                        </div>
                                        {docType === "id" && (
                                            <div onClick={() => handleFileSelect("back")} className={`p-6 rounded-xl text-center cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center ${backFile ? "border-cyan-500 bg-cyan-500/5" : "border-slate-700 bg-slate-950 hover:border-cyan-500/50 hover:bg-slate-900"}`}>
                                                {backFile ? 
                                                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-mono text-cyan-400 break-all"><CheckCircle size={18} className="shrink-0"/> <span className="truncate max-w-[200px]">{backFile.name}</span></div> : 
                                                    <div className="flex flex-col items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest"><Camera size={24} className="mb-2 text-slate-600"/> Tap to Scan Back of ID</div>
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <button disabled={!canSubmit || loading} onClick={handleSubmit} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm flex justify-center items-center gap-3 transition-all ${canSubmit ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95" : "bg-slate-900 text-slate-600 cursor-not-allowed"}`}>
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Shield size={18}/> Submit Documents</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {expanded && status === "Pending" && <div className="py-12 text-center text-cyan-400 font-mono uppercase tracking-widest border-t border-slate-800 mt-4"><div className="animate-pulse mb-4 text-2xl">⏳</div><div className="font-bold">Verification Pending</div><div className="text-xs text-slate-500 mt-2">We are reviewing your documents. Usually takes 24h.</div></div>}
                        {expanded && status === "Verified" && <div className="py-12 text-center text-emerald-400 font-mono uppercase tracking-widest border-t border-slate-800 mt-4"><CheckCircle className="w-12 h-12 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" /><div className="font-bold">Identity Verified</div><div className="text-xs text-slate-500 mt-2">You are fully verified and approved.</div></div>}
                        {expanded && status === "Rejected" && <div className="py-12 text-center text-red-400 font-mono uppercase tracking-widest border-t border-slate-800 mt-4"><X className="w-12 h-12 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" /><div className="font-bold">Verification Rejected</div><div className="text-xs text-slate-500 mt-2">Please re-upload clearer documents.</div></div>}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const SecurityTab = () => {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleUpdatePassword = async () => {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });
        setLoading(false);
        if(error) alert("Error: " + error.message);
        else { setPassword(""); alert("Password updated successfully."); }
    };
    
    return (
        <div className="p-6 md:p-8 rounded-2xl md:rounded-[24px] bg-[#050508] border border-cyan-900/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg md:text-xl mb-6 font-black text-white uppercase tracking-widest font-mono flex items-center gap-3 border-b border-slate-800 pb-4">
                <Lock className="text-cyan-500" /> Security Settings
            </h3>
            <div className="grid gap-6">
                <InputGroup label="New Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="text-right mt-8">
                <button onClick={handleUpdatePassword} disabled={loading || !password} className="w-full md:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 border-none rounded-xl font-black uppercase tracking-widest text-xs md:text-sm cursor-pointer transition-colors shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50 disabled:grayscale active:scale-95">
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, name, placeholder, icon, type = "text", disabled = false }: any) => (
    <div>
        <label className="block text-slate-500 text-[10px] md:text-xs mb-2 uppercase font-bold tracking-widest font-mono">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                name={name} 
                value={value ?? ""} 
                onChange={onChange} 
                disabled={disabled} 
                placeholder={placeholder} 
                className="w-full p-4 rounded-xl outline-none font-mono text-sm transition-colors border" 
                style={{ 
                    paddingRight: icon ? 40 : 16, 
                    background: disabled ? "#020203" : "#050508", 
                    borderColor: disabled ? "#1e293b" : "#1e293b", 
                    color: disabled ? "#64748b" : "white" 
                }} 
            />
            {icon && <div className="absolute right-4 top-[18px] text-slate-600">{icon}</div>}
        </div>
    </div>
);

const VerificationItem = ({ label, status, icon, bgClass, textColor }: any) => (
    <div className={`flex justify-between items-center p-4 md:p-6 rounded-2xl border ${bgClass || "bg-slate-900 border-slate-800"}`}>
        <span className="font-black text-sm md:text-base text-white uppercase tracking-widest font-mono">{label}</span>
        <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-1.5 rounded-lg ${bgClass}`}>{icon}</div>
            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest font-mono ${textColor}`}>{status}</span>
        </div>
    </div>
);