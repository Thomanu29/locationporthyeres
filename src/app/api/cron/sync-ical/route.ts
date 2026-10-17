import { NextRequest, NextResponse } from 'next/server'
import { syncAllIcalSources } from '@/lib/ical-sync'
import { sendCronFailureAlert } from '@/lib/emails'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await syncAllIcalSources()

    if (results.length === 0) {
      return NextResponse.json({ message: 'No active iCal sources' })
    }

    return NextResponse.json({ synced: results })
  } catch (error) {
    console.error('iCal sync error:', error)
    await sendCronFailureAlert('sync-ical', [String(error)]).catch(() => {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
