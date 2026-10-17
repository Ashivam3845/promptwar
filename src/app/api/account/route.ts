import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseUrl } from '@/lib/supabase';

// DELETE /api/account: permanently deletes the signed-in user's account.
// Deleting the auth user cascades (ON DELETE CASCADE) to their profile, shifts and drafts.
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: 'You must be signed in to delete your account.' }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Account deletion is not configured on this server. Please contact support.' },
      { status: 501 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('Account deletion failed:', deleteError.message);
    return NextResponse.json({ error: 'Could not delete your account. Please try again.' }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
