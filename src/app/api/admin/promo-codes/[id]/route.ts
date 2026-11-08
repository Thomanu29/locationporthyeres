import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'
import { promoCodeInputSchema, firstIssue } from '@/lib/promo-admin'

// Partial updates allowed, e.g. { is_active: false } from the activate/deactivate button
const updateSchema = promoCodeInputSchema.partial()

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/admin/promo-codes/[id]'>) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })

  // .partial() keeps defaults, so only send the keys the client actually provided
  const update = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => key in body),
  )
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/admin/promo-codes/[id]'>) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
