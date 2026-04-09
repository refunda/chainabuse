"use client";
import React, { useMemo } from "react";
import { Users, Search, Loader2, Settings, Activity, Globe } from "lucide-react"; // Added Globe import

export default function ClientTable({ search, setSearch, loading, filteredClients, openManager, openActivities, unreadActivities }: any) {
    
    // Sort clients so those with unread activities automatically bubble to the top
    const sortedClients = useMemo(() => {
        if (!filteredClients || !unreadActivities) return filteredClients;
        
        return [...filteredClients].sort((a: any, b: any) => {
            const aPending = unreadActivities[a.id] || 0;
            const bPending = unreadActivities[b.id] || 0;
            
            return bPending - aPending;
        });
    }, [filteredClients, unreadActivities]);

    return (
        <div className="flex flex-col h-full">
            
            {/* STICKY HEADER: Keeps the search bar accessible while scrolling through clients */}
            <div className="sticky top-0 z-10 bg-[#0a0a0c]/90 backdrop-blur-md p-4 md:p-6 lg:p-8 border-b border-white/5 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3"><Users className="text-purple-500 w-5 h-5 md:w-6 md:h-6"/> My Client Database</h2>
                        <p className="text-gray-500 text-xs md:text-sm mt-1">Manage verification, wallet overrides & recovery.</p>
                    </div>
                    
                    {/* SEARCH BAR: Full width on mobile, highly tappable */}
                    <div className="bg-black/60 border border-white/10 flex items-center px-4 rounded-xl w-full md:w-72 h-12 focus-within:border-purple-500 transition shadow-inner">
                        <Search size={16} className="text-gray-500 mr-2 shrink-0"/>
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by name or email..." 
                            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-700 h-full"
                        />
                    </div>
                </div>
            </div>

            {/* SCROLLABLE LIST AREA */}
            <div className="p-4 md:p-6 lg:p-8 flex-1">
                
                {/* DESKTOP VIEW: Normal Table */}
                <div className="hidden lg:block rounded-xl border border-white/5 overflow-hidden bg-[#111]">
                    <table className="w-full">
                        <thead className="bg-black/40 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="p-5 text-left border-b border-white/5">Identity</th>
                                <th className="p-5 text-left border-b border-white/5">Status</th>
                                <th className="p-5 text-right border-b border-white/5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? <tr><td colSpan={3} className="p-16 text-center text-gray-600"><Loader2 className="animate-spin mx-auto mb-3 w-6 h-6"/>Fetching records...</td></tr> : 
                            sortedClients.length === 0 ? <tr><td colSpan={3} className="p-16 text-center text-gray-600">No clients found matching criteria.</td></tr> :
                            sortedClients.map((c: any) => {
                                const pendingCount = unreadActivities ? (unreadActivities[c.id] || 0) : 0;
                                const hasPendingActivity = pendingCount > 0;

                                return (
                                    <tr key={c.id} className={`transition group ${hasPendingActivity ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="p-5">
                                            <div className="font-bold text-white group-hover:text-purple-400 transition flex items-center gap-2">
                                                {c.full_name || "Unknown User"}
                                                {hasPendingActivity && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">{c.email}</div>
                                            
                                            {/* 🛡️ NEW CURRENCY TAG */}
                                            <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
                                                <Globe size={10}/> {c.preferred_currency || 'USD'}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${c.kyc_status === 'verified' ? 'bg-green-500/10 border-green-500/20 text-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${c.kyc_status === 'verified' ? 'bg-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                {c.kyc_status ? c.kyc_status.toUpperCase() : "PENDING"}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right flex items-center justify-end gap-3">
                                            <button onClick={() => openActivities(c)} className="relative bg-transparent hover:bg-white/5 active:bg-white/10 text-[#3b82f6] border border-[#1e293b] px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2">
                                                <Activity size={14} /> ACTIVITIES
                                                {hasPendingActivity && (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full shadow-[0_0_0_2px_#111] px-1 animate-bounce">
                                                        {pendingCount}
                                                    </span>
                                                )}
                                            </button>
                                            <button onClick={() => openManager(c)} className="bg-transparent hover:bg-white/5 active:bg-white/10 text-white border border-[#333] px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2">
                                                <Settings size={14} /> CONFIGURE
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: Cards */}
                <div className="lg:hidden flex flex-col gap-4 pb-20">
                    {loading ? (
                        <div className="p-12 text-center text-gray-600 flex flex-col items-center">
                            <Loader2 className="animate-spin mb-3 w-6 h-6"/> Fetching records...
                        </div>
                    ) : sortedClients.length === 0 ? (
                        <div className="p-10 text-center text-gray-600 bg-[#0f0f11] rounded-2xl border border-white/5 shadow-lg">
                            No clients found matching your search.
                        </div>
                    ) : (
                        sortedClients.map((c: any) => {
                            const pendingCount = unreadActivities ? (unreadActivities[c.id] || 0) : 0;
                            const hasPendingActivity = pendingCount > 0;

                            return (
                                <div key={c.id} className={`bg-[#111] p-4 md:p-5 rounded-2xl border border-white/5 shadow-lg ${hasPendingActivity ? 'bg-blue-900/10 border-blue-500/30' : ''}`}>
                                    
                                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                        <div className="overflow-hidden pr-3 flex-1">
                                            <div className="font-bold text-white flex items-center gap-2 text-sm md:text-base truncate">
                                                <span className="truncate">{c.full_name || "Unknown User"}</span>
                                                {hasPendingActivity && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>}
                                            </div>
                                            <div className="text-[11px] md:text-xs text-gray-500 font-mono mt-1.5 truncate">{c.email}</div>
                                            
                                            {/* 🛡️ NEW CURRENCY TAG */}
                                            <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
                                                <Globe size={10}/> {c.preferred_currency || 'USD'}
                                            </div>
                                        </div>
                                        <div className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-bold border ${c.kyc_status === 'verified' ? 'bg-green-500/10 border-green-500/20 text-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.kyc_status === 'verified' ? 'bg-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                            {c.kyc_status ? c.kyc_status.toUpperCase() : "PENDING"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => openActivities(c)} className="relative w-full bg-transparent hover:bg-white/5 active:bg-white/10 text-[#3b82f6] border border-[#1e293b] h-12 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2">
                                            <Activity size={14} className="shrink-0" /> <span className="truncate">ACTIVITIES</span>
                                            {hasPendingActivity && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full shadow-[0_0_0_2px_#111] px-1 animate-bounce">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </button>
                                        <button onClick={() => openManager(c)} className="w-full bg-transparent hover:bg-white/5 active:bg-white/10 text-white border border-[#333] h-12 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2">
                                            <Settings size={14} className="shrink-0" /> <span className="truncate">CONFIG</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}