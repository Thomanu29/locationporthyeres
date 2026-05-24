import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('photos')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const category = formData.get('category') as string
  const alt = formData.get('alt') as string | null

  if (!file || !category) {
    return NextResponse.json({ error: 'Fichier et catégorie requis' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${category}/${Date.now()}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabaseAdmin.storage
    .from('photos')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('photos').getPublicUrl(fileName)

  const { data: photo, error: insertError } = await supabaseAdmin
    .from('photos')
    .insert({
      category,
      url: urlData.publicUrl,
      alt: alt || category,
      sort_order: 0,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(photo, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: photo } = await supabaseAdmin
    .from('photos')
    .select('url')
    .eq('id', id)
    .single()

  if (photo) {
    const urlParts = photo.url.split('/photos/')
    if (urlParts.length > 1) {
      const path = urlParts[urlParts.length - 1]
      await supabaseAdmin.storage.from('photos').remove([path])
    }
  }

  const { error } = await supabaseAdmin.from('photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
