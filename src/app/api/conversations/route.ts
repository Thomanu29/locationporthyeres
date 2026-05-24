import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessageNotification } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { guest_name, guest_email, subject, message } = body

  if (!guest_name || !guest_email || !message) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .insert({ guest_name, guest_email, subject: subject || null })
    .select()
    .single()

  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 })

  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversation.id, sender: 'guest', content: message })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  try {
    await sendMessageNotification(guest_name, guest_email, subject || null, message)
  } catch {}

  return NextResponse.json({ ...conversation, messages })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (convError) return NextResponse.json({ error: convError.message }, { status: 404 })

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ...conversation, messages: messages ?? [] })
}
