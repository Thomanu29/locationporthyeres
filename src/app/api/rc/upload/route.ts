import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendRcReceivedOwnerEmail } from '@/lib/emails'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, guest_name, guest_email, check_in, check_out, rc_status, rc_deadline')
    .eq('rc_upload_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })

  return NextResponse.json(booking)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const token = formData.get('token') as string | null

    if (!file || !token) {
      return NextResponse.json({ error: 'Fichier et token requis' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, WebP' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 5 Mo' }, { status: 400 })
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, guest_name, guest_email, check_in, check_out, rc_status')
      .eq('rc_upload_token', token)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    if (booking.rc_status === 'received') {
      return NextResponse.json({ error: 'Votre attestation RC a déjà été reçue' }, { status: 400 })
    }

    if (booking.rc_status === 'cancelled_no_rc') {
      return NextResponse.json({ error: 'Cette réservation a été annulée' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${booking.id}/responsabilite_civile_${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('document')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: `Erreur d'upload : ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('document')
      .getPublicUrl(fileName)

    await supabaseAdmin
      .from('booking_documents')
      .insert({
        booking_id: booking.id,
        document_type: 'responsabilite_civile',
        file_url: urlData.publicUrl,
      })

    await supabaseAdmin
      .from('bookings')
      .update({
        rc_status: 'received',
        rc_received_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    await sendRcReceivedOwnerEmail(booking.guest_name, booking.check_in, booking.check_out, true)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('RC upload error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
