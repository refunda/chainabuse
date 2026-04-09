import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize God Mode Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, password, ...updates } = body

    console.log(`API: Updating user ${id}`)

    // 1. Update Auth (Password/Email) if provided
    if (password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        password: password
      })
      if (authError) throw authError
    }

    // 2. Update Profile Data
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}