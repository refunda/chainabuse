"use client";

import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import { Lock } from "lucide-react";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
        <div className="mb-12 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono mb-4">
                <Lock className="w-3 h-3" /> ENCRYPTED DATA
            </div>
            <h1 className="text-4xl font-bold mb-4">Data Privacy Protocol</h1>
            <p className="text-gray-400 text-sm">Encryption Level: AES-256 // Zero-Knowledge Architecture</p>
        </div>

        <div className="space-y-8 text-gray-300">
            <p>
                Your privacy is not just a policy; it is the core of our architecture. Refunda utilizes a Zero-Knowledge Proof (ZKP) system for case intake.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-xl">
                    <h4 className="text-white font-bold mb-2">What We Collect</h4>
                    <ul className="text-sm text-gray-400 list-disc pl-4 space-y-2">
                        <li>Public Wallet Addresses</li>
                        <li>Transaction Hashes (TXIDs)</li>
                        <li>Email for Case Updates</li>
                    </ul>
                </div>
                <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-xl">
                    <h4 className="text-white font-bold mb-2">What We NEVER Collect</h4>
                    <ul className="text-sm text-gray-400 list-disc pl-4 space-y-2">
                        <li>Private Keys / Seed Phrases</li>
                        <li>Wallet Passwords</li>
                        <li>Biometric Data</li>
                    </ul>
                </div>
            </div>

            <p>
                All user data is automatically purged from our hot storage after case resolution (30 days). Long-term records are hashed and stored cold-offline for legal compliance only.
            </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
