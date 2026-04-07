import { createClient } from '@/lib/supabase/server'
import { ChatView } from './ChatView'
import type { ChatMessage, ClientProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<ClientProfile>()
  if (!profile) return null

  const { data: history } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: true })
    .limit(50)
    .returns<ChatMessage[]>()

  return <ChatView initialMessages={history ?? []} />
}
