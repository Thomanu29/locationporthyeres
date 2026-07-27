import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { syncIcalSource } from '@/lib/ical'
import { sendIcalConflictAlert, sendCronFailureAlert } from '@/lib/emails'
import type { IcalSource } from '@/lib/types'

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

    for (const source of sources as IcalSource[]) {
      try {
        const result = await syncIcalSource(source)

        if (result.conflicts.length > 0) {
          try {
            await sendIcalConflictAlert(source.name || source.platform, result.conflicts)
          } catch (emailErr) {
            console.error(`Conflict alert email failed for ${source.platform}:`, emailErr)
          }
        }

        results.push({
          platform: source.platform,
          name: source.name,
          upserted: result.upserted,
          removed: result.removed,
          conflicts: result.conflicts.length,
        })
      } catch (err) {
        await supabaseAdmin
          .from('ical_sources')
          .update({ sync_status: 'error', sync_error: String(err).slice(0, 500) })
          .eq('id', source.id)

        results.push({ platform: source.platform, name: source.name, error: String(err) })
      }
    }

    const failed = results.filter((r) => 'error' in r)
    if (failed.length > 0) {
      const errors = failed.map((r) => `${r.name || r.platform}: ${(r as { error: string }).error}`)
      await sendCronFailureAlert('sync-ical', errors).catch(() => {})
    }

    return NextResponse.json({ synced: results })
  } catch (error) {
    console.error('iCal sync error:', error)
    await sendCronFailureAlert('sync-ical', [String(error)]).catch(() => {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
