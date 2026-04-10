import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SYMBOLS: Record<string, string> = {
  USD: '$', CAD: 'C$', GBP: '£', EUR: '€', AUD: 'A$', 
  JPY: '¥', CNY: '¥', CHF: 'CHF', HKD: 'HK$', SGD: 'S$', 
  INR: '₹', AED: 'د.إ', SAR: '﷼', MXN: '$', BRL: 'R$'
};

export async function GET(request: Request) {
  try {
    // 1. Move Supabase setup INSIDE the function to bypass Vercel build crash
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Missing Supabase Env Vars in Cron Route");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Fetch Rates
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    if (data.result !== 'success') throw new Error('API unavailable');

    const targetCurrencies = Object.keys(SYMBOLS);
    const updates = targetCurrencies.map(code => ({
      code: code,
      symbol: SYMBOLS[code],
      rate_to_usd: data.rates[code] || 1.0, 
      updated_at: new Date().toISOString()
    }));

    // 3. Update Database
    const { error: dbError } = await supabase.from('currencies').upsert(updates, { onConflict: 'code' });
    if (dbError) throw dbError;

    return NextResponse.json({ success: true, updated_count: updates.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}