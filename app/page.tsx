"use client";

// THE CRITICAL IMPORTS (This is what was missing!)
import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero"; 
import ForensicTerminal from "./components/landing/ForensicTerminal"; // <--- This fixes the crash!
import Terminal from "./components/landing/Terminal"; 
import ProtocolMap from "./components/landing/ProtocolMap";
import Features from "./components/landing/Features";
import Testimonials from "./components/landing/Testimonials";
import FAQ from "./components/landing/FAQ";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030305] text-white selection:bg-cyan-500/30 font-sans antialiased">
      
      <Navbar />
      
      {/* 1. HERO COMMAND CENTER */}
      <Hero />
      
      {/* 2. FORENSIC TERMINAL (The interactive Auth -> Trace -> Extract widget) */}
      <section className="w-full pt-12 pb-24 px-6 flex justify-center items-center bg-[#030305] relative z-10 border-t border-blue-900/30">
        <div className="w-full max-w-[1200px]">
           <ForensicTerminal />
        </div>
      </section>

      {/* 3. DEEP MEMORY SURVEILLANCE (The 3D Grid) */}
      <Terminal />
      
      {/* 4. THE COMMAND CORE MAP */}
      <ProtocolMap />
      
      {/* 5. SYSTEM PROFICIENCIES */}
      <Features />
      
      {/* 6. DECLASSIFIED CASE FILES */}
      <Testimonials />
      
      {/* 7. THREAT INTEL DATABASE */}
      <FAQ />
      
      {/* 8. SYSTEM SIGN-OFF */}
      <Footer />
      
    </main>
  );
}