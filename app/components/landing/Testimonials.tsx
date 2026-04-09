"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, AlertCircle, CheckCircle, ShieldCheck, MapPin, Terminal as TerminalIcon, FileDigit } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// I. CONFIGURATION & DATA 
// ═══════════════════════════════════════════════════════════════════════════════

interface Review {
    id: string;
    name: string;
    location: string;
    rating: number;
    title: string;
    text: string;
    experienceDate: string;
    postedDateDisplay: string;
    avatarUrl: string;
    status: string;
    isPending?: boolean;
}

const SEED_REVIEWS: Review[] = [
    {
        id: "rv-001",
        name: "James T.",
        location: "London, UK",
        rating: 5,
        title: "They did what they said",
        text: "I honestly didnt expect it to work but they tracked the funds and helped me recover. Updates were clear and fast.",
        experienceDate: "2025-11-18",
        postedDateDisplay: "2 days ago",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        status: "approved"
    },
    {
        id: "rv-002",
        name: "Elena V.",
        location: "Limassol, CY",
        rating: 5,
        title: "Good communication",
        text: "They explained the process step by step. I was nervous but the support team answered me every time.",
        experienceDate: "2025-12-02",
        postedDateDisplay: "3 days ago",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        status: "approved"
    },
    {
        id: "rv-003",
        name: "Lukas S.",
        location: "Hamburg, DE",
        rating: 4,
        title: "Recovered 60%, not all",
        text: "We could not recover 100% because some went to a mixer. But 60% back is still massive. Took longer than I wanted though.",
        experienceDate: "2025-10-21",
        postedDateDisplay: "5 days ago",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
        status: "approved"
    }
];

