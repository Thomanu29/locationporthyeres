import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { syncIcalSource } from '@/lib/ical'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: sources } = await supabaseAdmin
      .from('ical_sources')
      .select('*')
      .eq('is_active', true)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ message: 'No active iCal sources' })
    }

    const results = []

    for (const source of sources) {
      try {
        const blockedDates = await syncIcalSource(source.ical_url)

        for (const dateStr of blockedDates) {
          await supabaseAdmin
            .from('blocked_dates')
            .upsert(
              { date_start: dateStr, date_end: dateStr, reason: `Sync ${source.platform}` },
              { onConflict: 'date_start,date_end' }
            )
        }

        await supabaseAdmin
          .from('ical_sources')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', source.id)

        results.push({ platform: source.platform, dates: blockedDates.length })
      } catch (err) {
        results.push({ platform: source.platform, error: String(err) })
      }
    }

    return NextResponse.json({ synced: results })
  } catch (error) {
    console.error('iCal sync error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
