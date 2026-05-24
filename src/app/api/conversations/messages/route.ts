import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'
import { sendOwnerReplyNotification } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { conversation_id, sender, content } = body

  if (!conversation_id || !sender || !content) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  if (sender === 'owner') {
    const denied = verifyAdmin(req)
    if (denied) return denied
  }

  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id, sender, content })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  await supabaseAdmin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', conversation_id)

  if (sender === 'owner') {
    try {
      const { data: convo } = await supabaseAdmin
        .from('conversations')
        .select('guest_name, guest_email')
        .eq('id', conversation_id)
        .single()

      if (convo) {
        await sendOwnerReplyNotification(convo.guest_name, convo.guest_email, content, conversation_id)
      }
    } catch (e) {
      console.error('Reply notification error:', e)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversation_id')
  if (!conversationId) return NextResponse.json({ error: 'conversation_id requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
