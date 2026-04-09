"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Activity, ShieldAlert, Lock, MapPin, CheckCircle2, AlertTriangle, Fingerprint, Database, Network, Globe, Zap, ArrowRight, Clock } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GLOBAL JURISDICTIONS (Recalibrated to stay strictly on landmasses)
// ═══════════════════════════════════════════════════════════════════════════════
const HUBS = [
  { id: "US_WEST", label: "LOS ANGELES, USA", x: 15, y: 36 },
  { id: "US_EAST", label: "NEW YORK, USA", x: 26, y: 32 },
  { id: "US_CEN", label: "DALLAS, USA", x: 20, y: 37 },
  { id: "US_MIA", label: "MIAMI, USA", x: 25, y: 40 },
  { id: "CAN_TOR", label: "TORONTO, CAN", x: 25, y: 28 },
  { id: "CAN_VAN", label: "VANCOUVER, CAN", x: 15, y: 27 },
  { id: "MEX_CTY", label: "MEXICO CITY, MEX", x: 19, y: 46 },
  { id: "COL_BOG", label: "BOGOTA, COL", x: 27, y: 55 },
  { id: "BRA_SP", label: "SÃO PAULO, BRA", x: 34, y: 65 },
  { id: "ARG_BUE", label: "BUENOS AIRES, ARG", x: 31.5, y: 75 },
  { id: "UK_LDN", label: "LONDON, UK", x: 46.5, y: 23.5 },
  { id: "FRA_PAR", label: "PARIS, FRA", x: 48, y: 26 },
  { id: "GER_FRA", label: "FRANKFURT, GER", x: 50, y: 25 },
  { id: "ESP_MAD", label: "MADRID, ESP", x: 46, y: 31 },
  { id: "ITA_ROM", label: "ROME, ITA", x: 51, y: 30 },
  { id: "ZAF_CPT", label: "CAPE TOWN, ZAF", x: 52.5, y: 76 },
  { id: "NGA_LAG", label: "LAGOS, NGA", x: 49, y: 55 },
  { id: "KEN_NAI", label: "NAIROBI, KEN", x: 58, y: 58 },
  { id: "EGY_CAI", label: "CAIRO, EGY", x: 55, y: 38 },
  { id: "UAE_DXB", label: "DUBAI, UAE", x: 63, y: 42 },
  { id: "IND_MUM", label: "MUMBAI, IND", x: 68, y: 47 },
  { id: "IND_DEL", label: "NEW DELHI, IND", x: 70, y: 41 },
  { id: "SGP_SIN", label: "SINGAPORE", x: 76, y: 58 },
  { id: "KOR_SEO", label: "SEOUL, KOR", x: 84, y: 34 },
  { id: "JPN_TKY", label: "TOKYO, JPN", x: 87, y: 35 },
  { id: "CHN_BJS", label: "BEIJING, CHN", x: 81, y: 32 },
  { id: "CHN_SHA", label: "SHANGHAI, CHN", x: 83, y: 36 },
  { id: "AUS_SYD", label: "SYDNEY, AUS", x: 87, y: 76 },
  { id: "AUS_MEL", label: "MELBOURNE, AUS", x: 85.5, y: 78 },
  { id: "PHL_MNL", label: "MANILA, PHL", x: 83, y: 52 },
];

let traceIdCounter = 0; 
const isValidTxHash = (hash: string) => /^(0x)?[a-fA-F0-9]{64}$/.test(hash.trim());

const formatUTCTime = (unixSeconds: number) => {
    if (!unixSeconds) return "UNCONFIRMED / PENDING";
    const d = new Date(unixSeconds * 1000);
    return d.toUTCString().replace("GMT", "UTC");
};

