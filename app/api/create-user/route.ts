import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Initialize Client INSIDE the function to bypass Vercel build crashes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Missing Supabase Environment Variables");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json()
    const { email, password, role, fullName, referralCode } = body

    console.log(`API: Creating user ${email} as ${role}`)

    // 2. Create User in Auth System
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
        console.error("Auth Error:", createError.message)
        throw new Error("Auth Error: " + createError.message)
    }

    // 3. FORCE INSERT Profile Entry (The Fix)
    if (user.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.user.id,
          email: email, // Explicitly save email to profile
          full_name: fullName,
          role: role,
          referral_code: role === 'admin' ? referralCode : null,
          status: 'verified',
          created_at: new Date().toISOString()
        })

      if (profileError) {
          console.error("Profile Error:", profileError.message)
          // Even if profile fails, user is created. We try to delete auth user to roll back.
          await supabase.auth.admin.deleteUser(user.user.id)
          throw new Error("Database Profile Error: " + profileError.message)
      }
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error("API Critical Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}