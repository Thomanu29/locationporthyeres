import { supabaseAdmin } from './supabase'
import { syncIcalSource } from './ical'
import { sendIcalConflictAlert, sendCronFailureAlert } from './emails'
import type { IcalSource } from './types'

export type IcalSyncResult =
  | { platform: string; name: string | null; upserted: number; removed: number; conflicts: number }
  | { platform: string; name: string | null; error: string }

// Syncs every active iCal source. Shared by the cron job and the admin "resync" button.
export async function syncAllIcalSources(): Promise<IcalSyncResult[]> {
  const { data: sources } = await supabaseAdmin
    .from('ical_sources')
    .select('*')
    .eq('is_active', true)

  if (!sources || sources.length === 0) return []

  const results: IcalSyncResult[] = []

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

  const failed = results.filter((r): r is Extract<IcalSyncResult, { error: string }> => 'error' in r)
  if (failed.length > 0) {
    const errors = failed.map((r) => `${r.name || r.platform}: ${r.error}`)
    await sendCronFailureAlert('sync-ical', errors).catch(() => {})
  }

  return results
}
