'use server'

import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function createNewAdminUser(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const subscriptionDays = parseInt(formData.get('subscriptionDays') as string)
  
  if (!email || !password) return { error: 'Email and Password are required' }

  try {
    let endsAt = null;
    if (subscriptionDays && subscriptionDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + subscriptionDays);
        endsAt = date.toISOString();
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    const { data: codeData } = await supabaseAdmin.rpc('generate_next_admin_code')
    const finalCode = codeData || ('ADM-' + Math.floor(Math.random() * 10000));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin', 
        full_name: fullName,
        referral_code: finalCode,
        account_status: 'active',
        subscription_ends_at: endsAt
      })
      .eq('id', authData.user.id)

    if (profileError) return { error: `Profile update failed: ${profileError.message}` }

    return { success: true, code: finalCode }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function editAdminUser(userId: string, data: { fullName: string, referralCode: string, password?: string }) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        if (data.password && data.password.trim() !== '') {
            const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password });
            if (authErr) throw authErr;
        }

        const { error: profileErr } = await supabaseAdmin.from('profiles').update({
            full_name: data.fullName,
            referral_code: data.referralCode
        }).eq('id', userId);

        if (profileErr) throw profileErr;
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function toggleAdminStatus(userId: string, currentStatus: string) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabaseAdmin.from('profiles').update({ account_status: newStatus }).eq('id', userId);
    if (error) throw error;
    return { success: true, status: newStatus };
  } catch (error: any) { return { error: error.message }; }
}

export async function updateAdminSubscription(userId: string, dateIsoString: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { error } = await supabaseAdmin.from('profiles').update({ subscription_ends_at: dateIsoString }).eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { error: error.message }; }
}

export async function deleteAdmin(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) { return { error: error.message }; }
}