"use client";

import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import { ShieldAlert, FileCheck, Landmark } from "lucide-react";

export default function Compliance() {
  return (
    <main className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-mono mb-4">
                <ShieldAlert className="w-3 h-3" /> OFFICIAL PROTOCOL
            </div>
            <h1 className="text-4xl font-bold mb-4">Recovery & Compliance Mandate</h1>
            <p className="text-gray-400 text-sm">Last Updated: February 2026 // Reference: RF-COMP-2026</p>
        </div>

        {/* Content */}
        <div className="space-y-12 text-gray-300 leading-relaxed">
            
            <section>
                <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-purple-400" /> 1. Asset Recovery Framework
                </h3>
                <p className="mb-4">
                    Refunda operates strictly within the guidelines of international forensic asset recovery. We utilize advanced blockchain heuristics to trace, tag, and identify misappropriated digital assets.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                    <li>We do not hack, exploit, or brute-force private wallets.</li>
                    <li>Our jurisdiction allows for the freezing of assets only when they enter centralized, regulated endpoints (CEX).</li>
                    <li>All recovery actions require a verified Proof of Loss (PoL) from the claimant.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-green-400" /> 2. KYC & AML Compliance
                </h3>
                <p className="mb-4">
                    To comply with Global Anti-Money Laundering (AML) directives, all users recovering assets above $10,000 USD value must undergo Identity Verification.
                </p>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl">
                    <p className="text-xs font-mono text-gray-500">
                        "The Protocol adheres to FATF (Financial Action Task Force) Recommendation 16 regarding the travel rule for virtual assets."
                    </p>
                </div>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">3. Legal Liability Disclaimer</h3>
                <p>
                    Refunda provides forensic data analysis. We guarantee the accuracy of our blockchain scans but cannot guarantee the cooperation of third-party exchanges or law enforcement agencies in every jurisdiction. Success rates are estimated based on historical data.
                </p>
            </section>

        </div>
      </div>

      <Footer />
    </main>
  );
}
