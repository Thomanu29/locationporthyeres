import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function shortName(guestName: string): string {
  const parts = guestName.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] ?? guestName
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('guest_name, check_in, check_out, review_submitted_at')
    .eq('review_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })

  return NextResponse.json({
    guest_name: booking.guest_name,
    check_in: booking.check_in,
    check_out: booking.check_out,
    already_submitted: !!booking.review_submitted_at,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, rating, comment, reviewer_location, reviewer_name, website } = body

    // Honeypot: real visitors never fill this hidden field.
    if (typeof website === 'string' && website.trim()) {
      return NextResponse.json({ ok: true })
    }

    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Note invalide' }, { status: 400 })
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Commentaire requis' }, { status: 400 })
    }

    const locationValue =
      reviewer_location && typeof reviewer_location === 'string' ? reviewer_location.trim() || null : null

    if (token) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id, guest_name, check_out, review_submitted_at')
        .eq('review_token', token)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
      }

      if (booking.review_submitted_at) {
        return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour ce séjour' }, { status: 400 })
      }

      const { error: insertError } = await supabaseAdmin.from('reviews').insert({
        reviewer_name: shortName(booking.guest_name),
        reviewer_location: locationValue,
        rating: ratingNum,
        comment: comment.trim(),
        stay_date: booking.check_out,
        source: 'direct',
        is_visible: false,
      })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ review_submitted_at: new Date().toISOString() })
        .eq('id', booking.id)

      if (updateError) {
        console.error('booking review_submitted_at update error:', updateError)
      }

      return NextResponse.json({ ok: true })
    }

    // No token: open public submission from the site's "Leave a review" card.
    if (!reviewer_name || typeof reviewer_name !== 'string' || !reviewer_name.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const { error: insertError } = await supabaseAdmin.from('reviews').insert({
      reviewer_name: reviewer_name.trim(),
      reviewer_location: locationValue,
      rating: ratingNum,
      comment: comment.trim(),
      source: 'direct',
      is_visible: false,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
