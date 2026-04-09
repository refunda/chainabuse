"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
    Zap, LogOut, ChevronLeft, ChevronRight, 
    Layers, ChevronDown, TrendingUp, TrendingDown,
    Menu, X
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

// --- NEW CRYPTO TICKER COMPONENT (BATCH SLIDER) ---
const CryptoTicker = () => {
    const [displayData, setDisplayData] = useState<any[]>(ASSET_LIST);
    const latestDataMap = useRef<Map<string, any>>(new Map());
    
    // Batch Animation State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(2); // Mobile: 2 coins
            else if (window.innerWidth < 1024) setItemsPerPage(3); // Tablet: 3 coins
            else setItemsPerPage(5); // Desktop: 5 coins
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // WebSocket Logic
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

    // Cycle through batches every 4 seconds
    const totalPages = Math.ceil(displayData.length / itemsPerPage);
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalPages);
        }, 4000); 
        return () => clearInterval(timer);
    }, [totalPages]);

    const formatPrice = (price: number) => {
        if (!price) return "---";
        if (price < 1) return price.toFixed(6); 
        if (price < 10) return price.toFixed(4); 
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Get the current batch of coins to display
    const currentBatch = displayData.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage);

    return (
        <div className="w-full h-[54px] bg-[#0b0e11] border-b relative z-40 overflow-hidden flex items-center px-4" style={{ borderColor: THEME.border }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex w-full items-center justify-around md:justify-between"
                >
                    {currentBatch.map((coin, i) => (
                        <div key={`${coin.s}-${i}`} className="flex items-center gap-2 md:gap-4">
                            <div className="flex items-center gap-2">
                                <img src={coin.l} className="w-5 h-5 md:w-6 md:h-6 rounded-full" alt={coin.s} />
                                <span className="font-[800] text-[#e5e7eb] text-[12px] md:text-[14px]">{coin.s}</span>
                            </div>
                            <span className="text-white font-mono text-[12px] md:text-[14px] font-[600]">
                                ${formatPrice(coin.p)}
                            </span>
                            <span className="text-[10px] md:text-[12px] font-bold flex items-center gap-1" style={{ color: (coin.c || 0) >= 0 ? THEME.success : THEME.danger }}>
                                {(coin.c || 0) >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
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

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans" style={{ background: THEME.bg, color: THEME.text }}>
      
      {/* --- MOBILE OVERLAY BACKDROP --- */}
      <AnimatePresence>
          {isMobile && isMobileDrawerOpen && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] md:hidden"
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
        className="fixed md:relative top-0 left-0 h-full z-[100] md:z-50 flex flex-col shrink-0"
        style={{ background: THEME.sidebarBg, borderRight: THEME.border }}
      >
        {/* LOGO */}
        <div style={{ height: 80, display: "flex", alignItems: "center", padding: "0 20px", position: "relative" }}>
            <div className="flex items-center gap-[12px] overflow-hidden mt-5">
                <div style={{ minWidth: 40, height: 40, borderRadius: 12, background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: THEME.accentGlow }}>
                    <Zap size={24} color="white" fill="white" />
                </div>
                <motion.span animate={{ opacity: isCollapsed && !isMobile ? 0 : 1, width: isCollapsed && !isMobile ? 0 : "auto" }} style={{ fontSize: 20, fontWeight: 800, color: THEME.accent, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
                    REFUNDA
                </motion.span>
            </div>
            
            {!isMobile && (
                <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ position: "absolute", right: -12, top: 28, background: THEME.accent, border: "2px solid #000", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", zIndex: 60 }}>
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            )}

            {isMobile && (
                <button onClick={() => setIsMobileDrawerOpen(false)} className="absolute right-4 top-7 text-gray-400 hover:text-white transition p-2">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* PROFILE SECTION */}
        <div style={{ padding: "0 15px 20px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 10, marginTop: 10 }}>
            <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12, justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start" }}>
                
                <div style={{ minWidth: 36, height: 36, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 16, color: "#fff", border: `1px solid ${THEME.accent}`, overflow: "hidden" }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span>{profile?.full_name ? profile.full_name[0] : (profile?.name ? profile.name[0] : "U")}</span>
                    )}
                </div>

                {(!isCollapsed || isMobile) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap" }}>{profile?.full_name || profile?.name || "Trader"}</div>
                        <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 2, color: profile?.kyc_status === "verified" ? THEME.success : THEME.danger }}>{profile?.kyc_status === "verified" ? "VERIFIED" : "UNVERIFIED"}</div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* NAVIGATION */}
        <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
            {NAV_ITEMS.map((item) => {
                if (item.id === "staking") {
                    const isActiveStake = activeTab.includes("stake");
                    return (
                        <div key="staking-group">
                            <div onClick={handleStakeClick} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start", background: isActiveStake ? "rgba(139, 92, 246, 0.15)" : "transparent", position: "relative" }}>
                                <Layers size={20} color={THEME.accent} />
                                {(!isCollapsed || isMobile) && <><span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: isActiveStake ? "white" : THEME.textDim }}>Stake</span><motion.div animate={{ rotate: isStakeOpen ? 180 : 0 }}><ChevronDown size={14} color="#666" /></motion.div></>}
                            </div>
                            <AnimatePresence>
                                {(!isCollapsed || isMobile) && isStakeOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} style={{ overflow: "hidden", paddingLeft: 24, position: "relative" }}>
                                        <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} style={{ position: "absolute", left: 24, top: 0, width: 1.5, background: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
                                        <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
                                            <SubNavItem label="Stake Plans" isActive={activeTab === "stake_plans"} onClick={() => handleNavClick("stake_plans")} />
                                            <SubNavItem label="Manage Stakes" isActive={activeTab === "manage_stakes"} onClick={() => handleNavClick("manage_stakes")} isLast />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                }
                return (
                    <div key={item.id} onClick={() => handleNavClick(item.id)} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, justifyContent: (isCollapsed && !isMobile) ? "center" : "flex-start", background: activeTab === item.id ? "rgba(139, 92, 246, 0.15)" : "transparent", color: activeTab === item.id ? "white" : THEME.textDim }}>
                        <div style={{ color: THEME.accent }}>{item.icon}</div>
                        {(!isCollapsed || isMobile) && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
                    </div>
                );
            })}
        </div>

        {/* LOGOUT */}
        <div style={{ padding: 20 }}>
            <button onClick={handleLogout} style={{ width: "100%", padding: 12, background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, color: THEME.danger, fontSize: 13, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <LogOut size={16} /> {(!isCollapsed || isMobile) && "Log Out"}
            </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        
        {/* MOBILE TOP NAVBAR */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0b0e11] border-b relative z-40" style={{ borderColor: THEME.border }}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/30" style={{ background: THEME.accent }}>
                    <Zap size={16} color="white" fill="white" />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ color: THEME.accent }}>REFUNDA</span>
            </div>
            <button onClick={() => setIsMobileDrawerOpen(true)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">
                <Menu size={20} />
            </button>
        </div>

        {/* THE BATCH SLIDER TICKER LIVES HERE */}
        <CryptoTicker />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-10 w-full relative">
            {children}
        </div>
      </main>

    </div>
  );
}

const SubNavItem = ({ label, isActive, onClick, isLast }: any) => (
    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} onClick={onClick} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: isActive ? "white" : "#666", position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, top: "50%", width: 12, height: 1.5, background: "rgba(255,255,255,0.1)", borderBottomLeftRadius: isLast ? 4 : 0 }} />
        <span style={{ marginLeft: 12, fontWeight: isActive ? "600" : "400", color: isActive ? THEME.accent : "inherit" }}>{label}</span>
    </motion.div>
);