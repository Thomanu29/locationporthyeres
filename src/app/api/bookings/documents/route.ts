import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bookingId = formData.get('booking_id') as string | null

    if (!file || !bookingId) {
      return NextResponse.json(
        { error: 'Fichier et booking_id requis' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 5 Mo' },
        { status: 400 }
      )
    }

    // Verify the booking exists and is paid
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('payment_status', 'paid')
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable ou non payée' },
        { status: 404 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}/responsabilite_civile_${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('document')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Erreur d'upload : ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('document')
      .getPublicUrl(fileName)

    const { data: doc, error: insertError } = await supabaseAdmin
      .from('booking_documents')
      .insert({
        booking_id: bookingId,
        document_type: 'responsabilite_civile',
        file_url: urlData.publicUrl,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('booking_id')

  if (!bookingId) {
    return NextResponse.json(
      { error: 'booking_id requis' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('booking_documents')
    .select('*')
    .eq('booking_id', bookingId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
