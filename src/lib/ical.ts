import icalGenerator from 'ical-generator'
import { supabaseAdmin } from './supabase'
import type { Booking } from './types'
import { formatLocalDate } from './date-utils'

export function generateIcalFeed(bookings: Booking[]): string {
  const calendar = icalGenerator({
    name: 'Appartement du Port - Hyères',
    prodId: { company: 'locationporthyeres.fr', product: 'booking-calendar' },
  })

  for (const booking of bookings) {
    const event = calendar.createEvent({
      start: new Date(booking.check_in),
      end: new Date(booking.check_out),
      summary: 'BLOCKED',
      description: `Réservation ${booking.source} - ${booking.guest_name}`,
    })
    event.uid(booking.id)
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
