"use client";
import React, { useEffect, useRef, useState } from "react";
import { Mail, Trash2, Send, Volume2, VolumeX, ArrowLeft, MoreVertical } from "lucide-react"; 

// 🛡️ PERF FIX: the reply textarea keeps its text in LOCAL state inside this isolated,
// memoized box. Before, every keystroke updated state on the portal page, re-rendering the
// entire page tree and every message bubble — with long conversations that made typing lag
// badly. Now a keystroke re-renders only this small component. Markup/classes are identical.
const ChatInputBox = React.memo(function ChatInputBox({ onSend }: any) {
    const [text, setText] = useState("");

    const send = () => {
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    return (
        <div className="p-3 md:p-4 bg-[#0a0a0c] border-t border-white/5 shrink-0 z-20 pb-4">
            <div className="relative flex items-end gap-2 bg-[#151518] border border-white/10 rounded-2xl p-1.5 focus-within:border-blue-500/50 transition-colors">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    placeholder="Type your reply..."
                    className="w-full bg-transparent p-3 text-[13px] md:text-sm text-white outline-none resize-none max-h-32 min-h-[44px] custom-scrollbar placeholder:text-gray-600"
                    rows={1}
                />
                <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="p-3.5 bg-blue-600 rounded-xl text-white active:bg-blue-500 md:hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 mb-0.5 mr-0.5"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
});

export default function SupportChat({
    conversations, activeConversation, setActiveConversation,
    sendMessage, deleteChat, markAsRead,
    activeChatData, isMuted, setIsMuted
}: any) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");

    // Auto-scroll effect
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [activeChatData?.messages, activeConversation]);

    // Handle switching to chat view on mobile when a conversation is selected
    useEffect(() => {
        if (activeConversation) {
            setMobileView("chat");
        } else {
            setMobileView("list");
        }
    }, [activeConversation]);

    return (
        // FIX: Using a much more stable dynamic height that respects mobile keyboards
        <div className="flex h-[75vh] min-h-[500px] md:h-[700px] w-full bg-[#050505] rounded-xl overflow-hidden border border-white/5 relative">
            
            {/* Left: Conversation List (Strictly hidden on mobile if viewing chat) */}
            <div className={`w-full md:w-1/3 lg:w-[320px] border-r border-white/5 bg-black/20 flex-col shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 md:p-6 border-b border-white/5 shrink-0 bg-[#0a0a0c]">
                    <h2 className="font-bold text-base md:text-lg flex items-center gap-2 text-white">
                        <Mail size={18} className="text-blue-500"/> Inbox
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center text-gray-600 text-xs">No active tickets.</div>
                    ) : (
                        conversations.map((conv: any) => (
                            <div 
                                key={conv.userId} 
                                onClick={() => { setActiveConversation(conv.userId); markAsRead(conv.userId); }}
                                className={`p-4 border-b border-white/5 cursor-pointer md:hover:bg-white/5 active:bg-white/10 transition ${activeConversation === conv.userId ? "bg-white/5 border-l-2 border-l-blue-500" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold truncate pr-2 ${conv.hasUnread ? "text-white" : "text-gray-400"}`}>
                                        {conv.email && conv.email !== "No Email" ? conv.email : conv.name}
                                    </span>
                                    <span className="text-[10px] text-gray-600 whitespace-nowrap mt-0.5">{conv.lastTime}</span>
                                </div>
                                <div className="text-[11px] md:text-xs text-blue-400 mb-1 font-bold tracking-wide truncate">{conv.subject}</div>
                                <div className="text-[11px] md:text-xs text-gray-500 truncate pr-4 relative">
                                    {conv.lastMessage}
                                    {conv.hasUnread && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Chat Window (Strictly hidden on mobile if viewing list) */}
            <div className={`flex-1 flex-col bg-[#050505] relative z-10 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {activeConversation && activeChatData ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 md:p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0c] shrink-0 shadow-md z-20">
                            <div className="flex items-center gap-3 overflow-hidden pr-2">
                                {/* Mobile Back Button (Highly tappable) */}
                                <button 
                                    onClick={() => { setActiveConversation(null); setMobileView("list"); }} 
                                    className="md:hidden p-2.5 -ml-2 text-gray-400 active:text-white rounded-lg active:bg-white/10 transition"
                                >
                                    <ArrowLeft size={22} className="text-white" />
                                </button>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-white text-sm md:text-base truncate">{activeChatData.email}</div>
                                    <div className="text-[10px] md:text-xs text-gray-500 truncate">{activeChatData.name} • <span className="text-blue-400">{activeChatData.subject}</span></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                <div className="flex items-center gap-1.5 md:gap-2 mr-2 md:mr-0">
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                    <span className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold hidden sm:inline-block">Live</span>
                                </div>

                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-2.5 md:px-3 md:py-1.5 rounded-lg transition border flex items-center justify-center gap-2 text-[10px] font-bold ${isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}
                                    title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
                                >
                                    {isMuted ? <VolumeX size={16} className="md:w-4 md:h-4" /> : <Volume2 size={16} className="md:w-4 md:h-4" />}
                                    <span className="hidden md:inline">{isMuted ? "MUTED" : "SOUND ON"}</span>
                                </button>
                                
                                <button onClick={deleteChat} className="p-2.5 bg-red-500/10 active:bg-red-500/20 md:hover:bg-red-500 text-red-500 md:hover:text-white rounded-lg transition border border-red-500/20" title="Delete Conversation">
                                    <Trash2 size={18} className="md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#050505] z-10">
                            {activeChatData.messages.map((msg: any) => {
                                const isMe = msg.sender_id !== activeConversation;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] md:max-w-[75%] p-3.5 md:p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-sm break-words ${isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#16161a] text-gray-200 border border-white/5 rounded-bl-sm"}`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Input Area (SafeArea applied for iOS/Android keyboards) */}
                        <ChatInputBox onSend={sendMessage} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#050505] hidden md:flex">
                        <Mail size={48} className="mb-4 opacity-20"/>
                        <p className="text-sm">Select a conversation to view details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}