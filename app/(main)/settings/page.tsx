import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from './settings-tabs'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, dark_mode')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">設定</h1>
      <SettingsTabs
        displayName={profile?.display_name ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  )
}
