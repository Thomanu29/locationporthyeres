import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })

      const lastMessage = messages?.[0]
      const unreadCount = messages?.filter((m) => m.sender === 'guest').length ?? 0

      return {
        ...conv,
        last_message_preview: lastMessage?.content?.slice(0, 100) ?? '',
        last_message_sender: lastMessage?.sender ?? null,
        unread_count: unreadCount,
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function PATCH(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id et status requis' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