const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ═══════════════════════════════════════════════════════════════════════════════
// II. MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Testimonials() {
    const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banner, setBanner] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [reviewForm, setReviewForm] = useState({ 
        name: "",
        rating: 5, 
        title: "", 
        text: "", 
        experienceDate: "", 
        location: "" 
    });

    useEffect(() => {
        if (banner) {
            const t = setTimeout(() => setBanner(null), 5000);
            return () => clearTimeout(t);
        }
    }, [banner]);

    const handleSubmitReview = async () => {
        if (!reviewForm.title || !reviewForm.text || !reviewForm.experienceDate || !reviewForm.name) {
            setBanner({ type: "error", message: "Incomplete Parameters." });
            return;
        }

        setIsSubmitting(true);
        
        // Simulating logic delay for the demo
        setTimeout(() => {
            const newReview: Review = {
                id: `rv-pending-${Date.now()}`,
                name: reviewForm.name,
                location: reviewForm.location || "Global Jurisdiction",
                rating: reviewForm.rating,
                title: reviewForm.title,
                text: reviewForm.text,
                experienceDate: reviewForm.experienceDate,
                postedDateDisplay: "Pending Audit",
                status: "pending",
                isPending: true,
                avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=80"
            };

            setReviews(prev => [newReview, ...prev]);
            setBanner({ type: "success", message: "Data logged. Awaiting audit." });
            setReviewForm({ name: "", rating: 5, title: "", text: "", experienceDate: "", location: "" });
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <section id="testimonials" className="w-full py-24 md:py-32 relative overflow-hidden bg-[#030305] border-t border-blue-900/30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            
            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 relative z-10">
                
                {/* HEADER */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-blue-900/30 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4 px-3 py-1 bg-[#0A0A0E] border border-blue-900/50 w-fit">
                            <FileDigit className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.4em] font-bold">03 // Resolution Log</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                            Declassified <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Dossiers</span>
                        </h2>
                        <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">
                            Immutable records of successful asset extraction and client repatriation.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 border border-blue-900/30 bg-[#050508] p-4">
                        <div className="flex flex-col">
                            <span className="text-lg text-white font-black leading-none mb-1">4.8/5.0</span>
                            <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">VERIFIED RESOLUTIONS</span>
                        </div>
                        <div className="w-px h-8 bg-blue-900/50" />
                        <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= 4 ? "#22d3ee" : "none"} className="text-cyan-400" />)}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {banner && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-8 px-4 py-3 border flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest ${banner.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {banner.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {banner.message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* LEFT PANEL: SUBMISSION TERMINAL (Login removed) */}
                    <div className="w-full lg:w-[400px] bg-[#050508] border border-blue-900/40 shrink-0 sticky top-24 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="p-4 border-b border-blue-900/40 flex items-center gap-2 bg-[#0A0A0E]">
                            <TerminalIcon size={14} className="text-blue-500" />
                            <h3 className="text-white font-bold text-[10px] uppercase tracking-[0.3em]">Append Case Record</h3>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Client Designation</label>
                                <input type="text" placeholder="FULL_NAME" className="w-full bg-[#0A0A0E] border border-blue-900/50 h-10 px-3 text-[10px] font-mono text-white focus:border-cyan-400 outline-none uppercase tracking-widest placeholder:text-zinc-700" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Execution Rating</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(i => (
                                        <button key={i} onClick={() => setReviewForm({...reviewForm, rating: i})} className={`flex-1 h-8 flex items-center justify-center border transition-all text-[10px] font-mono ${reviewForm.rating >= i ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-[#0A0A0E] border-blue-900/30 text-zinc-600'}`}>
                                            [{i}]
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Incident Date</label>
                                    <input type="date" className="w-full bg-[#0A0A0E] border border-blue-900/50 h-10 px-3 text-[10px] font-mono text-white focus:border-cyan-400 outline-none [color-scheme:dark]" value={reviewForm.experienceDate} onChange={e => setReviewForm({...reviewForm, experienceDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Jurisdiction</label>
                                    <input type="text" placeholder="e.g. London, UK" className="w-full bg-[#0A0A0E] border border-blue-900/50 h-10 px-3 text-[10px] font-mono text-white focus:border-cyan-400 outline-none placeholder:text-zinc-700 uppercase" value={reviewForm.location} onChange={e => setReviewForm({...reviewForm, location: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Operation Title</label>
                                <input type="text" placeholder="ENTER CLASSIFICATION..." className="w-full bg-[#0A0A0E] border border-blue-900/50 h-10 px-3 text-[10px] font-mono text-white focus:border-cyan-400 outline-none placeholder:text-zinc-700 uppercase" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">After Action Report</label>
                                <textarea placeholder="LOG DETAILS HERE..." className="w-full bg-[#0A0A0E] border border-blue-900/50 h-24 p-3 text-[10px] font-mono text-white focus:border-cyan-400 outline-none placeholder:text-zinc-700 resize-none uppercase" value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} />
                            </div>

                            <button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black h-12 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] transition-all mt-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Transmit to Ledger"}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: FEED */}
                    <div className="flex-1 w-full h-[600px] lg:h-[800px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a8a transparent' }}>
                        <div className="flex flex-col gap-6">
                            {reviews.map((r, i) => (
                                <ClientOutcomeCard key={r.id || i} data={r} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

const ClientOutcomeCard = ({ data }: { data: Review }) => (
    <div className={`relative p-5 md:p-6 bg-[#050508] border flex flex-col transition-all duration-500 group ${
        data.isPending ? 'border-orange-500/30' : 'border-blue-900/30 hover:border-cyan-500/50'
    }`}>
        <div className="absolute top-0 left-8 w-px h-full bg-blue-900/20 pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-blue-900/30 pb-3 mb-4 pl-12 relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px bg-cyan-500/50" />
           <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
             ID: {data.id} // {formatDate(data.experienceDate)}
           </div>
           {data.isPending ? (
             <div className="text-[8px] text-orange-400 border border-orange-500/30 px-2 py-0.5 uppercase tracking-widest font-mono bg-orange-500/10">Pending</div>
           ) : (
             <div className="text-[8px] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 uppercase tracking-widest font-mono flex items-center gap-1 bg-cyan-500/5">
                 <ShieldCheck size={10} /> Verified
             </div>
           )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 pl-4 md:pl-12">
            <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="w-14 h-14 border border-blue-500/30 p-1 bg-[#0A0A0E] relative overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                    <div className="absolute inset-0 bg-cyan-500 mix-blend-color z-10 opacity-40 group-hover:opacity-10 transition-opacity" />
                    <img src={data.avatarUrl} className="w-full h-full object-cover grayscale contrast-125" alt={data.name} />
                </div>
                <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-2 h-2 ${i <= data.rating ? 'bg-cyan-400' : 'bg-blue-900/30'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
                    <div>
                       <div className="text-[10px] text-blue-500 font-mono uppercase tracking-widest mb-0.5">Entity / Jurisdiction</div>
                       <div className="text-white font-black text-sm uppercase tracking-wider">{data.name}</div>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1">
                       <MapPin size={10} className="text-cyan-400" /> {data.location}
                    </div>
                </div>

                <div className="bg-[#0A0A0E] border border-blue-900/30 p-4">
                    <h4 className="text-cyan-300 font-bold text-[11px] uppercase tracking-widest mb-2 border-b border-blue-900/30 pb-2">{data.title}</h4>
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-mono uppercase">
                        {data.text}
                    </p>
                </div>
            </div>
        </div>
    </div>
);