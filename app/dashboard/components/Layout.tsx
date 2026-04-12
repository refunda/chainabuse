"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
    Zap, LogOut, ChevronLeft, ChevronRight, 
    Layers, ChevronDown, TrendingUp, TrendingDown,
    Menu, X, Activity
} from "lucide-react"; 
import { THEME, NAV_ITEMS, ASSET_LIST } from "./constants";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js"; 
import { useRouter } from "next/navigation";       

// Initialize Client Locally
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- CRYPTO TICKER COMPONENT (PRO MOBILE UPGRADE) ---
const CryptoTicker = () => {
    const [displayData, setDisplayData] = useState<any[]>(ASSET_LIST);
    const latestDataMap = useRef<Map<string, any>>(new Map());
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(2); 
            else if (window.innerWidth < 1024) setItemsPerPage(3); 
            else setItemsPerPage(5); 
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            data.forEach((d: any) => {
                const symbol = d.s; 
                if (symbol.endsWith("USDT")) {
                    const shortName = symbol.replace("USDT", ""); 
                    const closePrice = parseFloat(d.c);
                    const openPrice = parseFloat(d.o);
                    const percentChange = openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0;
                    latestDataMap.current.set(shortName, { p: closePrice, c: percentChange });
                }
            });
        };

        const interval = setInterval(() => {
            setDisplayData((prevList) => {
                return prevList.map((asset) => {
                    const live = latestDataMap.current.get(asset.s);
                    if (live) return { ...asset, p: live.p, c: live.c };
                    return asset; 
                });
            });
        }, 1000);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);

    const totalPages = Math.ceil(displayData.length / itemsPerPage);
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalPages);
        }, 5000); // Slightly longer for better readability
        return () => clearInterval(timer);
    }, [totalPages]);

    const formatPrice = (price: number) => {
        if (!price) return "---";
        if (price < 1) return price.toFixed(6); 
        if (price < 10) return price.toFixed(4); 
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const currentBatch = displayData.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage);

    return (
        <div className="w-full h-[54px] bg-[#0a0f18] border-b border-slate-800 relative z-40 overflow-hidden flex items-center px-2 md:px-4 shadow-md">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex w-full items-center justify-center gap-2"
                >
                    {currentBatch.map((coin, i) => (
                        // THE FIX: Used flex-1 so items evenly share space on mobile
                        <div key={`${coin.s}-${i}`} className="flex-1 flex items-center justify-between gap-1 md:gap-4 bg-slate-900/50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-700/50 overflow-hidden min-w-0 max-w-sm transition-colors">
                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                <img src={coin.l} className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-slate-700 shrink-0" alt={coin.s} />
                                <span className="font-bold text-slate-200 text-[10px] md:text-[12px] truncate hidden sm:inline-block">{coin.s}</span>
                            </div>
                            <span className="text-cyan-400 font-mono text-[10px] md:text-[13px] font-bold truncate drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">
                                ${formatPrice(coin.p)}
                            </span>
                            <span className="text-[9px] md:text-[11px] font-mono font-bold flex items-center gap-0.5 shrink-0" style={{ color: (coin.c || 0) >= 0 ? THEME.success : THEME.danger }}>
                                {(coin.c || 0) >= 0 ? <TrendingUp size={10} className="md:w-3 md:h-3"/> : <TrendingDown size={10} className="md:w-3 md:h-3"/>}
                                {Math.abs(coin.c || 0).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// --- MAIN LAYOUT COMPONENT ---
export default function Layout({ children, activeTab, setActiveTab, user }: any) { 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false); 
  const [isStakeOpen, setIsStakeOpen] = useState(false);
  
  const [profile, setProfile] = useState(user);
  const router = useRouter(); 

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) {
            setIsCollapsed(false); 
        }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.replace("/");
  };

  const handleNavClick = (id: string) => {
      setActiveTab(id);
      if (isMobile) {
          setIsMobileDrawerOpen(false); 
      } else if (isCollapsed) {
          setIsCollapsed(false); 
      }
  };

  const handleStakeClick = () => {
      if (!isMobile && isCollapsed) {
          handleNavClick("stake_plans");
      } else {
          setIsStakeOpen(!isStakeOpen);
      }
  };

  const getMenuLabel = (id: string, fallback: string) => {
      switch(id) {
          case 'overview': return 'Terminal';
          case 'assets': return 'Assets';
          case 'buy_crypto': return 'Buy Crypto';
          case 'staking': return 'Staking';
          case 'verification': return 'Verification';
          case 'security': return 'Security';
          case 'contact': return 'Contact Support';
          case 'settings': return 'Settings';
          default: return fallback;
      }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#0b1120] text-slate-300 selection:bg-cyan-500/30">
      
      {/* --- MOBILE OVERLAY BACKDROP --- */}
      <AnimatePresence>
          {isMobile && isMobileDrawerOpen && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] md:hidden"
              />
          )}
      </AnimatePresence>

      {/* --- RESPONSIVE SIDEBAR --- */}
      <motion.aside
        animate={{ 
            width: isMobile ? 280 : (isCollapsed ? 80 : 280),
            x: isMobile ? (isMobileDrawerOpen ? 0 : "-100%") : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed md:relative top-0 left-0 h-full z-[100] md:z-50 flex flex-col shrink-0 bg-[#0f172a] border-r border-slate-800 shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* LOGO */}
        <div className="h-[80px] flex items-center px-5 relative border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden mt-2 w-full justify-center">
                {isCollapsed && !isMobile ? (
                    // USES YOUR NEW logo-icon.png EXACTLY AS YOU REQUESTED
                    <img src="/assets/logo-icon.png" alt="Chainabuse Icon" className="h-8 w-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                ) : (
                    // FULL LOGO WITH INTENSE GLOW
                    <img src="/assets/logo.png" alt="Chainabuse" className="max-w-[160px] drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]" />
                )}
            </div>
            
            {!isMobile && (
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-7 bg-slate-900 border border-cyan-800 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-colors z-50 shadow-md">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            )}

            {isMobile && (
                <button onClick={() => setIsMobileDrawerOpen(false)} className="absolute right-4 top-7 text-slate-500 hover:text-white transition-colors p-2">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* PROFILE SECTION */}
        <div className="p-[20px_15px] border-b border-slate-800">
            <div className={`p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center gap-3 ${isCollapsed && !isMobile ? "justify-center" : "justify-start"} overflow-hidden shadow-inner`}>
                
                <div className="min-w-[36px] w-[36px] h-[36px] rounded-lg bg-gradient-to-br from-cyan-600 to-emerald-600 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <span>{profile?.full_name ? profile.full_name.substring(0,2) : (profile?.name ? profile.name.substring(0,2) : "OP")}</span>
                        )}
                    </div>
                </div>

                {(!isCollapsed || isMobile) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                        <div className="font-black text-xs text-white uppercase tracking-wider truncate">{profile?.full_name || profile?.name || "Operative"}</div>
                        <div className={`text-[9px] font-mono font-bold mt-0.5 tracking-widest truncate ${profile?.kyc_status === "verified" ? "text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]" : "text-red-400 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]"}`}>
                            {profile?.kyc_status === "verified" ? "VERIFICATION: VERIFIED" : "VERIFICATION: PENDING"}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
                const labelDisplay = getMenuLabel(item.id, item.label);

                if (item.id === "staking") {
                    const isActiveStake = activeTab.includes("stake");
                    return (
                        <div key="staking-group" className="mb-1">
                            <div onClick={handleStakeClick} className={`p-3.5 rounded-xl cursor-pointer flex items-center gap-4 transition-all group ${isActiveStake ? "bg-cyan-500/10 border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]" : "hover:bg-slate-800/50 border border-transparent"}`} style={{ justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start" }}>
                                <div className={`${isActiveStake ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"}`}><Layers size={20} /></div>
                                {(!isCollapsed || isMobile) && (
                                    <>
                                        <span className={`text-xs font-bold uppercase tracking-widest flex-1 ${isActiveStake ? "text-cyan-400" : "text-slate-400 group-hover:text-white"}`}>{labelDisplay}</span>
                                        <motion.div animate={{ rotate: isStakeOpen ? 180 : 0 }}><ChevronDown size={14} className={isActiveStake ? "text-cyan-400" : "text-slate-600"} /></motion.div>
                                    </>
                                )}
                            </div>
                            <AnimatePresence>
                                {(!isCollapsed || isMobile) && isStakeOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pl-6 relative">
                                        <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} className="absolute left-6 top-0 w-[1.5px] bg-slate-700 rounded-sm" />
                                        <div className="flex flex-col mt-1">
                                            <SubNavItem label="Stake Plans" isActive={activeTab === "stake_plans"} onClick={() => handleNavClick("stake_plans")} />
                                            <SubNavItem label="Manage Stakes" isActive={activeTab === "manage_stakes"} onClick={() => handleNavClick("manage_stakes")} isLast />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                }
                
                const isActive = activeTab === item.id;
                
                return (
                    <div key={item.id} onClick={() => handleNavClick(item.id)} className={`p-3.5 rounded-xl cursor-pointer flex items-center gap-4 transition-all group ${isActive ? "bg-cyan-500/10 border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]" : "hover:bg-slate-800/50 border border-transparent"}`} style={{ justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start" }}>
                        <div className={`${isActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" : "text-slate-500 group-hover:text-cyan-400 transition-colors"}`}>{item.icon}</div>
                        {(!isCollapsed || isMobile) && (
                            <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? "text-cyan-400 drop-shadow-[0_0_2px_rgba(6,182,212,0.5)]" : "text-slate-400 group-hover:text-white transition-colors"}`}>{labelDisplay}</span>
                        )}
                    </div>
                );
            })}
        </div>

        {/* LOGOUT */}
        <div className="p-5 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full p-3 bg-red-500/5 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 rounded-xl text-red-400/80 hover:text-red-400 text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-3 transition-colors group">
                <LogOut size={16} className="group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" /> 
                {(!isCollapsed || isMobile) && <span className="group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Disconnect</span>}
            </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        
        {/* MOBILE TOP NAVBAR */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0f172a] border-b border-slate-800 relative z-40 shadow-md">
            <img src="/assets/logo.png" alt="Chainabuse" className="h-7 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
            <button onClick={() => setIsMobileDrawerOpen(true)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-sm">
                <Menu size={20} />
            </button>
        </div>

        {/* TICKER */}
        <CryptoTicker />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative">
            {children}
        </div>
      </main>

    </div>
  );
}

const SubNavItem = ({ label, isActive, onClick, isLast }: any) => (
    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} onClick={onClick} className="py-2.5 px-4 cursor-pointer relative flex items-center group">
        <div className={`absolute left-0 top-1/2 w-3 h-[1.5px] bg-slate-700 ${isLast ? 'rounded-bl-sm' : ''}`} />
        <span className={`ml-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`}>{label}</span>
    </motion.div>
);