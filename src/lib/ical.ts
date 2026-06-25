import icalGenerator from 'ical-generator'
import { supabaseAdmin } from './supabase'
import type { Booking, BlockedDate, ImportedEvent, IcalSource } from './types'
import { formatLocalDate } from './date-utils'

function toDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function addDays(dateStr: string, days: number): Date {
  const d = toDate(dateStr)
  d.setDate(d.getDate() + days)
  return d
}

/*
 * DATE CONVENTIONS:
 *
 * bookings.check_out     → EXCLUSIVE (departure day = first free day)
 * blocked_dates.date_end → INCLUSIVE (last blocked day)
 * imported_events.date_end → EXCLUSIVE (first free day, matches iCal DTEND)
 * iCal DTEND (VALUE=DATE) → EXCLUSIVE (first free day)
 *
 * Examples:
 *   Booking check_in=2026-06-25, check_out=2026-06-29
 *     → 4 nights blocked: 25,26,27,28. iCal DTEND=20260629
 *
 *   Manual block date_start=2026-06-28, date_end=2026-06-29
 *     → 2 days blocked: 28,29. iCal DTEND=20260630 (date_end+1)
 *
 *   Airbnb import DTSTART=20260701, DTEND=20260704
 *     → stored date_start=2026-07-01, date_end=2026-07-04
 *     → 3 nights blocked: 01,02,03. iCal DTEND=20260704 (as-is)
 */

export function generateIcalFeed(
  bookings: Booking[],
  blockedDates: BlockedDate[],
  importedEvents: ImportedEvent[] = [],
): string {
  const calendar = icalGenerator({
    name: 'Appartement du Port - Hyères',
    prodId: { company: 'locationporthyeres.fr', product: 'booking-calendar' },
  })

  // bookings: check_out is EXCLUSIVE → use as DTEND directly
  for (const booking of bookings) {
    const event = calendar.createEvent({
      start: toDate(booking.check_in),
      end: toDate(booking.check_out),
      summary: 'Réservé',
      description: `Réservation ${booking.source || 'directe'} - ${booking.guest_name}`,
    })
    event.uid(booking.id)
  }

  // blocked_dates: date_end is INCLUSIVE → DTEND = date_end + 1
  for (const block of blockedDates) {
    const event = calendar.createEvent({
      start: toDate(block.date_start),
      end: addDays(block.date_end, 1),
      summary: block.reason || 'Indisponible',
    })
    event.uid(`blocked-${block.id}`)
  }

  // imported_events: date_end is EXCLUSIVE → use as DTEND directly
  for (const imp of importedEvents) {
    const event = calendar.createEvent({
      start: toDate(imp.date_start),
      end: toDate(imp.date_end),
      summary: imp.summary || 'Indisponible (import)',
    })
    event.uid(`import-${imp.id}`)
  }

  return calendar.toString()
}

interface ParsedEvent {
  uid: string
  dateStart: string
  dateEnd: string
  summary: string
}

export async function syncIcalSource(source: IcalSource): Promise<{
  upserted: number
  removed: number
  conflicts: Array<{ importStart: string; importEnd: string; bookingStart: string; bookingEnd: string }>
}> {
  const nodeIcal = await import('node-ical')
  const events = await nodeIcal.fromURL(source.ical_url)
  const parsed: ParsedEvent[] = []

  for (const key of Object.keys(events)) {
    const event = events[key]
    if (!event || event.type !== 'VEVENT') continue

    const vevent = event as { uid?: string; start?: Date; end?: Date; summary?: string }
    const start = vevent.start ? new Date(vevent.start as unknown as string) : null
    const end = vevent.end ? new Date(vevent.end as unknown as string) : null
    if (!start || !end) continue

    const uid = vevent.uid || key
    // date_end stored as EXCLUSIVE (matching iCal DTEND)
    parsed.push({
      uid,
      dateStart: formatLocalDate(start),
      dateEnd: formatLocalDate(end),
      summary: (vevent.summary as string) || '',
    })
  }

  const remoteUids = new Set(parsed.map((e) => e.uid))

  // Upsert all events from the feed
  let upserted = 0
  for (const ev of parsed) {
    const { error } = await supabaseAdmin
      .from('imported_events')
      .upsert(
        {
          source_id: source.id,
          uid: ev.uid,
          date_start: ev.dateStart,
          date_end: ev.dateEnd,
          summary: ev.summary,
        },
        { onConflict: 'source_id,uid' },
      )
    if (!error) upserted++
  }

  // Remove events that disappeared from the feed (cancellations)
  const { data: existing } = await supabaseAdmin
    .from('imported_events')
    .select('id, uid')
    .eq('source_id', source.id)

  let removed = 0
  for (const row of existing ?? []) {
    if (!remoteUids.has(row.uid)) {
      await supabaseAdmin.from('imported_events').delete().eq('id', row.id)
      removed++
    }
  }

  // Detect conflicts with direct bookings
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('check_in, check_out')
    .eq('payment_status', 'paid')
    .eq('status', 'confirmed')

  const conflicts: Array<{ importStart: string; importEnd: string; bookingStart: string; bookingEnd: string }> = []
  for (const ev of parsed) {
    for (const b of bookings ?? []) {
      // Both date_end and check_out are EXCLUSIVE: overlap when start < otherEnd AND otherStart < end
      if (ev.dateStart < b.check_out && b.check_in < ev.dateEnd) {
        conflicts.push({
          importStart: ev.dateStart,
          importEnd: ev.dateEnd,
          bookingStart: b.check_in,
          bookingEnd: b.check_out,
        })
      }
    }
  }

  // Update source status
  await supabaseAdmin
    .from('ical_sources')
    .update({ last_sync: new Date().toISOString(), sync_status: 'ok', sync_error: null })
    .eq('id', source.id)

  return { upserted, removed, conflicts }
}

export async function getUnavailableDates(): Promise<string[]> {
  const dates: Set<string> = new Set()

  // bookings: check_out is EXCLUSIVE
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('check_in, check_out')
    .eq('payment_status', 'paid')
    .eq('status', 'confirmed')

  if (bookings) {
    for (const booking of bookings) {
      const start = new Date(booking.check_in)
      const end = new Date(booking.check_out)
      const current = new Date(start)
      while (current < end) {
        dates.add(formatLocalDate(current))
        current.setDate(current.getDate() + 1)
      }
    }
  }

  // blocked_dates: date_end is INCLUSIVE
  const { data: blocked } = await supabaseAdmin
    .from('blocked_dates')
    .select('date_start, date_end')

  if (blocked) {
    for (const block of blocked) {
      const start = new Date(block.date_start)
      const end = new Date(block.date_end)
      const current = new Date(start)
      while (current <= end) {
        dates.add(formatLocalDate(current))
        current.setDate(current.getDate() + 1)
      }
    }
  }

  // imported_events: date_end is EXCLUSIVE
  const { data: imported } = await supabaseAdmin
    .from('imported_events')
    .select('date_start, date_end')

  if (imported) {
    for (const imp of imported) {
      const start = new Date(imp.date_start)
      const end = new Date(imp.date_end)
      const current = new Date(start)
      while (current < end) {
        dates.add(formatLocalDate(current))
        current.setDate(current.getDate() + 1)
      }
    }
  }

  return Array.from(dates).sort()
}
