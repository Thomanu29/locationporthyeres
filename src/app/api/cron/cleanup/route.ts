import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data: expired, error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('payment_status', 'pending')
      .lt('created_at', thirtyMinAgo)
      .select('id')

    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: expired?.length ?? 0 })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
