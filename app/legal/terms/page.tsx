"use client";

import Navbar from "@/app/components/landing/Navbar";
import Footer from "@/app/components/landing/Footer";
import { Scale } from "lucide-react";

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
        <div className="mb-12 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-mono mb-4">
                <Scale className="w-3 h-3" /> LEGAL BINDING
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-gray-400 text-sm">Effective Date: January 1, 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-7">
            <p>
                By accessing Refunda ("The Protocol"), you agree to be bound by these Terms. If you do not agree, you must disconnect immediately.
            </p>

            <h3 className="text-white font-bold text-lg mt-8">1. Service Scope</h3>
            <p>
                Refunda provides software-as-a-service (SaaS) for blockchain analysis. We are not a bank, law firm, or government agency. Our reports are forensic tools to assist in recovery, not legal judgments.
            </p>

            <h3 className="text-white font-bold text-lg mt-8">2. User Obligations</h3>
            <p>
                You represent that you are the rightful owner of the wallet addresses submitted for analysis. False claims or attempts to track wallets not owned by you (doxing) will result in an immediate ban and reporting to relevant authorities.
            </p>

            <h3 className="text-white font-bold text-lg mt-8">3. Payment & Refunds</h3>
            <p>
                Services are billed in crypto-assets or fiat. Due to the immutable nature of blockchain work, initial scan fees are non-refundable once the computation resources have been expended.
            </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
