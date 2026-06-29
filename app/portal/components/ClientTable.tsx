"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Users, Search, Loader2, Settings, Activity, Globe, Trash2 } from "lucide-react";

// 🛡️ FIX: shared Supabase instance (no second createClient → no GoTrueClient warning)
import { supabase } from "../../../lib/supabase/client";

const CURRENCY_INFO: Record<string, { symbol: string }> = {
    USD: { symbol: "$" }, EUR: { symbol: "€" }, GBP: { symbol: "£" },
    CAD: { symbol: "C$" }, AUD: { symbol: "A$" }, JPY: { symbol: "¥" },
    CNY: { symbol: "¥" }, CHF: { symbol: "CHF" }, HKD: { symbol: "HK$" },
    SGD: { symbol: "S$" }, INR: { symbol: "₹" }, AED: { symbol: "د.إ" },
    SAR: { symbol: "﷼" }, MXN: { symbol: "$" }, BRL: { symbol: "R$" },
};

export default function ClientTable({ search, setSearch, loading, filteredClients, openManager, openActivities, unreadActivities, refreshData }: any) {
    
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
    const [marketPrices, setMarketPrices] = useState<Record<string, number>>({ USDT: 1, USDC: 1 });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // throttle the firehose of ticker frames into state
    const pricesRef = useRef<Record<string, number>>({ USDT: 1, USDC: 1 });

    // --- FIAT RATES (for currency conversion of the displayed total) ---
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await res.json();
                if (data && data.rates) setExchangeRates(data.rates);
            } catch (err) {
                console.error("Fiat rate fetch failed", err);
            }
        };
        fetchRates();
    }, []);

    // --- LIVE CRYPTO PRICES ---
    // FIX: previously this used the REST endpoint api.binance.com/api/v3/ticker/price for only 8
    // hardcoded coins, once on mount. REST is geo/CORS-throttled in some regions (the websocket
    // isn't — that's why the navbar worked but this didn't) and any coin outside the 8 was valued
    // at 0. We now use the SAME stream as the navbar ticker (!miniTicker@arr), so every coin is
    // priced live and the admin totals match the client's Assets page.
    useEffect(() => {
        pricesRef.current['USDT'] = 1;
        pricesRef.current['USDC'] = 1;

        let ws: WebSocket | null = null;
        let isActive = true;
        let reconnectTimer: any = null;

        const connect = () => {
            if (!isActive) return;
            ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");

            ws.onmessage = (event) => {
                if (!isActive) return;
                let data: any;
                try { data = JSON.parse(event.data); } catch { return; }
                if (!Array.isArray(data)) return;
                data.forEach((d: any) => {
                    const symbol = d.s;
                    if (symbol && symbol.endsWith("USDT")) {
                        pricesRef.current[symbol.replace("USDT", "")] = parseFloat(d.c);
                    }
                });
            };

            // Let a transport error fall through to onclose, which handles the reconnect.
            ws.onerror = () => { try { ws?.close(); } catch {} };
            ws.onclose = () => {
                if (!isActive) return; // unmounting on purpose — do NOT reconnect
                reconnectTimer = setTimeout(connect, 3000); // genuine drop — resume prices
            };
        };

        // 🛡️ DEV-CONSOLE WEBSOCKET WARNING FIX + auto-reconnect: defer the first open by a tick so
        // React StrictMode's throwaway dev mount never actually creates a socket (its cleanup clears
        // this timer first), keeping the console clean; reconnect on a genuine drop so admin totals
        // never freeze if Binance times out an idle connection or the machine sleeps/wakes.
        const openTimer = setTimeout(connect, 0);

        const interval = setInterval(() => {
            setMarketPrices(prev => ({ ...prev, ...pricesRef.current }));
        }, 1500);

        // 🛡️ Clean teardown: cancel timers, detach handlers, close socket.
        return () => {
            isActive = false;
            clearTimeout(openTimer);
            clearTimeout(reconnectTimer);
            clearInterval(interval);
            if (ws) {
                ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
                try { ws.close(); } catch {}
            }
        };
    }, []);

    // --- CLIENT BALANCES ---
    // FIX: this used to also query user_assets + recovery_allocations per client and add them on
    // top of the profile balances, so the admin total never matched what the client sees on their
    // Assets page (which counts ONLY profile balances + other_balances). It now mirrors the client
    // exactly, and is a pure in-memory calc (no per-tick DB queries → no egress spikes).
    //
    // If you DO want the admin to also see unclaimed recovery, don't fold it in here — show it as
    // a separate column so the "money they have" figure stays honest.
    const clientBalances = useMemo(() => {
        const out: Record<string, number> = {};
        if (!filteredClients) return out;

        for (const client of filteredClients) {
            let totalUSD = 0;

            const btc = Number(client.btc_balance) || 0;
            const eth = Number(client.eth_balance) || 0;
            const usdt = Number(client.usdt_balance) || 0;
            const usdc = Number(client.usdc_balance) || 0;
            const other = client.other_balances || {};

            totalUSD += btc * (marketPrices['BTC'] || 0);
            totalUSD += eth * (marketPrices['ETH'] || 0);
            totalUSD += usdt * 1;
            totalUSD += usdc * 1;

            Object.entries(other).forEach(([coin, amount]) => {
                const up = coin.toUpperCase();
                const price = (up === 'USDT' || up === 'USDC') ? 1 : (marketPrices[up] || 0);
                totalUSD += (parseFloat(amount as string) || 0) * price;
            });

            out[client.id] = totalUSD;
        }
        return out;
    }, [filteredClients, marketPrices]);

    // --- DELETE HANDLER ---
    const handleDelete = async (clientId: string, clientEmail: string) => {
        const confirm1 = window.confirm(`WARNING: This will permanently delete ${clientEmail} from the system.`);
        if (!confirm1) return;
        const confirm2 = window.prompt(`Type "DELETE" to permanently erase this client.`);
        if (confirm2 !== "DELETE") return;

        setIsDeleting(clientId);
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: clientId });
        
        if (error) {
            alert("Failed to delete user.");
            setIsDeleting(null);
        } else {
            alert("Client permanently deleted.");
            if (refreshData) refreshData();
        }
    };

    // Sort clients so those with unread activities automatically bubble to the top
    const sortedClients = useMemo(() => {
        if (!filteredClients || !unreadActivities) return filteredClients;
        
        return [...filteredClients].sort((a: any, b: any) => {
            const aPending = unreadActivities[a.id] || 0;
            const bPending = unreadActivities[b.id] || 0;
            return bPending - aPending;
        });
    }, [filteredClients, unreadActivities]);

    const getFormattedBalance = (clientId: string, prefCurrency: string) => {
        const totalUSD = clientBalances[clientId] || 0;
        const rate = exchangeRates[prefCurrency] || 1;
        const symbol = CURRENCY_INFO[prefCurrency]?.symbol || "$";
        const converted = totalUSD * rate;

        if (converted === 0) return `${symbol}0.00`;
        return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="flex flex-col h-full">
            
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 bg-[#0a0a0c]/90 backdrop-blur-md p-4 md:p-6 lg:p-8 border-b border-white/5 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3"><Users className="text-purple-500 w-5 h-5 md:w-6 md:h-6"/> My Client Database</h2>
                        <p className="text-gray-500 text-xs md:text-sm mt-1">Manage verification, wallet overrides & recovery.</p>
                    </div>
                    
                    {/* SEARCH BAR */}
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
                                const prefCurrency = c.preferred_currency || 'USD';

                                return (
                                    <tr key={c.id} className={`transition group ${hasPendingActivity ? 'bg-blue-900/10 hover:bg-blue-900/20' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="p-5 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-white group-hover:text-purple-400 transition flex items-center gap-2">
                                                    {c.full_name || "Unknown User"}
                                                    {hasPendingActivity && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">{c.email}</div>
                                                
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
                                                        <Globe size={10}/> {prefCurrency}
                                                    </div>
                                                    <div className={`text-[10px] font-bold font-mono tracking-widest ${clientBalances[c.id] > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                        {getFormattedBalance(c.id, prefCurrency)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${c.kyc_status === 'verified' ? 'bg-green-500/10 border-green-500/20 text-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${c.kyc_status === 'verified' ? 'bg-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                {c.kyc_status ? c.kyc_status.toUpperCase() : "PENDING"}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right flex items-center justify-end gap-2">
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
                                            
                                            {/* THE FIX: Delete Button Added */}
                                            <button 
                                                disabled={isDeleting === c.id}
                                                onClick={() => handleDelete(c.id, c.email)} 
                                                className="bg-transparent hover:bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-900/50 p-2.5 rounded-lg transition disabled:opacity-50"
                                            >
                                                {isDeleting === c.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
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
                            const prefCurrency = c.preferred_currency || 'USD';

                            return (
                                <div key={c.id} className={`bg-[#111] p-4 md:p-5 rounded-2xl border border-white/5 shadow-lg ${hasPendingActivity ? 'bg-blue-900/10 border-blue-500/30' : ''}`}>
                                    
                                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                                        <div className="overflow-hidden pr-3 flex-1">
                                            <div className="font-bold text-white flex items-center gap-2 text-sm md:text-base truncate">
                                                <span className="truncate">{c.full_name || "Unknown User"}</span>
                                                {hasPendingActivity && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>}
                                            </div>
                                            <div className="text-[11px] md:text-xs text-gray-500 font-mono mt-1.5 truncate">{c.email}</div>
                                            
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
                                                    <Globe size={10}/> {prefCurrency}
                                                </div>
                                                <div className={`text-[10px] font-bold font-mono tracking-widest ${clientBalances[c.id] > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                    {getFormattedBalance(c.id, prefCurrency)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-bold border ${c.kyc_status === 'verified' ? 'bg-green-500/10 border-green-500/20 text-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.kyc_status === 'verified' ? 'bg-green-500' : c.kyc_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                            {c.kyc_status ? c.kyc_status.toUpperCase() : "PENDING"}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => openActivities(c)} className="relative flex-1 bg-transparent hover:bg-white/5 active:bg-white/10 text-[#3b82f6] border border-[#1e293b] h-11 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2">
                                            <Activity size={14} className="shrink-0" /> <span className="truncate">ACTIVITIES</span>
                                            {hasPendingActivity && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full shadow-[0_0_0_2px_#111] px-1 animate-bounce">
                                                    {pendingCount}
                                                </span>
                                            )}
                                        </button>
                                        <button onClick={() => openManager(c)} className="flex-1 bg-transparent hover:bg-white/5 active:bg-white/10 text-white border border-[#333] h-11 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2">
                                            <Settings size={14} className="shrink-0" /> <span className="truncate">CONFIG</span>
                                        </button>
                                        
                                        {/* THE FIX: Delete Button Added (Mobile) */}
                                        <button 
                                            disabled={isDeleting === c.id}
                                            onClick={() => handleDelete(c.id, c.email)} 
                                            className="shrink-0 bg-transparent hover:bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-900/50 w-11 h-11 flex items-center justify-center rounded-xl transition disabled:opacity-50"
                                        >
                                            {isDeleting === c.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
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