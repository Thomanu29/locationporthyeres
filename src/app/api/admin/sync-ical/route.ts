import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { syncAllIcalSources } from '@/lib/ical-sync'

export async function POST(req: NextRequest) {
  const denied = verifyAdmin(req)
  if (denied) return denied

  try {
    const results = await syncAllIcalSources()

    const failed = results.filter((r) => 'error' in r)
    if (failed.length > 0) {
      const names = failed.map((r) => r.name || r.platform).join(', ')
      return NextResponse.json({ error: `Échec de la synchronisation : ${names}` }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin iCal sync error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
