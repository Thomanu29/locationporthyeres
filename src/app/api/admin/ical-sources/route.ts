import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'
import { syncIcalSource } from '@/lib/ical'
import { sendIcalConflictAlert } from '@/lib/emails'
import type { IcalSource } from '@/lib/types'

export async function GET(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  // Read-only: list the configured sources. Fetching the external calendars is the cron's job.
  // ical_sources has no created_at column, so order by platform then name.
  try {
    const { data, error } = await supabaseAdmin
      .from('ical_sources')
      .select('*')
      .order('platform', { ascending: true })
      .order('name', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('ical_sources read error:', error)
      return NextResponse.json({ error: `Lecture des calendriers impossible : ${error.message}` }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('ical_sources read error:', err)
    return NextResponse.json({ error: 'Lecture des calendriers impossible' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const body = await req.json()
  const { name, platform, ical_url } = body as { name: string; platform: string; ical_url: string }

  if (!ical_url || !platform) {
    return NextResponse.json({ error: 'URL et plateforme requis' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('ical_sources')
    .insert({ name: name || null, platform, ical_url, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { id, action } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  if (action === 'sync') {
    const { data: source } = await supabaseAdmin
      .from('ical_sources')
      .select('*')
      .eq('id', id)
      .single()

    if (!source) return NextResponse.json({ error: 'Source introuvable' }, { status: 404 })

    try {
      const result = await syncIcalSource(source as IcalSource)

      if (result.conflicts.length > 0) {
        try {
          await sendIcalConflictAlert(source.name || source.platform, result.conflicts)
        } catch {}
      }

      return NextResponse.json({ ok: true, ...result })
    } catch (err) {
      await supabaseAdmin
        .from('ical_sources')
        .update({ sync_status: 'error', sync_error: String(err).slice(0, 500) })
        .eq('id', id)

      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (action === 'toggle') {
    const { data: source } = await supabaseAdmin
      .from('ical_sources')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!source) return NextResponse.json({ error: 'Source introuvable' }, { status: 404 })

    await supabaseAdmin
      .from('ical_sources')
      .update({ is_active: !source.is_active })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabaseAdmin.from('ical_sources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