// Advanced Text Scrambler
const ScrambleText = ({ text, delay = 30 }: { text: string, delay?: number }) => {
  const [display, setDisplay] = useState("");
  const chars = "0123456789ABCDEF!@#$";
  
  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((letter, index) => {
        if(index < iterations) return letter;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if(iterations >= text.length) clearInterval(interval);
      iterations += 1 / 2;
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{display}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Hero() {
  const [inputValue, setInputValue] = useState("");
  const [scanState, setScanState] = useState<"IDLE" | "ERROR" | "NOT_FOUND" | "SERVER_BUSY" | "SCANNING" | "SUCCESS">("IDLE");
  const [targetTrace, setTargetTrace] = useState<any>(null);
  const [ambientTraces, setAmbientTraces] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    const text = "ENTER_TX_HASH_TO_INITIATE_RECOVERY...";
    let i = 0;
    const typingInterval = setInterval(() => {
      setPlaceholderText(text.slice(0, i));
      i++;
      if (i > text.length + 10) i = 0; 
    }, 80);
    return () => clearInterval(typingInterval);
  }, []);

  // Ambient Data Generator (Constant, moderate speed)
  useEffect(() => {
    const generateAmbient = () => {
      traceIdCounter++;
      const origin = HUBS[Math.floor(Math.random() * HUBS.length)];
      let dest = HUBS[Math.floor(Math.random() * HUBS.length)];
      while(dest.id === origin.id) dest = HUBS[Math.floor(Math.random() * HUBS.length)];

      const hash = `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}...${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
      
      const tickers = ["ETH", "BTC", "USDT", "USDC", "SOL", "TRX"];
      const selectedTicker = tickers[Math.floor(Math.random() * tickers.length)];
      
      let valNum = 0;
      if (selectedTicker === "BTC") valNum = Math.random() * 0.4 + 0.05;
      else if (selectedTicker === "ETH") valNum = Math.random() * 6 + 0.5;
      else if (selectedTicker === "SOL") valNum = Math.random() * 80 + 10;
      else valNum = Math.random() * 8000 + 500;
      
      const isPrecise = selectedTicker === "BTC" || selectedTicker === "ETH";
      const valStr = new Intl.NumberFormat('en-US', { maximumFractionDigits: isPrecise ? 4 : 2 }).format(valNum);
      const feeStr = new Intl.NumberFormat('en-US', { maximumFractionDigits: isPrecise ? 4 : 2 }).format(valNum * 0.07);
      
      return {
        id: `ambient-${traceIdCounter}`, hash, amount: valStr, fee: feeStr, ticker: selectedTicker, network: selectedTicker === "USDT" ? "TRX" : selectedTicker,
        origin, dest, status: Math.random() > 0.4 ? "FEE DEPOSITED" : "RECOVERING", isTarget: false
      };
    };

    // Load first 3 immediately so the UI isn't empty
    setAmbientTraces([generateAmbient(), generateAmbient(), generateAmbient()]);

    // Keep ONE constant speed (6 seconds per notification)
    const interval = setInterval(() => {
      setAmbientTraces((prev) => {
        const targets = prev.filter(t => t.isTarget);
        const ambient = prev.filter(t => !t.isTarget);
        return [...targets, generateAmbient(), ...ambient].slice(0, 4);
      });
    }, 6000); 

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg].slice(-4));

  // ═══════════════════════════════════════════════════════════════════════════════
  // THE GOD-LEVEL MULTI-CHAIN API PROTOCOL
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    const rawHash = inputValue.replace(/^0x/, ''); 
    const ethHash = `0x${rawHash}`;

    if (!isValidTxHash(rawHash)) {
        setScanState("ERROR");
        setTimeout(() => setScanState("IDLE"), 2500);
        return;
    }

    setScanState("SCANNING");
    setTargetTrace(null);
    setAmbientTraces(prev => prev.filter(t => !t.isTarget)); 
    setLogs(["INITIATING MULTI-CHAIN RECOVERY SCAN..."]);

    let foundData: any = null;
    let chainFound = "";

    try {
        // 1. PING ETHEREUM 
        setTimeout(() => addLog("> SCANNING ETHEREUM MAINNET..."), 400);
        try {
            const ethRes = await fetch("https://cloudflare-eth.com", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionByHash", params: [ethHash], id: 1 }),
            }).then(r => r.json());

            if (ethRes?.result) {
                foundData = ethRes.result;
                chainFound = "ETH";
                foundData.rawNum = parseInt(foundData.value, 16) / 1e18;
                foundData.ticker = "ETH";
                
                if (foundData.blockNumber) {
                    addLog("> ETH LEDGER MATCH. EXTRACTING TIMESTAMP...");
                    const blockRes = await fetch("https://cloudflare-eth.com", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBlockByNumber", params: [foundData.blockNumber, false], id: 2 }),
                    }).then(r => r.json());
                    if (blockRes?.result?.timestamp) foundData.timestamp = formatUTCTime(parseInt(blockRes.result.timestamp, 16));
                }
            } 
        } catch(e) { console.log("ETH check failed"); }

        // 2. PING BITCOIN 
        if (!foundData) {
            setTimeout(() => addLog("> ETH NEGATIVE. SCANNING BITCOIN LEDGER..."), 1200);
            try {
                const btcRes = await fetch(`https://blockstream.info/api/tx/${rawHash}`).then(r => r.json());
                if (btcRes?.txid) {
                    foundData = btcRes;
                    chainFound = "BTC";
                    foundData.rawNum = btcRes.vout.reduce((sum: number, v: any) => sum + v.value, 0) / 1e8;
                    foundData.ticker = "BTC";
                    foundData.from = btcRes.vin[0]?.prevout?.scriptpubkey_address || "MULTIPLE_INPUTS";
                    foundData.to = btcRes.vout[0]?.scriptpubkey_address || "MULTIPLE_OUTPUTS";
                    foundData.timestamp = formatUTCTime(btcRes.status?.block_time);
                }
            } catch(e) { console.log("BTC check failed"); }
        }

        // 3. PING TRON 
        if (!foundData) {
            setTimeout(() => addLog("> BTC NEGATIVE. SCANNING TRON GRID NODES..."), 2000);
            try {
                const trxRes = await fetch("https://api.trongrid.io/wallet/gettransactionbyid", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ value: rawHash }),
                }).then(r => r.json());

                if (trxRes?.txID) {
                    foundData = trxRes;
                    chainFound = "TRX";
                    const contract = trxRes.raw_data?.contract[0]?.parameter?.value;
                    foundData.rawNum = contract?.amount ? (contract.amount / 1e6) : 0;
                    foundData.ticker = contract?.amount ? "TRX" : "SMART_CONTRACT";
                    foundData.from = contract?.owner_address || "TRX_NETWORK";
                    foundData.to = contract?.to_address || "TRX_NETWORK";
                    foundData.timestamp = formatUTCTime(Math.floor(trxRes.raw_data?.timestamp / 1000));
                }
            } catch(e) { console.log("TRX check failed"); }
        }

        // RESULT RESOLUTION
        setTimeout(() => {
            if (foundData) {
                const origin = HUBS[Math.floor(Math.random() * HUBS.length)];
                let dest = HUBS[Math.floor(Math.random() * HUBS.length)];
                while(dest.id === origin.id) dest = HUBS[Math.floor(Math.random() * HUBS.length)];

                addLog(`> ASSET LOCATED ON ${chainFound}. DECRYPTING GEOMETRY...`);

                setTimeout(() => {
                    const isPrecise = chainFound === "BTC" || chainFound === "ETH";
                    const formattedAmount = new Intl.NumberFormat('en-US', { maximumFractionDigits: isPrecise ? 4 : 2 }).format(foundData.rawNum);
                    const formattedFee = new Intl.NumberFormat('en-US', { maximumFractionDigits: isPrecise ? 4 : 2 }).format(foundData.rawNum * 0.07);

                    const traceData = {
                        id: `target-${Date.now()}`,
                        hash: `${rawHash.substring(0, 10)}...${rawHash.substring(rawHash.length - 8)}`,
                        fullHash: rawHash,
                        amount: formattedAmount,
                        fee: formattedFee,
                        ticker: foundData.ticker,
                        network: chainFound,
                        from: foundData.from || "OBFUSCATED_NODE",
                        to: foundData.to || "OBFUSCATED_NODE",
                        timestamp: foundData.timestamp || "UNCONFIRMED / PENDING",
                        origin, dest,
                        status: "ASSET RECOVERED",
                        isTarget: true
                    };
                    
                    setTargetTrace(traceData);
                    setAmbientTraces(prev => [traceData, ...prev].slice(0, 4));
                    setScanState("SUCCESS"); 
                    addLog(`> ASSET FROZEN. 7% VERIFICATION FEE CALCULATED.`);
                }, 1800);

            } else {
                addLog("> ASSET EVADED. NOT FOUND ON INDEXED CHAINS.");
                setScanState("NOT_FOUND");
                setTimeout(() => { setScanState("IDLE"); setLogs([]); }, 4000);
            }
        }, 3200);

    } catch (err) {
        addLog("> CONNECTION FAILED. SERVERS BUSY.");
        setScanState("SERVER_BUSY");
        setTimeout(() => { setScanState("IDLE"); setLogs([]); }, 4000);
    }
  };

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#020203] select-none flex flex-col justify-center">
      
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* BACKGROUND: TACTICAL WORLD MAP */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[80vh] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000 ${scanState === "SUCCESS" ? "bg-emerald-900/20" : "bg-blue-900/10"}`} />
        
        {/* viewBox="0 0 100 100" and preserveAspectRatio="none" fix the path syntax error while keeping scaling */}
        <div className="relative w-[200%] sm:w-[150%] md:w-full max-w-[1400px] aspect-[1008/650] opacity-[0.6] md:opacity-[0.45]">
           <div className={`absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-[length:100%_100%] sepia-[.5] saturate-[3] transition-all duration-1000 ${scanState === "SUCCESS" ? "hue-rotate-[110deg] drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" : "hue-rotate-[180deg] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"}`} />
           
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 overflow-visible">
                <defs>
                    <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" /> 
                        <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                
                {/* ONLY RENDER THE NEWEST AMBIENT ARC (Removed % signs from path string) */}
                {(() => {
                    const latestAmbient = ambientTraces.find(t => !t.isTarget);
                    if (!latestAmbient) return null;
                    const midY = Math.min(latestAmbient.origin.y, latestAmbient.dest.y) - 20; 
                    const d = `M ${latestAmbient.origin.x} ${latestAmbient.origin.y} Q 50 ${midY} ${latestAmbient.dest.x} ${latestAmbient.dest.y}`;
                    return (
                        <motion.path 
                            key={`arc-${latestAmbient.id}`} d={d} fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 2"
                            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} exit={{ opacity: 0 }} transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    );
                })()}

                {targetTrace && (
                    <motion.path 
                        d={`M ${targetTrace.origin.x} ${targetTrace.origin.y} Q 50 ${Math.min(targetTrace.origin.y, targetTrace.dest.y) - 30} ${targetTrace.dest.x} ${targetTrace.dest.y}`}
                        fill="none" stroke="url(#targetGrad)" strokeWidth="1"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                )}
            </svg>

            {/* SYNCHRONIZED MAP DOTS (ONLY VISIBLE WHEN GLOWING) */}
            {HUBS.map((hub) => {
                const latestAmbient = ambientTraces.find(t => !t.isTarget);
                const isActiveInFeed = latestAmbient && (latestAmbient.origin.id === hub.id || latestAmbient.dest.id === hub.id);

                return (
                    <div key={hub.id} className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 z-10 ${
                        scanState === "SUCCESS" && isActiveInFeed ? "bg-emerald-400 shadow-[0_0_15px_#10b981] scale-[1.5] opacity-100" :
                        isActiveInFeed ? "bg-cyan-400 shadow-[0_0_15px_#22d3ee] scale-[1.5] animate-pulse opacity-100" :
                        "opacity-0" // HIDDEN WHEN NOT ACTIVE
                    }`} style={{ top: `${hub.y}%`, left: `${hub.x}%` }}>
                        <div className={`absolute top-2.5 left-1/2 -translate-x-1/2 text-[7px] font-mono tracking-widest whitespace-nowrap hidden md:block transition-colors duration-500 ${
                            scanState === "SUCCESS" && isActiveInFeed ? "text-emerald-400 font-bold" :
                            isActiveInFeed ? "text-cyan-400 font-bold drop-shadow-[0_0_5px_#22d3ee]" :
                            "text-transparent"
                        }`}>{hub.id}</div>
                    </div>
                );
            })}

            <AnimatePresence>
                {targetTrace && (
                    <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute w-4 h-4 bg-emerald-500 rounded-full -ml-2 -mt-2 shadow-[0_0_20px_#10b981]" style={{ top: `${targetTrace.origin.y}%`, left: `${targetTrace.origin.x}%` }} />
                        <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-8 h-8 border border-emerald-500 rounded-full -ml-4 -mt-4" style={{ top: `${targetTrace.origin.y}%`, left: `${targetTrace.origin.x}%` }} />
                        
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute w-4 h-4 bg-emerald-500 rounded-full -ml-2 -mt-2 shadow-[0_0_20px_#10b981]" style={{ top: `${targetTrace.dest.y}%`, left: `${targetTrace.dest.x}%` }} />
                        <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="absolute w-8 h-8 border border-emerald-500 rounded-full -ml-4 -mt-4" style={{ top: `${targetTrace.dest.y}%`, left: `${targetTrace.dest.x}%` }} />
                    </>
                )}
            </AnimatePresence>
        </div>

        {/* Soft Vignette to blend edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(1,1,3,0.9)_100%)] pointer-events-none z-10" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* CONTENT LAYER */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row justify-between items-center lg:items-start min-h-[80vh] pt-28 pb-8 gap-12 lg:gap-0">
        
        {/* LEFT COLUMN: COMMAND TERMINAL */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full max-w-2xl mt-4 md:mt-8">
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`inline-flex items-center gap-3 px-4 py-1.5 border backdrop-blur-md mb-6 transition-colors duration-1000 ${scanState === "SUCCESS" ? "bg-emerald-900/20 border-emerald-900/50" : "bg-[#0A0A0E]/60 border-blue-900/40"}`}>
              <Activity className={`w-3.5 h-3.5 animate-pulse ${scanState === "SUCCESS" ? "text-emerald-400" : "text-cyan-400"}`} />
              <span className={`text-[10px] font-mono tracking-[0.3em] font-bold uppercase transition-colors duration-1000 ${scanState === "SUCCESS" ? "text-emerald-400" : "text-cyan-400"}`}>Asset Recovery Protocol Active</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tighter uppercase leading-[1.05] md:leading-[0.95] drop-shadow-xl">
              Asset Recovery. <br />
              <span className={`text-transparent bg-clip-text transition-all duration-1000 ${scanState === "SUCCESS" ? "bg-gradient-to-r from-emerald-400 to-teal-300" : "bg-gradient-to-r from-blue-400 to-cyan-300"}`}>Absolute Precision.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-zinc-300 text-xs sm:text-sm max-w-xl mb-10 font-mono tracking-widest uppercase leading-relaxed hidden sm:block">
              Military-grade blockchain forensics engineered to track, freeze, and recover lost or stolen digital liquidity. Enter an ETH, BTC, or TRX transaction hash below to initiate an extraction trace.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-2xl relative mx-auto lg:mx-0">
                <motion.div animate={(scanState === "ERROR" || scanState === "NOT_FOUND" || scanState === "SERVER_BUSY") ? { x: [-8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.3 }} className={`bg-[#050508]/80 backdrop-blur-xl border p-2 relative transition-colors duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${scanState === "ERROR" || scanState === "NOT_FOUND" || scanState === "SERVER_BUSY" ? "border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : scanState === "SUCCESS" ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]" : "border-blue-900/40 hover:border-cyan-500/30"}`}>
                    
                    <form onSubmit={handleTrace} className="flex flex-col sm:flex-row gap-2 w-full relative z-10">
                        <div className="relative flex-1">
                            {scanState === "ERROR" || scanState === "NOT_FOUND" || scanState === "SERVER_BUSY" ? <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" /> : <Fingerprint className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${scanState === "SUCCESS" ? "text-emerald-400" : "text-cyan-400/50"}`} />}
                            <input 
                                type="text" placeholder={placeholderText} value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={scanState === "SCANNING" || scanState === "SUCCESS"}
                                className={`w-full h-12 md:h-14 bg-[#0A0A0E]/50 border pl-12 pr-4 text-[10px] md:text-xs font-mono focus:outline-none transition-colors disabled:opacity-50 ${scanState === "ERROR" || scanState === "NOT_FOUND" || scanState === "SERVER_BUSY" ? "border-red-500/50 text-red-400 placeholder:text-red-900/50" : scanState === "SUCCESS" ? "border-emerald-500/50 text-emerald-400" : "border-blue-900/30 text-white placeholder:text-zinc-400 focus:border-cyan-400/50"}`}
                            />
                        </div>
                        
                        <button type="submit" disabled={scanState === "SCANNING" || scanState === "SUCCESS"} className={`h-12 md:h-14 px-4 sm:px-8 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                            scanState === "ERROR" || scanState === "NOT_FOUND" || scanState === "SERVER_BUSY" ? "bg-red-900/20 text-red-500 border border-red-500/30 cursor-not-allowed" :
                            scanState === "SCANNING" ? "bg-cyan-900/20 text-cyan-400 cursor-wait border border-cyan-500/30" : 
                            scanState === "SUCCESS" ? "bg-emerald-500 text-black border border-emerald-500" :
                            "bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_#22d3ee]"
                        }`}>
                            {scanState === "ERROR" ? <><AlertTriangle className="w-4 h-4" /> FORMAT ERROR</> : scanState === "NOT_FOUND" ? <><AlertTriangle className="w-4 h-4" /> NOT FOUND</> : scanState === "SERVER_BUSY" ? <><AlertTriangle className="w-4 h-4" /> SERVER BUSY</> : scanState === "SCANNING" ? <><Network className="w-4 h-4 animate-spin" /> SCANNING</> : scanState === "SUCCESS" ? <><CheckCircle2 className="w-4 h-4" /> RECOVERED</> : <><Globe className="w-4 h-4" /> LOCATE ASSET</>}
                        </button>
                    </form>

                    {/* LIVE TERMINAL LOGS & ERROR STATES */}
                    <AnimatePresence mode="wait">
                        {scanState === "SERVER_BUSY" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[9px] font-mono tracking-widest uppercase mt-3 px-2 pb-1 flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> CONNECTION FAILED. SERVER IS BUSY. PLEASE TRY AGAIN LATER.
                            </motion.div>
                        )}
                        {scanState === "NOT_FOUND" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[9px] font-mono tracking-widest uppercase mt-3 px-2 pb-1 flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> NO RECOVERY RECORD FOUND ON ETH, BTC, OR TRX CHAINS.
                            </motion.div>
                        )}
                        {logs.length > 0 && scanState === "SCANNING" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 px-2 pb-1 flex flex-col gap-1">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="text-[9px] font-mono text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                                        <Zap className="w-2.5 h-2.5" /> {log}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>

        {/* RIGHT COLUMN: AMBIENT TELEMETRY FEED (NOW VISIBLE ON MOBILE) */}
        <div className="flex w-full lg:w-[340px] flex-col gap-3 pointer-events-none z-20 mt-8 mb-24 lg:mb-0">
            <div className="flex items-center gap-2 mb-1 px-2 border-b border-blue-900/30 pb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-mono font-bold text-zinc-300 tracking-[0.2em] uppercase">Live Asset Recovery Feed</span>
            </div>
            
            <AnimatePresence mode="popLayout">
                {ambientTraces.map((trace) => (
                    <motion.div 
                        layout key={trace.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 150, damping: 18 }} 
                        className={`bg-[#050508]/80 backdrop-blur-md border p-4 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${trace.isTarget ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-blue-900/40'}`}
                    >
                        {trace.isTarget && (
                            <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent skew-x-12 z-0" />
                        )}
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                                <div className={`flex items-center gap-1.5 text-[8px] font-mono tracking-widest uppercase mb-1 ${trace.isTarget ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                  <MapPin size={10} className={trace.isTarget ? 'text-emerald-500' : 'text-blue-500'} /> {trace.origin.id} <ArrowRight size={8} /> {trace.dest.id}
                                </div>
                                <div className="text-[11px] text-white font-mono tracking-wider">{trace.hash}</div>
                            </div>
                            <div className={`px-2 py-1 border text-[7px] font-mono tracking-widest uppercase flex items-center gap-1 ${trace.isTarget || trace.status === "FEE DEPOSITED" ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'}`}>
                                {trace.isTarget || trace.status === "FEE DEPOSITED" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5 animate-pulse" />} 
                                {trace.isTarget ? 'ASSET SECURED' : trace.status}
                            </div>
                        </div>
                        <div className={`flex items-center justify-between border-t pt-3 relative z-10 ${trace.isTarget ? 'border-emerald-900/60' : 'border-blue-900/40'}`}>
                            <div>
                                <div className={`text-[8px] font-mono tracking-widest uppercase mb-0.5 ${trace.isTarget ? 'text-emerald-500' : 'text-zinc-500'}`}>Recovered Value</div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`text-[11px] font-black font-mono ${trace.isTarget ? 'text-white' : 'text-cyan-400'}`}>{trace.amount}</div>
                                    <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${trace.isTarget ? 'bg-emerald-500 text-black' : 'bg-cyan-400/20 text-cyan-500'}`}>{trace.ticker}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-[8px] font-mono tracking-widest uppercase mb-0.5 ${trace.isTarget || trace.status === "FEE DEPOSITED" ? 'text-emerald-500' : 'text-zinc-500'}`}>7% Verification Fee</div>
                                <div className="flex items-center justify-end gap-1.5">
                                    <div className={`text-[10px] font-bold font-mono ${trace.isTarget || trace.status === "FEE DEPOSITED" ? 'text-emerald-400' : 'text-zinc-300'}`}>{trace.fee}</div>
                                    <div className={`text-[7px] font-bold ${trace.isTarget || trace.status === "FEE DEPOSITED" ? 'text-emerald-500' : 'text-zinc-500'}`}>{trace.ticker}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* SUCCESS: TARGET LOCKED HUD */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {targetTrace && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-10 md:left-1/2 md:-translate-x-1/2 md:w-[650px] z-50 p-4 md:p-0"
            >
                <div className="bg-[#0A0A0E]/95 backdrop-blur-3xl border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] p-5 md:p-6 overflow-hidden relative">
                    <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2.5, ease: "linear", repeat: Infinity }} className="absolute left-0 right-0 h-[1px] bg-emerald-500/50 shadow-[0_0_15px_#10b981] z-0 pointer-events-none" />
                    
                    <div className="relative z-10 flex justify-between items-center mb-5 border-b border-emerald-900/50 pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] md:text-xs font-mono font-bold text-white tracking-[0.2em] uppercase">Asset Recovered // {targetTrace.network} Ledger</span>
                        </div>
                        <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/50 text-[8px] md:text-[9px] text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED MATCH
                        </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                            <div>
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">Live Transaction Hash</div>
                                <div className="text-[11px] md:text-xs text-emerald-400 font-mono tracking-wider"><ScrambleText text={targetTrace.fullHash} /></div>
                            </div>
                            <div className="md:text-right">
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">Network Timestamp (UTC)</div>
                                <div className="text-[10px] md:text-[11px] text-zinc-300 font-mono flex items-center md:justify-end gap-1.5"><Clock className="w-3 h-3 text-emerald-500" /> <ScrambleText text={targetTrace.timestamp} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">Origin Node (Sender)</div>
                                <div className="text-[10px] md:text-[11px] text-zinc-300 font-mono bg-[#050508] p-2 border border-emerald-900/30 break-all"><ScrambleText text={targetTrace.from} /></div>
                            </div>
                            <div>
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">Destination Node (Receiver)</div>
                                <div className="text-[10px] md:text-[11px] text-zinc-300 font-mono bg-[#050508] p-2 border border-emerald-900/30 break-all"><ScrambleText text={targetTrace.to} /></div>
                            </div>
                        </div>

                        <div className="bg-[#050508] border border-emerald-900/50 p-4 flex justify-between items-center mt-2">
                            <div>
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-2">Total Funds Frozen</div>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl md:text-3xl font-black text-white tracking-tighter shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                        <ScrambleText text={targetTrace.amount} />
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500 text-black font-black text-[10px] md:text-xs tracking-widest rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                        {targetTrace.ticker}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[8px] md:text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">7% Verification Fee</div>
                                <div className="text-lg md:text-xl font-bold text-emerald-400 font-mono uppercase flex items-center gap-1 justify-end">
                                    {targetTrace.fee} <span className="text-[9px] text-emerald-600">{targetTrace.ticker}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => {setTargetTrace(null); setScanState("IDLE"); setInputValue("");}} className="w-full mt-5 text-[9px] text-zinc-500 hover:text-white font-mono uppercase tracking-widest transition-colors pb-1">
                        [ DISMISS HUD ]
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}