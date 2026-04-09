"use client";
import React, { useState, useEffect, useRef } from "react";
import { THEME, COUNTRIES } from "./constants"; 
import { 
    User, CreditCard, Shield, Lock, ChevronRight, Plus, X, 
    Check, Mail, UploadCloud, FileText, Globe, Send, CheckCircle, 
    Trash2, Loader2, Camera, MessageCircle, Bell, Headphones
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
    const [supportLink, setSupportLink] = useState("https://t.me/support");

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
            
            const adminId = user.referred_by || user.managed_by;
            if (adminId) {
                const fetchSupport = async () => {
                    const { data } = await supabase.from('admin_settings').select('telegram_link').eq('admin_id', adminId).single();
                    if (data?.telegram_link) setSupportLink(data.telegram_link);
                };
                fetchSupport();
            }
        }
    }, [initialTab, user]);

    const handleLocalUpdate = (updates: any) => {
        const newUserState = { ...currentUser, ...updates };
        setCurrentUser(newUserState);
        if (onProfileUpdate) onProfileUpdate(newUserState); 
    };

    const TABS = [
        { id: "general", label: "General", icon: <User size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" /> },
        { id: "support", label: "Support", icon: <Mail size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" /> },
        { id: "payment", label: "Payment", icon: <CreditCard size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" /> },
        { id: "verification", label: "Verification", icon: <Shield size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" /> },
        { id: "security", label: "Security", icon: <Lock size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" /> },
    ];

    if (!currentUser) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-500"/></div>;

    return (
        <div className="max-w-[1000px] mx-auto w-full">
            
            {/* TABS HEADER - Responsive Scrolling on Mobile */}
            <div className="flex gap-[8px] md:gap-[10px] mb-[15px] md:mb-[30px] overflow-x-auto pb-[5px] border-b border-white/10 no-scrollbar custom-scrollbar">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className="flex items-center gap-[6px] md:gap-[8px] px-[14px] md:px-[20px] py-[8px] md:py-[12px] rounded-lg md:rounded-[8px] font-bold text-[12px] md:text-[14px] whitespace-nowrap transition-all border-none cursor-pointer"
                        style={{ 
                            background: activeTab === tab.id ? "rgba(139, 92, 246, 0.1)" : "transparent", 
                            color: activeTab === tab.id ? THEME.accent : "#888" 
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[500px]">
                {activeTab === "general" && <GeneralTab user={currentUser} onUpdate={handleLocalUpdate} />}
                {activeTab === "support" && <SupportTab user={currentUser} link={supportLink} />}
                {activeTab === "payment" && <PaymentMethodsTab />}
                {activeTab === "verification" && <VerificationTab user={currentUser} onUpdate={handleLocalUpdate} />}
                {activeTab === "security" && <SecurityTab />}
            </div>
        </div>
    );
}

// --- SUPPORT TAB (BULLETPROOF CHAT SYSTEM + EMAIL) ---
const SupportTab = ({ user, link }: any) => {
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

    // 1. Setup Data, WebSockets & Failsafe Polling (For Chat UI ONLY)
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

        // Initial Load
        loadMessages();

        // FAILSAFE: Sync messages automatically every 3 seconds
        const pollInterval = setInterval(loadMessages, 3000);

        // INSTANT: Realtime Chat Update
        const channel = supabase.channel(`chat-room-${user.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'support_messages' 
            }, (payload) => {
                if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
                    loadMessages(); // Safely refresh the list
                }
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

    // LIVE CHAT HANDLERS
    const handleSubmitTicket = async () => {
        if (!initialMessage.trim()) return;
        setLoading(true);

        const adminId = user.referred_by || user.managed_by;
        
        if (!adminId) {
            alert("System Notice: No Support Agent assigned.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('support_messages').insert({
            sender_id: user.id,
            receiver_id: adminId, 
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
        
        const adminId = user.referred_by || user.managed_by;
        if (!adminId) {
            alert("Error: No admin assigned to this account.");
            return;
        }

        const msg = chatInput;
        setChatInput(""); 

        const { error } = await supabase.from('support_messages').insert({
            sender_id: user.id,
            receiver_id: adminId, 
            message: msg,
            is_read: false
        });

        if (error) {
            console.error("Failed to send:", error);
            alert("Message failed to send. Check console.");
        }
    };

    // EMAIL HANDLER
    const handleSendEmail = async () => {
        if (!emailMessage.trim() || !userEmail.trim()) return;
        setEmailLoading(true);

        // Simulate network delay for realistic feel
        await new Promise(resolve => setTimeout(resolve, 1500));

        setEmailLoading(false);
        setEmailMessage("");
        setView("email_success");
    };

    return (
        <div className="h-[500px] md:h-[600px] flex flex-col rounded-2xl md:rounded-[16px] overflow-hidden" style={{ background: THEME.cardBg, border: THEME.border }}>
            
            {/* VIEW 1: MENU */}
            {view === "menu" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-[40px] text-center">
                    <div className="mb-[30px]">
                        <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center mx-auto mb-[15px] md:mb-[20px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Headphones className="w-8 h-8 md:w-10 md:h-10 text-gray-400"/>
                        </div>
                        <h2 className="text-[20px] md:text-[24px] font-bold text-white">Support Center</h2>
                        <p className="text-[12px] md:text-[14px] text-[#888] mt-[5px] md:mt-[10px]">Start a conversation with an agent or send us an email</p>
                    </div>

                    {/* Responsive Support Buttons */}
                    <div className="flex flex-col md:flex-row gap-[15px] md:gap-[20px] w-full md:w-[80%] max-w-[600px]">
                        <button onClick={() => setView("email_form")} className="flex-1 p-5 md:p-[30px] rounded-xl md:rounded-[16px] cursor-pointer transition active:scale-95 md:hover:bg-blue-500/20" style={{ background: "rgba(0, 136, 204, 0.1)", border: "1px solid rgba(0, 136, 204, 0.3)" }}>
                            <Send className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-[10px] md:mb-[15px]" color="#0088cc" />
                            <div className="font-bold text-[#0088cc] mb-[5px] text-[14px] md:text-base">Email</div>
                            <div className="text-[10px] md:text-[11px]" style={{ color: "rgba(0, 136, 204, 0.7)" }}>support@refunda.online</div>
                        </button>

                        <button onClick={() => setView("ticket")} className="flex-1 p-5 md:p-[30px] rounded-xl md:rounded-[16px] cursor-pointer transition active:scale-95 md:hover:bg-purple-500/20" style={{ background: "rgba(139, 92, 246, 0.1)", border: `1px solid ${THEME.accent}` }}>
                            <MessageCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-[10px] md:mb-[15px]" color={THEME.accent} />
                            <div className="font-bold mb-[5px] text-[14px] md:text-base" style={{ color: THEME.accent }}>Live Chat</div>
                            <div className="text-[10px] md:text-[11px]" style={{ color: "rgba(139, 92, 246, 0.7)" }}>Talk to an agent</div>
                        </button>
                    </div>
                </div>
            )}

            {/* EMAIL VIEW: TICKET FORM */}
            {view === "email_form" && (
                <div className="flex-1 p-6 md:p-[40px] flex flex-col justify-center">
                    <button onClick={() => setView("menu")} className="bg-transparent border-none text-[#888] cursor-pointer flex items-center gap-[5px] mb-[15px] md:mb-[20px] text-[12px] md:text-[13px] w-fit hover:text-white transition">
                        <ChevronRight style={{ transform: "rotate(180deg)" }} size={14}/> Back
                    </button>
                    <h3 className="text-[20px] md:text-[22px] font-bold mb-[20px] md:mb-[25px]">Email Support</h3>
                    
                    <div className="mb-[15px] md:mb-[20px]">
                        <label className="block text-white text-[12px] md:text-[13px] mb-[8px] font-bold">Your Email</label>
                        <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter your email address" className="w-full p-[12px] md:p-[14px] rounded-lg md:rounded-[8px] text-white outline-none" style={{ background: "#0a0a0c", border: THEME.border }} />
                    </div>

                    <div className="mb-[15px] md:mb-[20px]">
                        <label className="block text-white text-[12px] md:text-[13px] mb-[8px] font-bold">Topic</label>
                        <select value={ticketReason} onChange={(e) => setTicketReason(e.target.value)} className="w-full p-[12px] md:p-[14px] rounded-lg md:rounded-[8px] text-white outline-none" style={{ background: "#0a0a0c", border: THEME.border }}>
                            {TICKET_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    
                    <div className="mb-[20px] md:mb-[30px]">
                        <label className="block text-white text-[12px] md:text-[13px] mb-[8px] font-bold">Message</label>
                        <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Please describe your issue in detail..." className="w-full h-[100px] md:h-[120px] p-[12px] md:p-[14px] rounded-lg md:rounded-[8px] text-white outline-none resize-none custom-scrollbar" style={{ background: "#0a0a0c", border: THEME.border }} />
                    </div>
                    
                    <button onClick={handleSendEmail} disabled={emailLoading || !emailMessage.trim() || !userEmail.trim()} className="w-full p-[14px] md:p-[16px] text-white border-none rounded-xl md:rounded-[10px] font-bold flex items-center justify-center gap-[10px] transition active:scale-95" style={{ background: THEME.accentGradient, cursor: (emailLoading || !emailMessage.trim() || !userEmail.trim()) ? "not-allowed" : "pointer", opacity: (emailLoading || !emailMessage.trim() || !userEmail.trim()) ? 0.7 : 1 }}>
                        {emailLoading ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Send Email</>}
                    </button>
                </div>
            )}

            {/* EMAIL VIEW: SUCCESS SCREEN */}
            {view === "email_success" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-[40px] text-center">
                    <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center mx-auto mb-[15px] md:mb-[20px]" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10" color={THEME.success} />
                    </div>
                    <h2 className="text-[20px] md:text-[24px] font-bold text-white mb-[10px] md:mb-[15px]">Email Sent Successfully</h2>
                    <p className="text-[14px] md:text-[16px] text-[#888] leading-relaxed max-w-[350px] mx-auto mb-[20px] md:mb-[30px]">
                        Your email was sent. Make sure that your email address is correct, and we're gonna reply to you in 24 hours.
                    </p>
                    <button onClick={() => setView("menu")} className="px-[24px] py-[12px] md:px-[30px] md:py-[14px] bg-white text-black border-none rounded-lg md:rounded-[8px] font-bold cursor-pointer text-sm md:text-base active:scale-95 transition-transform">
                        Back to Support Menu
                    </button>
                </div>
            )}

            {/* LIVE CHAT VIEW 2: TICKET FORM */}
            {view === "ticket" && (
                <div className="flex-1 p-6 md:p-[40px] flex flex-col justify-center">
                    <button onClick={() => setView("menu")} className="bg-transparent border-none text-[#888] cursor-pointer flex items-center gap-[5px] mb-[15px] md:mb-[20px] text-[12px] md:text-[13px] w-fit hover:text-white transition">
                        <ChevronRight style={{ transform: "rotate(180deg)" }} size={14}/> Back
                    </button>
                    <h3 className="text-[20px] md:text-[22px] font-bold mb-[20px] md:mb-[25px]">Start New Conversation</h3>
                    <div className="mb-[15px] md:mb-[20px]">
                        <label className="block text-white text-[12px] md:text-[13px] mb-[8px] font-bold">Topic</label>
                        <select value={ticketReason} onChange={(e) => setTicketReason(e.target.value)} className="w-full p-[12px] md:p-[14px] rounded-lg md:rounded-[8px] text-white outline-none" style={{ background: "#0a0a0c", border: THEME.border }}>
                            {TICKET_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="mb-[20px] md:mb-[30px]">
                        <label className="block text-white text-[12px] md:text-[13px] mb-[8px] font-bold">Message</label>
                        <textarea value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} placeholder="How can we help?" className="w-full h-[100px] md:h-[120px] p-[12px] md:p-[14px] rounded-lg md:rounded-[8px] text-white outline-none resize-none custom-scrollbar" style={{ background: "#0a0a0c", border: THEME.border }} />
                    </div>
                    <button onClick={handleSubmitTicket} disabled={loading || !initialMessage.trim()} className="w-full p-[14px] md:p-[16px] text-white border-none rounded-xl md:rounded-[10px] font-bold flex items-center justify-center gap-[10px] cursor-pointer active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale" style={{ background: THEME.accentGradient }}>
                        {loading ? <Loader2 className="animate-spin"/> : <><MessageCircle size={18}/> Start Chat</>}
                    </button>
                </div>
            )}

            {/* LIVE CHAT VIEW 3: CHAT (TELEGRAM STYLE) */}
            {view === "chat" && (
                <div className="flex flex-col h-full bg-[#050505]">
                    <div className="p-[12px_16px] md:p-[15px_25px] border-b border-white/5 flex justify-between items-center shrink-0 bg-[#0a0a0c]">
                        <div className="flex items-center gap-[10px] md:gap-[12px]">
                            <div className="relative">
                                <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-full bg-[#111] flex items-center justify-center border border-white/10"><User className="w-[16px] md:w-[20px] text-gray-400"/></div>
                                <div className="w-[10px] h-[10px] rounded-full absolute bottom-0 right-0 border-2 border-[#0a0a0c]" style={{ background: THEME.success }}></div>
                            </div>
                            <div>
                                <div className="font-bold text-[13px] md:text-[14px]">Support Agent</div>
                                <div className="text-[10px] md:text-[11px] text-[#888]">Online</div>
                            </div>
                        </div>
                        <button onClick={() => setView("menu")} className="px-[10px] py-[6px] md:px-[12px] md:py-[8px] bg-white/5 text-white border border-white/5 rounded-lg text-[10px] md:text-[11px] cursor-pointer flex items-center gap-[5px] active:bg-white/10 transition">
                            <ChevronRight style={{ transform: "rotate(180deg)" }} size={12}/> Back
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-[15px] md:p-[25px] flex flex-col gap-[12px] md:gap-[15px] bg-[#050505] custom-scrollbar">
                        {messages.map((msg, i) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div key={msg.id || i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                                    <div className="p-[10px_14px] md:p-[12px_16px] rounded-2xl text-[13px] md:text-[14px] leading-relaxed shadow-sm" 
                                        style={{ 
                                            borderBottomRightRadius: isMe ? 4 : 16, 
                                            borderBottomLeftRadius: isMe ? 16 : 4, 
                                            background: isMe ? THEME.accent : "#16161a", 
                                            border: isMe ? "none" : "1px solid rgba(255,255,255,0.05)",
                                            color: isMe ? "white" : "#ddd" 
                                        }}>
                                        {msg.message}
                                    </div>
                                    <div className="text-[9px] md:text-[10px] text-[#555] mt-[4px]" style={{ textAlign: isMe ? "right" : "left" }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-[12px] md:p-[20px] border-t border-white/5 bg-[#0a0a0c] shrink-0 pb-safe">
                        <div className="flex gap-[8px] md:gap-[10px] bg-[#151518] p-1.5 rounded-2xl border border-white/10 focus-within:border-purple-500/50 transition-colors">
                            <textarea 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Type your message..." 
                                className="flex-1 bg-transparent p-[10px] md:p-[12px] text-white outline-none text-[13px] md:text-[14px] resize-none max-h-24 custom-scrollbar"
                                rows={1}
                            />
                            <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="w-[40px] md:w-[45px] h-[40px] md:h-[45px] self-end border-none rounded-xl text-white cursor-pointer flex items-center justify-center shrink-0 transition active:scale-90 disabled:opacity-50 disabled:grayscale mb-0.5 mr-0.5" style={{ background: THEME.accent }}>
                                <Send className="w-[16px] md:w-[18px]" />
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
            console.error(error);
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
                btn.innerText = "Error";
                btn.style.background = THEME.danger;
                alert("Save failed: " + error.message);
            } else {
                btn.innerText = "Saved!";
                btn.style.background = THEME.success;
                onUpdate({ full_name: formData.fullName }); 
            }
            setTimeout(() => { 
                btn.innerText = "Save Changes"; 
                btn.style.background = "white";
            }, 2000);
        }
    };

    return (
        <div className="p-4 md:p-[30px] rounded-2xl md:rounded-[16px]" style={{ background: THEME.cardBg, border: THEME.border }}>
            <h3 className="text-[16px] md:text-[20px] mb-[15px] md:mb-[25px] pb-[10px] md:pb-[15px] border-b border-white/5 font-bold">General Information</h3>
            
            <div className="flex items-center gap-[15px] md:gap-[20px] mb-[20px] md:mb-[30px]">
                <div className="relative w-[60px] h-[60px] md:w-[80px] md:h-[80px]">
                    <div className="w-full h-full rounded-full bg-[#333] overflow-hidden flex items-center justify-center shrink-0" style={{ border: `2px solid ${THEME.accent}` }}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[20px] md:text-[24px] font-bold text-white">{formData.fullName?.[0] || "U"}</span>
                        )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-[4px] md:p-[6px] cursor-pointer text-black shadow-lg">
                        {uploading ? <Loader2 size={12} className="animate-spin md:w-3.5 md:h-3.5"/> : <Camera size={12} className="md:w-3.5 md:h-3.5" />}
                    </label>
                    {/* GOD LEVEL FIX: capture="user" forces front camera on mobile */}
                    <input type="file" id="avatar-upload" accept="image/*" capture="user" onChange={handleAvatarUpload} className="hidden" disabled={uploading}/>
                </div>
                <div>
                    <div className="font-bold text-[14px] md:text-[16px]">Profile Photo</div>
                    <div className="text-[10px] md:text-[12px] text-[#888]">Click camera icon to change</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[20px]">
                <InputGroup label="Full Name" value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} placeholder="Your Name" />
                <InputGroup label="Email Address" value={formData.email} onChange={() => {}} disabled={true} />
                <InputGroup label="Address" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
                <div>
                    <label className="block text-[#888] text-[10px] md:text-[12px] mb-[6px] md:mb-[8px] uppercase font-bold tracking-wider">Country</label>
                    <select value={formData.country} onChange={(e: any) => setFormData({...formData, country: e.target.value})} className="w-full p-[12px] md:p-[14px] bg-[#0a0a0c] rounded-xl md:rounded-[8px] text-white outline-none cursor-pointer appearance-none text-[12px] md:text-sm h-[44px] md:h-auto" style={{ border: THEME.border }}>
                        {COUNTRIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <InputGroup label="City" value={formData.city} onChange={(e: any) => setFormData({...formData, city: e.target.value})} />
                <InputGroup label="Postal Code" value={formData.zip} onChange={(e: any) => setFormData({...formData, zip: e.target.value})} />
            </div>
            <div className="mt-[20px] md:mt-[30px] text-right">
                <button id="save-btn" onClick={handleSave} className="w-full md:w-auto p-[14px] md:p-[12px_30px] bg-white text-black border-none rounded-xl md:rounded-[8px] font-bold cursor-pointer text-[13px] md:text-sm active:scale-95 transition-transform">Save Changes</button>
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
    
    // GOD LEVEL FIX: Adding 'capture' to automatically prompt the camera on mobile
    const handleFileSelect = (side: string) => { 
        const input = document.createElement("input"); 
        input.type = "file"; 
        input.accept = "image/*"; 
        input.capture = "environment"; // Forces rear camera on mobile
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
            console.error(error);
            alert("Upload failed: " + error.message);
            setLoading(false);
        }
    };
    
    const getStatusColor = () => { if (status === "Verified") return THEME.success; if (status === "Pending") return THEME.warning; if (status === "Rejected") return THEME.danger; return "#666"; };
    
    return (
        <div className="p-4 md:p-[30px] rounded-2xl md:rounded-[16px]" style={{ background: THEME.cardBg, border: THEME.border }}>
            <div className="grid gap-[10px]">
                <VerificationItem label="Personal Information" status="Completed" icon={<Check size={16} />} color={THEME.success} />
                <div className="p-4 md:p-[20px] rounded-xl md:rounded-[8px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
                        <span className="font-bold md:font-medium text-[13px] md:text-base text-white">Identity Verification</span>
                        <div className="flex items-center gap-[6px] md:gap-[10px]">
                            <span className="text-[10px] md:text-[13px] font-bold uppercase tracking-wider" style={{ color: getStatusColor() }}>{status}</span>
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#666] transition-transform duration-200" style={{ transform: expanded ? "rotate(90deg)" : "none" }} />
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {expanded && status === "Not Verified" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-[15px] pt-[15px] md:mt-[20px] md:pt-[20px] border-t border-white/5">
                                    
                                    {/* Responsive Doc Type Selector */}
                                    <div className="flex gap-[10px] mb-[15px] md:mb-[20px]">
                                        <button onClick={() => { setDocType("passport"); setFrontFile(null); setBackFile(null); }} className="flex-1 p-[10px] md:p-[15px] rounded-xl md:rounded-[8px] flex flex-col items-center justify-center gap-[6px] md:gap-[10px] cursor-pointer text-white transition-all active:scale-95" style={{ border: docType === "passport" ? `1px solid ${THEME.accent}` : "1px solid #333", background: docType === "passport" ? "rgba(139, 92, 246, 0.1)" : "rgba(0,0,0,0.2)" }}>
                                            <Globe className="w-5 h-5 md:w-6 md:h-6" style={{ color: docType === "passport" ? THEME.accent : "#666" }} />
                                            <div className="text-[11px] md:text-[12px] font-bold">Passport</div>
                                        </button>
                                        <button onClick={() => { setDocType("id"); setFrontFile(null); setBackFile(null); }} className="flex-1 p-[10px] md:p-[15px] rounded-xl md:rounded-[8px] flex flex-col items-center justify-center gap-[6px] md:gap-[10px] cursor-pointer text-white transition-all active:scale-95" style={{ border: docType === "id" ? `1px solid ${THEME.accent}` : "1px solid #333", background: docType === "id" ? "rgba(139, 92, 246, 0.1)" : "rgba(0,0,0,0.2)" }}>
                                            <FileText className="w-5 h-5 md:w-6 md:h-6" style={{ color: docType === "id" ? THEME.accent : "#666" }} />
                                            <div className="text-[11px] md:text-[12px] font-bold text-center">ID Card / License</div>
                                        </button>
                                    </div>

                                    {/* Upload Zones */}
                                    <div className="grid gap-[10px] md:gap-[15px] mb-[20px] md:mb-[25px]">
                                        <div onClick={() => handleFileSelect("front")} className="p-[20px] rounded-xl md:rounded-[10px] text-center cursor-pointer transition-all active:bg-white/5" style={{ border: `2px dashed ${frontFile ? THEME.success : "#444"}`, background: frontFile ? "rgba(16,185,129,0.05)" : "transparent" }}>
                                            {frontFile ? 
                                                <div className="flex items-center justify-center gap-[8px] md:gap-[10px] text-[11px] md:text-sm break-all" style={{ color: THEME.success }}><CheckCircle size={16} className="shrink-0 md:w-[18px] md:h-[18px]"/> <span className="truncate max-w-[200px]">{frontFile.name}</span></div> : 
                                                <div className="flex flex-col items-center gap-[5px] text-[11px] md:text-sm font-bold" style={{ color: "#888" }}><Camera size={20} className="mb-1 md:w-6 md:h-6"/> <span>Tap to Scan {docType === "passport" ? "Passport" : "Front of ID"}</span></div>
                                            }
                                        </div>
                                        {docType === "id" && (
                                            <div onClick={() => handleFileSelect("back")} className="p-[20px] rounded-xl md:rounded-[10px] text-center cursor-pointer transition-all active:bg-white/5" style={{ border: `2px dashed ${backFile ? THEME.success : "#444"}`, background: backFile ? "rgba(16,185,129,0.05)" : "transparent" }}>
                                                {backFile ? 
                                                    <div className="flex items-center justify-center gap-[8px] md:gap-[10px] text-[11px] md:text-sm break-all" style={{ color: THEME.success }}><CheckCircle size={16} className="shrink-0 md:w-[18px] md:h-[18px]"/> <span className="truncate max-w-[200px]">{backFile.name}</span></div> : 
                                                    <div className="flex flex-col items-center gap-[5px] text-[11px] md:text-sm font-bold" style={{ color: "#888" }}><Camera size={20} className="mb-1 md:w-6 md:h-6"/> <span>Tap to Scan Back of ID</span></div>
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <button disabled={!canSubmit || loading} onClick={handleSubmit} className="w-full p-[14px] md:p-[16px] rounded-xl md:rounded-[10px] border-none font-bold flex justify-center items-center gap-[10px] transition-all text-[12px] md:text-sm active:scale-95" style={{ background: canSubmit ? THEME.accentGradient : "#333", color: canSubmit ? "white" : "#666", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                                        {loading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : "Process Verification"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {expanded && status === "Pending" && <div className="p-[20px] md:p-[30px] text-center" style={{ color: THEME.warning }}><div className="animate-pulse mb-[10px] text-2xl md:text-3xl">⏳</div><div className="font-bold text-[13px] md:text-base">Verification Pending</div><div className="text-[10px] md:text-[12px] text-[#888] mt-1">We are reviewing your documents. Usually takes 24h.</div></div>}
                        {expanded && status === "Verified" && <div className="p-[20px] md:p-[30px] text-center" style={{ color: THEME.success }}><CheckCircle className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-[10px]" /><div className="font-bold text-[13px] md:text-base">Identity Verified</div><div className="text-[10px] md:text-[12px] text-[#888] mt-1">You are fully verified and approved.</div></div>}
                        {expanded && status === "Rejected" && <div className="p-[20px] md:p-[30px] text-center" style={{ color: THEME.danger }}><X className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-[10px]" /><div className="font-bold text-[13px] md:text-base">Verification Rejected</div><div className="text-[10px] md:text-[12px] text-[#888] mt-1">Please re-upload clearer documents.</div></div>}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const PaymentMethodsTab = () => {
    const [showModal, setShowModal] = useState(false);
    const [cards, setCards] = useState<any[]>([]);
    const [cardNum, setCardNum] = useState("");
    const saveCard = () => { if(cardNum.length < 12) return alert("Invalid Card Number"); setCards([...cards, { last4: cardNum.slice(-4) }]); setShowModal(false); };
    
    return (
        <>
            <div className="p-5 md:p-[40px] rounded-2xl md:rounded-[16px] text-center" style={{ background: THEME.cardBg, border: THEME.border }}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-[15px] md:gap-0 mb-[20px] md:mb-[30px]">
                    <h3 className="text-[16px] md:text-[20px] font-bold">Payment Methods</h3>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-[8px] bg-transparent border-none font-bold cursor-pointer text-[12px] md:text-sm transition hover:opacity-80 active:scale-95 p-2" style={{ color: THEME.accent }}>
                        <Plus size={16} className="md:w-[18px] md:h-[18px]" /> Add New Card
                    </button>
                </div>
                {cards.length === 0 ? (
                    <div className="p-[30px] md:p-[40px] rounded-xl md:rounded-[12px] text-[#666] text-[12px] md:text-sm" style={{ border: "2px dashed rgba(255,255,255,0.1)" }}>
                        No payment methods added yet.
                    </div>
                ) : (
                    <div className="grid gap-[10px] md:gap-[15px]">
                        {cards.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-[15px] md:p-[20px] rounded-xl md:rounded-[12px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center gap-[12px] md:gap-[20px]">
                                    <CreditCard className="w-5 h-5 md:w-8 md:h-8" color="#888" />
                                    <div className="text-left">
                                        <div className="font-mono text-[12px] md:text-[16px] tracking-[1px] md:tracking-[2px]">**** **** **** {c.last4}</div>
                                        <div className="text-[9px] md:text-[11px] text-[#666] mt-0.5">Expires 12/28</div>
                                    </div>
                                </div>
                                <button onClick={() => setCards(cards.filter((_, idx) => idx !== i))} className="bg-transparent border-none cursor-pointer opacity-70 hover:opacity-100 p-[5px] transition active:scale-90" style={{ color: THEME.danger }}>
                                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/85 z-[100] flex items-end md:items-center justify-center backdrop-blur-md p-0 md:p-5 touch-none">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{type:"spring", damping:25}} className="bg-[#0f0f12] w-full md:w-[95%] max-w-[500px] p-[20px] md:p-[30px] rounded-t-3xl md:rounded-[24px] border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-center mb-[20px] md:mb-[25px]">
                                <h3 className="text-[16px] md:text-[20px] font-bold">Add Credit Card</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 md:hidden text-gray-500"><X size={20}/></button>
                            </div>
                            <div className="grid gap-[12px] md:gap-[20px]">
                                <InputGroup label="Card Number" value={cardNum} onChange={(e: any) => setCardNum(e.target.value)} placeholder="0000 0000 0000 0000" type="number" />
                                <InputGroup label="Card Holder" placeholder="JOHN DOE" />
                                <div className="flex gap-[12px] md:gap-[15px]">
                                    <div className="flex-1"><InputGroup label="Expiration" placeholder="MM/YY" /></div>
                                    <div className="flex-1"><InputGroup label="CVV" placeholder="***" type="password" /></div>
                                </div>
                            </div>
                            <div className="mt-[20px] md:mt-[30px] flex gap-[10px]">
                                <button onClick={() => setShowModal(false)} className="flex-1 md:flex-none px-[16px] py-[12px] md:px-[20px] bg-transparent border border-[#333] text-white rounded-xl md:rounded-[8px] cursor-pointer text-[12px] md:text-sm active:bg-white/5">Cancel</button>
                                <button onClick={saveCard} className="flex-[2] md:flex-none px-[20px] py-[12px] md:px-[30px] bg-white text-black border-none rounded-xl md:rounded-[8px] font-bold cursor-pointer text-[12px] md:text-sm active:bg-gray-300">Save Card</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
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
        <div className="grid gap-[20px] md:gap-[30px]">
            <div className="p-5 md:p-[30px] rounded-2xl md:rounded-[16px]" style={{ background: THEME.cardBg, border: THEME.border }}>
                <h3 className="text-[16px] md:text-[18px] mb-[15px] md:mb-[20px] font-bold border-b border-white/5 pb-3">Change Password</h3>
                <div className="grid gap-[15px]">
                    <InputGroup label="New Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="text-right mt-[20px]">
                    <button onClick={handleUpdatePassword} disabled={loading} className="w-full md:w-auto px-[20px] py-[14px] md:px-[30px] md:py-[12px] bg-white text-black border-none rounded-xl md:rounded-[8px] font-bold cursor-pointer text-[13px] md:text-sm transition hover:opacity-90 active:scale-95">
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, name, placeholder, icon, type = "text", disabled = false }: any) => (
    <div>
        <label className="block text-[#888] text-[10px] md:text-[12px] mb-[6px] md:mb-[8px] uppercase font-bold tracking-wider">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                name={name} 
                value={value} 
                onChange={onChange} 
                disabled={disabled} 
                placeholder={placeholder} 
                className="w-full p-[12px] md:p-[14px] rounded-xl md:rounded-[8px] outline-none text-[12px] md:text-sm transition-all h-[44px] md:h-auto" 
                style={{ 
                    paddingRight: icon ? 40 : 14, 
                    background: disabled ? "#111" : "#0a0a0c", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    color: disabled ? "#666" : "white" 
                }} 
            />
            {icon && <div className="absolute right-[12px] top-[12px] text-[#666]">{icon}</div>}
        </div>
    </div>
);

const VerificationItem = ({ label, status, icon, color }: any) => (
    <div className="flex justify-between items-center p-4 md:p-[20px] rounded-xl md:rounded-[8px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="font-bold md:font-medium text-[13px] md:text-base text-white">{label}</span>
        <div className="flex items-center gap-[6px] md:gap-[8px]">
            <div className="p-1 rounded-full shrink-0" style={{ background: `${color}20`, color: color }}>{icon}</div>
            <span className="text-[10px] md:text-[13px] font-bold md:font-normal uppercase tracking-wider" style={{ color: color }}>{status}</span>
        </div>
    </div>
);