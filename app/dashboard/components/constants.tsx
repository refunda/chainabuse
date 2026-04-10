import React from "react";
import { 
    LayoutDashboard, Wallet, Shield, Lock, Settings, Mail, LogOut, 
    CheckCircle, AlertTriangle, ShoppingCart, Layers 
} from "lucide-react";

export const THEME = {
    bg: "#020203", 
    sidebarBg: "#050508",
    cardBg: "rgba(5, 5, 8, 0.8)",
    border: "1px solid rgba(34, 211, 238, 0.15)",
    glassBorder: "1px solid rgba(255, 255, 255, 0.05)",
    accent: "#06b6d4", 
    accentGlow: "0 0 35px rgba(6, 182, 212, 0.3)", 
    accentGradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", 
    success: "#10b981", 
    danger: "#ef4444",  
    warning: "#f59e0b", 
    text: "#f4f4f5", 
    textDim: "#71717a", 
};

// THESE NAMES NOW CONTROL THE SIDEBAR PERFECTLY
export const NAV_ITEMS = [
    { id: "overview", label: "Terminal", icon: <LayoutDashboard size={20} /> },
    { id: "assets", label: "Assets", icon: <Wallet size={20} /> },
    { id: "buy_crypto", label: "Buy Crypto", icon: <ShoppingCart size={20} /> }, 
    { id: "staking", label: "Staking", icon: <Layers size={20} /> }, 
    { id: "verification", label: "Verification", icon: <CheckCircle size={20} /> },
    { id: "security", label: "Security", icon: <Shield size={20} /> },
    { id: "contact", label: "Contact Support", icon: <Mail size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export const ASSET_LIST = [
    { s: "BTC", n: "Bitcoin", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/btc@2x.png" },
    { s: "ETH", n: "Ethereum", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/eth@2x.png" },
    { s: "BNB", n: "BNB", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/bnb@2x.png" },
    { s: "SOL", n: "Solana", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/sol@2x.png" },
    { s: "XRP", n: "XRP", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/xrp@2x.png" },
    { s: "USDC", n: "USD Coin", p: 1.00, c: 0, l: "https://assets.coincap.io/assets/icons/usdc@2x.png" },
    { s: "ADA", n: "Cardano", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/ada@2x.png" },
    { s: "AVAX", n: "Avalanche", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/avax@2x.png" },
    { s: "DOGE", n: "Dogecoin", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/doge@2x.png" },
    { s: "DOT", n: "Polkadot", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/dot@2x.png" },
    { s: "TRX", n: "TRON", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/trx@2x.png" },
    { s: "LINK", n: "Chainlink", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/link@2x.png" },
    { s: "POL", n: "Polygon", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/pol@2x.png" }, 
    { s: "SHIB", n: "Shiba Inu", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/shib@2x.png" },
    { s: "LTC", n: "Litecoin", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/ltc@2x.png" },
    { s: "BCH", n: "Bitcoin Cash", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/bch@2x.png" },
    { s: "ATOM", n: "Cosmos", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/atom@2x.png" },
    { s: "UNI", n: "Uniswap", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/uni@2x.png" },
    { s: "XLM", n: "Stellar", p: 0, c: 0, l: "https://assets.coincap.io/assets/icons/xlm@2x.png" },
    { s: "USDT", n: "Tether", p: 1.00, c: 0, l: "https://assets.coincap.io/assets/icons/usdt@2x.png" },
];

export const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Germany", "France", "Australia", "Japan", "China", "India", "Brazil",
    "Russia", "South Korea", "Italy", "Spain", "Mexico", "Indonesia", "Netherlands", "Saudi Arabia", "Turkey", "Switzerland",
    "Sweden", "Poland", "Belgium", "Thailand", "Ireland", "Austria", "Nigeria", "Argentina", "Norway", "Israel",
    "United Arab Emirates", "Egypt", "Denmark", "Malaysia", "Singapore", "Hong Kong", "South Africa", "Philippines", "Finland", "Pakistan",
    "Portugal", "Greece", "Ukraine", "Kazakhstan", "Algeria", "Vietnam", "Iraq", "Czech Republic", "Peru", "Qatar"
];