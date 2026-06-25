import icalGenerator from 'ical-generator'
import { supabaseAdmin } from './supabase'
import type { Booking, BlockedDate } from './types'
import { formatLocalDate } from './date-utils'

function addDaysToDate(dateStr: string, days: number): Date {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d
}

export function generateIcalFeed(bookings: Booking[], blockedDates: BlockedDate[]): string {
  const calendar = icalGenerator({
    name: 'Appartement du Port - Hyères',
    prodId: { company: 'locationporthyeres.fr', product: 'booking-calendar' },
  })

  for (const booking of bookings) {
    const event = calendar.createEvent({
      start: new Date(booking.check_in + 'T00:00:00'),
      end: new Date(booking.check_out + 'T00:00:00'),
      summary: 'Réservé',
      description: `Réservation ${booking.source || 'directe'} - ${booking.guest_name}`,
    })
    event.uid(booking.id)
  }

  const bookedRanges = bookings.map((b) => `${b.check_in}_${b.check_out}`)

  for (const block of blockedDates) {
    const rangeKey = `${block.date_start}_${block.date_end}`
    if (bookedRanges.includes(rangeKey)) continue

    const dtEnd = addDaysToDate(block.date_end, 1)

    const event = calendar.createEvent({
      start: new Date(block.date_start + 'T00:00:00'),
      end: dtEnd,
      summary: block.reason || 'Indisponible',
    })
    event.uid(`blocked-${block.id}`)
  }

  return calendar.toString()
}

export async function syncIcalSource(icalUrl: string): Promise<string[]> {
  const nodeIcal = await import('node-ical')
  const events = await nodeIcal.fromURL(icalUrl)
  const blockedDates: string[] = []

  for (const key of Object.keys(events)) {
    const event = events[key]
    if (!event || event.type !== 'VEVENT') continue

    const vevent = event as { start?: Date; end?: Date }
    const start = vevent.start ? new Date(vevent.start as unknown as string) : null
    const end = vevent.end ? new Date(vevent.end as unknown as string) : null
    if (!start || !end) continue

    const current = new Date(start)
    while (current < end) {
      blockedDates.push(formatLocalDate(current))
      current.setDate(current.getDate() + 1)
    }
  }

  return blockedDates
}

export async function getUnavailableDates(): Promise<string[]> {
  const dates: Set<string> = new Set()

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

  return Array.from(dates).sort()
}
