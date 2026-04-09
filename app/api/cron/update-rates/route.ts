import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYMBOLS: Record<string, string> = {
  USD: '$', CAD: 'C$', GBP: '£', EUR: '€', AUD: 'A$', 
  JPY: '¥', CNY: '¥', CHF: 'CHF', HKD: 'HK$', SGD: 'S$', 
  INR: '₹', AED: 'د.إ', SAR: '﷼', MXN: '$', BRL: 'R$'
};

export async function GET(request: Request) {
  try {
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

    const { error: dbError } = await supabase.from('currencies').upsert(updates, { onConflict: 'code' });
    if (dbError) throw dbError;

    return NextResponse.json({ success: true, updated_count: updates.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}