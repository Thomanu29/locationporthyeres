'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart3,
  CalendarDays,
  Users,
  Tag,
  Ban,
  Star,
  LogOut,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Euro,
  ImageIcon,
  Upload,
  MessageSquare,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  CalendarPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Booking, DailyPrice, PricingSettings, BlockedDate, Review, Guest, Photo, BookingDocument, IcalSource } from '@/lib/types'
import MessagesTab from '@/components/admin/MessagesTab'
import { RefreshCw } from 'lucide-react'

type Tab = 'dashboard' | 'bookings' | 'guests' | 'pricing' | 'blocked' | 'reviews' | 'photos' | 'messages' | 'rc' | 'sync'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [token, setToken] = useState('')

  const handleLogin = async () => {
    setAuthError('')
    const res = await fetch(`/api/admin/auth?pwd=${encodeURIComponent(password)}`)
    if (res.ok) {
      setAuthenticated(true)
      setToken(password)
    } else {
      setAuthError('Mot de passe incorrect')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Mot de passe"
            className="w-full border border-border rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {authError && <p className="text-red-500 text-sm mb-4">{authError}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            Connexion
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'bookings', label: 'Réservations', icon: CalendarDays },
    { key: 'guests', label: 'Clients', icon: Users },
    { key: 'pricing', label: 'Tarifs', icon: Tag },
    { key: 'blocked', label: 'Blocage', icon: Ban },
    { key: 'reviews', label: 'Avis', icon: Star },
    { key: 'photos', label: 'Photos', icon: ImageIcon },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'rc', label: 'RC Assurances', icon: Shield },
    { key: 'sync', label: 'Sync iCal', icon: RefreshCw },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <h1 className="font-bold text-lg">Admin · Appartement du Port</h1>
          <button
            onClick={() => { setAuthenticated(false); setToken('') }}
            className="flex items-center gap-2 text-muted hover:text-foreground transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && <DashboardTab token={token} />}
        {activeTab === 'bookings' && <BookingsTab token={token} />}
        {activeTab === 'guests' && <GuestsTab token={token} />}
        {activeTab === 'pricing' && <PricingTab token={token} />}
        {activeTab === 'blocked' && <BlockedTab token={token} />}
        {activeTab === 'reviews' && <ReviewsTab token={token} />}
        {activeTab === 'photos' && <PhotosTab token={token} />}
        {activeTab === 'messages' && <MessagesTab token={token} />}
        {activeTab === 'rc' && <RcTab token={token} />}
        {activeTab === 'sync' && <SyncTab token={token} />}
      </div>
    </div>
  )
}

function useFetch<T>(url: string, token: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [url, token])

  useEffect(() => { refresh() }, [refresh])
  return { data, loading, refresh }
}

function DashboardTab({ token }: { token: string }) {
  const { data: bookings } = useFetch<Booking[]>('/api/admin/bookings', token)
  const { data: guests } = useFetch<Guest[]>('/api/admin/guests', token)
  const { data: reviews } = useFetch<Review[]>('/api/admin/reviews', token)

  const paidBookings = bookings?.filter((b) => b.payment_status === 'paid') ?? []
  const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
  const upcomingBookings = paidBookings.filter(
    (b) => new Date(b.check_in) >= new Date() && b.status === 'confirmed'
  )
  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '-'

  const icalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/ical`
    : '/api/calendar/ical'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Revenu total" value={`${totalRevenue.toFixed(0)}€`} icon={Euro} />
        <StatCard label="Séjours à venir" value={String(upcomingBookings.length)} icon={CalendarDays} />
        <StatCard label="Clients" value={String(guests?.length ?? 0)} icon={Users} />
        <StatCard label="Note moyenne" value={avgRating} icon={Star} />
      </div>

      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4">Prochains séjours</h3>
        {upcomingBookings.length === 0 ? (
          <p className="text-muted text-sm">Aucun séjour à venir</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div>
                  <p className="font-medium">{b.guest_name}</p>
                  <p className="text-sm text-muted">
                    {b.check_in} → {b.check_out} · {b.nights} nuits · {b.guest_count} pers.
                  </p>
                </div>
                <span className="font-semibold">{Number(b.total_amount).toFixed(0)}€</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-2">Flux iCal</h3>
        <p className="text-sm text-muted mb-2">URL à importer dans Airbnb / Booking.com :</p>
        <code className="block bg-surface p-3 rounded-lg text-sm break-all">{icalUrl}</code>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 text-muted mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function BookingsTab({ token }: { token: string }) {
  const { data: bookings, loading, refresh: refetch } = useFetch<Booking[]>('/api/admin/bookings', token)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all')
  const [docs, setDocs] = useState<Record<string, BookingDocument[]>>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la réservation de ${name} ?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/bookings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      refetch()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  useEffect(() => {
    if (!bookings) return
    const paidIds = bookings.filter((b) => b.payment_status === 'paid').map((b) => b.id)
    if (paidIds.length === 0) return

    Promise.all(
      paidIds.map((id) =>
        fetch(`/api/bookings/documents?booking_id=${encodeURIComponent(id)}`)
          .then((r) => r.json())
          .then((d: BookingDocument[]) => [id, Array.isArray(d) ? d : []] as const)
          .catch(() => [id, []] as const)
      )
    ).then((results) => {
      const map: Record<string, BookingDocument[]> = {}
      for (const [id, documents] of results) {
        if (documents.length > 0) map[id] = documents as BookingDocument[]
      }
      setDocs(map)
    })
  }, [bookings])

  const filtered = bookings?.filter((b) => filter === 'all' || b.payment_status === filter) ?? []

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="p-4 border-b border-border flex gap-2">
        {(['all', 'paid', 'pending', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === f ? 'bg-primary text-white' : 'bg-surface text-muted'
            }`}
          >
            {f === 'all' ? 'Toutes' : f === 'paid' ? 'Payées' : f === 'pending' ? 'En attente' : 'Annulées'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 font-medium">Client</th>
              <th className="p-3 font-medium">Dates</th>
              <th className="p-3 font-medium">Nuits</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Statut</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Documents</th>
              <th className="p-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center text-muted">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-muted">Aucune réservation</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-border hover:bg-surface">
                  <td className="p-3">
                    <div>{b.guest_name}</div>
                    <div className="text-muted text-xs">{b.guest_email}</div>
                  </td>
                  <td className="p-3">{b.check_in} → {b.check_out}</td>
                  <td className="p-3">{b.nights}</td>
                  <td className="p-3 font-medium">{Number(b.total_amount).toFixed(0)}€</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      b.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="p-3 text-muted">{b.source}</td>
                  <td className="p-3">
                    {docs[b.id] && docs[b.id].length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {docs[b.id].map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            RC
                          </a>
                        ))}
                      </div>
                    ) : b.payment_status === 'paid' ? (
                      <span className="text-xs text-amber-600">En attente</span>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(b.id, b.guest_name)}
                      disabled={deleting === b.id}
                      className="text-red-400 hover:text-red-600 transition disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GuestsTab({ token }: { token: string }) {
  const { data: guests, loading } = useFetch<Guest[]>('/api/admin/guests', token)

  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="p-3 font-medium">Nom</th>
            <th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Téléphone</th>
            <th className="p-3 font-medium">Séjours</th>
            <th className="p-3 font-medium">Nuits</th>
            <th className="p-3 font-medium">Dépensé</th>
            <th className="p-3 font-medium">Marketing</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="p-4 text-center text-muted">Chargement...</td></tr>
          ) : !guests || guests.length === 0 ? (
            <tr><td colSpan={7} className="p-4 text-center text-muted">Aucun client</td></tr>
          ) : (
            guests.map((g) => (
              <tr key={g.id} className="border-b border-border hover:bg-surface">
                <td className="p-3 font-medium">{g.first_name} {g.last_name}</td>
                <td className="p-3">
                  <a href={`mailto:${g.email}`} className="text-primary hover:underline flex items-center gap-1">
                    {g.email} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="p-3">
                  {g.phone ? (
                    <a href={`tel:${g.phone}`} className="text-primary hover:underline">{g.phone}</a>
                  ) : '-'}
                </td>
                <td className="p-3">{g.total_stays}</td>
                <td className="p-3">{g.total_nights}</td>
                <td className="p-3 font-medium">{Number(g.total_spent).toFixed(0)}€</td>
                <td className="p-3">
                  <span className={`w-3 h-3 rounded-full inline-block ${g.marketing_consent ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function PricingSettingsPanel({ token, settings }: { token: string; settings: PricingSettings | null }) {
  const defaultPriceRef = useRef<HTMLInputElement>(null)
  const minNightsRef = useRef<HTMLInputElement>(null)
  const lastMinutePercentRef = useRef<HTMLInputElement>(null)
  const lastMinuteDaysRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setError(null)
    setSaved(false)
    const default_price = Number(defaultPriceRef.current?.value)
    const min_nights = Number(minNightsRef.current?.value)
    const last_minute_discount_percent = Number(lastMinutePercentRef.current?.value)
    const last_minute_days = Number(lastMinuteDaysRef.current?.value)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ default_price, min_nights, last_minute_discount_percent, last_minute_days }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Échec de la sauvegarde')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      setError('Erreur de connexion')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-border">
      <h3 className="font-semibold mb-4">Réglages généraux</h3>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div>
          <label className="block text-xs text-muted mb-1">Prix par défaut (€/nuit)</label>
          <input
            key={settings ? `dp-${settings.default_price}` : 'dp-loading'}
            ref={defaultPriceRef}
            type="number"
            defaultValue={settings?.default_price ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Nuits minimum</label>
          <input
            key={settings ? `mn-${settings.min_nights}` : 'mn-loading'}
            ref={minNightsRef}
            type="number"
            defaultValue={settings?.min_nights ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <h4 className="text-sm font-semibold mt-5 mb-1">Réduction dernière minute</h4>
      <p className="text-xs text-muted mb-3">
        Appliquée automatiquement quand la date d&apos;arrivée est proche. Mets 0% pour désactiver.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div>
          <label className="block text-xs text-muted mb-1">Réduction (%)</label>
          <input
            key={settings ? `lmp-${settings.last_minute_discount_percent}` : 'lmp-loading'}
            ref={lastMinutePercentRef}
            type="number"
            defaultValue={settings?.last_minute_discount_percent ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Délai (jours avant arrivée)</label>
          <input
            key={settings ? `lmd-${settings.last_minute_days}` : 'lmd-loading'}
            ref={lastMinuteDaysRef}
            type="number"
            defaultValue={settings?.last_minute_days ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {saved && <p className="text-green-600 text-sm mt-2">Enregistré</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
      <p className="text-xs text-muted mt-2">
        Prix par défaut utilisé pour tout jour sans prix spécifique défini dans le calendrier ci-dessous.
      </p>
    </div>
  )
}

function PricingRangeFillPanel({ token, onFilled }: { token: string; onFilled: () => void }) {
  const [form, setForm] = useState({ date_from: '', date_to: '', price: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fill = async () => {
    if (!form.date_from || !form.date_to || !form.price) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/daily-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date_from: form.date_from, date_to: form.date_to, price: Number(form.price) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "Échec de l'application")
      } else {
        setForm({ date_from: '', date_to: '', price: '' })
        onFilled()
      }
    } catch {
      setError('Erreur de connexion')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-border">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Appliquer un prix à une période
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })}
          className="border border-border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })}
          className="border border-border rounded-lg px-3 py-2 text-sm" />
        <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="€/nuit" className="border border-border rounded-lg px-3 py-2 text-sm" />
        <button onClick={fill} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
          {saving ? 'Application...' : 'Appliquer'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}

function PricingCalendar({ token, dailyPrices, defaultPrice, onChanged }: {
  token: string
  dailyPrices: DailyPrice[]
  defaultPrice: number | undefined
  onChanged: () => void
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const pricesMap: Record<string, number> = {}
  for (const row of dailyPrices) pricesMap[row.date] = Number(row.price)

  const { year, month } = viewDate
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ day: number; dateStr: string } | null> = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, dateStr: toDateStr(year, month, day) })

  const goPrevMonth = () => setViewDate((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }))
  const goNextMonth = () => setViewDate((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }))

  const startEdit = (dateStr: string) => {
    setEditingDate(dateStr)
    setEditValue(String(pricesMap[dateStr] ?? defaultPrice ?? ''))
  }

  const saveEdit = async () => {
    if (!editingDate) return
    const price = Number(editValue)
    if (!Number.isFinite(price) || price <= 0) {
      setEditingDate(null)
      return
    }
    await fetch('/api/admin/daily-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date: editingDate, price }),
    })
    setEditingDate(null)
    onChanged()
  }

  const resetDay = async (dateStr: string) => {
    await fetch(`/api/admin/daily-prices?date=${dateStr}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onChanged()
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goPrevMonth} className="p-2 hover:bg-surface rounded-lg">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold">{MONTH_LABELS[month]} {year}</h3>
        <button onClick={goNextMonth} className="p-2 hover:bg-surface rounded-lg">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-xs text-muted text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />

          const isOverride = cell.dateStr in pricesMap
          const price = pricesMap[cell.dateStr] ?? defaultPrice
          const isEditing = editingDate === cell.dateStr

          return (
            <div
              key={cell.dateStr}
              className={`aspect-square border rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer transition ${
                isOverride ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface'
              }`}
              onClick={() => !isEditing && startEdit(cell.dateStr)}
            >
              <span className="text-muted">{cell.day}</span>
              {isEditing ? (
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingDate(null) }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 text-center border border-primary rounded text-xs"
                />
              ) : (
                <span className={`font-medium ${isOverride ? 'text-primary' : 'text-muted'}`}>{price ?? '-'}€</span>
              )}
              {isOverride && !isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); resetDay(cell.dateStr) }}
                  className="text-[10px] text-muted hover:text-red-600"
                >
                  réinitialiser
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PricingTab({ token }: { token: string }) {
  const { data: dailyPrices, refresh: refreshPrices } = useFetch<DailyPrice[]>('/api/admin/daily-prices', token)
  const { data: settings, refresh: refreshSettings } = useFetch<PricingSettings>('/api/admin/pricing-settings', token)

  const refreshAll = () => {
    refreshPrices()
    refreshSettings()
  }

  return (
    <div className="space-y-6">
      <PricingSettingsPanel token={token} settings={settings} />
      <PricingRangeFillPanel token={token} onFilled={refreshAll} />
      <PricingCalendar
        token={token}
        dailyPrices={dailyPrices ?? []}
        defaultPrice={settings?.default_price}
        onChanged={refreshAll}
      />
    </div>
  )
}

function formatRelative(iso: string, now: number): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `le ${new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`
}

function latestSync(sources: IcalSource[] | null): string | null {
  if (!Array.isArray(sources)) return null
  return sources.reduce<string | null>(
    (latest, s) => (s.last_sync && (!latest || s.last_sync > latest) ? s.last_sync : latest),
    null,
  )
}

function ResyncCalendarButton({ token, lastSync, onSynced }: {
  token: string
  lastSync: string | null
  onSynced: () => void
}) {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const resync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/sync-ical', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la synchronisation' })
      } else {
        setMessage({ type: 'success', text: 'Calendrier synchronisé ✓' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la synchronisation' })
    }
    setNow(Date.now())
    setSyncing(false)
    onSynced()
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-border flex flex-wrap items-center gap-3">
      <button
        onClick={resync}
        disabled={syncing}
        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2"
      >
        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {syncing ? 'Synchronisation...' : 'Resynchroniser le calendrier'}
      </button>
      <span className="text-sm text-muted">
        Dernière sync : {lastSync ? formatRelative(lastSync, now) : 'jamais'}
      </span>
      {message && (
        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </span>
      )}
    </div>
  )
}

function BlockedTab({ token }: { token: string }) {
  const { data: blocked, loading, refresh } = useFetch<BlockedDate[]>('/api/admin/blocked', token)
  const { data: sources, refresh: refreshSources } = useFetch<IcalSource[]>('/api/admin/ical-sources', token)
  const [form, setForm] = useState({ date_start: '', date_end: '', reason: '' })

  const addBlock = async () => {
    await fetch('/api/admin/blocked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    setForm({ date_start: '', date_end: '', reason: '' })
    refresh()
  }

  const deleteBlock = async (id: string) => {
    await fetch(`/api/admin/blocked?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  return (
    <div className="space-y-6">
      <ResyncCalendarButton
        token={token}
        lastSync={latestSync(sources)}
        onSynced={() => { refresh(); refreshSources() }}
      />

      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Bloquer des dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="date" value={form.date_start} onChange={(e) => setForm({ ...form, date_start: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.date_end} onChange={(e) => setForm({ ...form, date_end: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Raison" className="border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={addBlock} className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          Bloquer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 font-medium">Du</th>
              <th className="p-3 font-medium">Au</th>
              <th className="p-3 font-medium">Raison</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-muted">Chargement...</td></tr>
            ) : !blocked || blocked.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-muted">Aucune date bloquée</td></tr>
            ) : (
              blocked.map((b) => (
                <tr key={b.id} className="border-b border-border hover:bg-surface">
                  <td className="p-3">{b.date_start}</td>
                  <td className="p-3">{b.date_end}</td>
                  <td className="p-3 text-muted">{b.reason || '-'}</td>
                  <td className="p-3">
                    <button onClick={() => deleteBlock(b.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReviewsTab({ token }: { token: string }) {
  const { data: reviews, loading, refresh } = useFetch<Review[]>('/api/admin/reviews', token)
  const [form, setForm] = useState({
    reviewer_name: '', reviewer_location: '', rating: '5', comment: '', stay_date: '',
    source: 'direct' as Review['source'],
  })
  const [formError, setFormError] = useState<string | null>(null)

  const addReview = async () => {
    setFormError(null)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          rating: Number(form.rating),
          stay_date: form.stay_date || null,
          reviewer_location: form.reviewer_location || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setFormError(data?.error || `Échec de l'ajout (${res.status})`)
        return
      }
      setForm({ reviewer_name: '', reviewer_location: '', rating: '5', comment: '', stay_date: '', source: 'direct' })
      refresh()
    } catch {
      setFormError('Erreur de connexion. Veuillez réessayer.')
    }
  }

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    await fetch(`/api/admin/reviews?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_visible: !currentVisible }),
    })
    refresh()
  }

  const deleteReview = async (id: string) => {
    await fetch(`/api/admin/reviews?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un avis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <input value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
            placeholder="Nom" className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input value={form.reviewer_location} onChange={(e) => setForm({ ...form, reviewer_location: e.target.value })}
            placeholder="Ville" className="border border-border rounded-lg px-3 py-2 text-sm" />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })}
          placeholder="Commentaire" rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 resize-none" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input type="date" value={form.stay_date} onChange={(e) => setForm({ ...form, stay_date: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
          <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as Review['source'] })}
            className="border border-border rounded-lg px-3 py-2 text-sm">
            <option value="direct">Direct</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking</option>
            <option value="abritel">Abritel</option>
            <option value="google">Google</option>
          </select>
        </div>
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-3">
            {formError}
          </div>
        )}
        <button onClick={addReview} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          Ajouter
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted">Chargement...</p>
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-center text-muted">Aucun avis</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={`bg-white rounded-xl p-4 border border-border ${!r.is_visible ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-2">{r.comment}</p>
                  <p className="text-sm text-muted">
                    {r.reviewer_name} {r.reviewer_location ? `· ${r.reviewer_location}` : ''} · {r.source}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleVisibility(r.id, r.is_visible)} className="text-muted hover:text-foreground">
                    {r.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const PHOTO_CATEGORIES = [
  { value: 'hero', label: 'Hero (bannière)' },
  { value: 'salon', label: 'Salon' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'salle-de-bain', label: 'Salle de bain' },
  { value: 'loggia', label: 'Loggia' },
  { value: 'port', label: 'Port / Extérieur' },
]

function PhotosTab({ token }: { token: string }) {
  const { data: photos, loading, refresh } = useFetch<Photo[]>('/api/admin/photos', token)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('salon')

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', selectedCategory)
      formData.append('alt', selectedCategory)

      await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    }

    setUploading(false)
    refresh()
  }

  const deletePhoto = async (id: string) => {
    await fetch(`/api/admin/photos?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  const toggleFeatured = async (id: string) => {
    await fetch('/api/admin/photos', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    refresh()
  }

  const groupedPhotos: Record<string, Photo[]> = {}
  for (const photo of Array.isArray(photos) ? photos : []) {
    if (!groupedPhotos[photo.category]) groupedPhotos[photo.category] = []
    groupedPhotos[photo.category].push(photo)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Ajouter des photos
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm"
            >
              {PHOTO_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
              className="text-sm"
            />
          </div>
          {uploading && <span className="text-sm text-muted">Upload en cours...</span>}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : Object.keys(groupedPhotos).length === 0 ? (
        <p className="text-center text-muted">Aucune photo</p>
      ) : (
        PHOTO_CATEGORIES.map((cat) => {
          const catPhotos = groupedPhotos[cat.value]
          if (!catPhotos || catPhotos.length === 0) return null
          return (
            <div key={cat.value} className="bg-white rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-4">{cat.label} ({catPhotos.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {catPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.alt || photo.category}
                      className={`w-full aspect-[4/3] object-cover rounded-lg ${photo.is_featured ? 'ring-2 ring-amber-400' : ''}`}
                    />
                    {photo.is_featured && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded">Couverture</span>
                    )}
                    <button
                      onClick={() => toggleFeatured(photo.id)}
                      className={`absolute bottom-2 left-2 p-1.5 rounded-lg transition ${photo.is_featured ? 'bg-amber-400 text-amber-900' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'}`}
                      title="Définir comme photo de couverture"
                    >
                      <Star className={`w-3 h-3 ${photo.is_featured ? 'fill-amber-900' : ''}`} />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function RcTab({ token }: { token: string }) {
  const { data: bookings, loading, refresh } = useFetch<Booking[]>('/api/admin/bookings', token)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [extendForm, setExtendForm] = useState<{ id: string; deadline: string; notes: string } | null>(null)
  const [docs, setDocs] = useState<Record<string, BookingDocument[]>>({})

  const rcBookings = (bookings ?? []).filter((b) => b.payment_status === 'paid' || b.rc_status === 'cancelled_no_rc')

  useEffect(() => {
    if (!bookings) return
    const ids = bookings.filter((b) => b.payment_status === 'paid' || b.rc_status === 'received').map((b) => b.id)
    if (ids.length === 0) return
    Promise.all(
      ids.map((id) =>
        fetch(`/api/bookings/documents?booking_id=${encodeURIComponent(id)}`)
          .then((r) => r.json())
          .then((d: BookingDocument[]) => [id, Array.isArray(d) ? d : []] as const)
          .catch(() => [id, []] as const)
      )
    ).then((results) => {
      const map: Record<string, BookingDocument[]> = {}
      for (const [id, documents] of results) {
        if (documents.length > 0) map[id] = documents as BookingDocument[]
      }
      setDocs(map)
    })
  }, [bookings])

  const pending = rcBookings.filter((b) => b.rc_status === 'pending' || b.rc_status === 'extended')
  const received = rcBookings.filter((b) => b.rc_status === 'received')
  const cancelled = rcBookings.filter((b) => b.rc_status === 'cancelled_no_rc')

  const today = new Date().toISOString().split('T')[0]
  const expiredToday = pending.filter((b) => b.rc_deadline && b.rc_deadline <= today)

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 3000)
  }

  const doAction = async (id: string, action: string, extra?: Record<string, string>) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/rc?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        if (action === 'received') showFlash('RC marquée comme reçue')
        if (action === 'extend') showFlash(`Deadline prolongée`)
        if (action === 'cancel') showFlash('Réservation annulée — remboursement 80%')
        refresh()
      }
    } catch { /* ignore */ }
    setActionLoading(null)
    setExtendForm(null)
  }

  const rcStatusBadge = (status: string, deadline: string | null) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En attente</span>
      case 'received':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Reçue</span>
      case 'extended':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Prolongé → {deadline}
          </span>
        )
      case 'cancelled_no_rc':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Annulée (RC)</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {flash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm font-medium">
          {flash}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">En attente</span>
          </div>
          <p className="text-2xl font-bold">{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Reçues</span>
          </div>
          <p className="text-2xl font-bold">{received.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Expirées aujourd&apos;hui</span>
          </div>
          <p className="text-2xl font-bold">{expiredToday.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Suivi RC — Toutes les réservations payées
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 font-medium">Voyageur</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Arrivée</th>
                <th className="p-3 font-medium">Deadline RC</th>
                <th className="p-3 font-medium">Document</th>
                <th className="p-3 font-medium">Statut RC</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted">Chargement...</td></tr>
              ) : rcBookings.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-muted">Aucune réservation</td></tr>
              ) : (
                rcBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium">{b.guest_name}</td>
                    <td className="p-3">
                      <a href={`mailto:${b.guest_email}`} className="text-primary hover:underline text-xs">{b.guest_email}</a>
                    </td>
                    <td className="p-3">{b.check_in}</td>
                    <td className="p-3">
                      {b.rc_deadline ? (
                        <span className={b.rc_deadline <= today && b.rc_status === 'pending' ? 'text-red-600 font-semibold' : ''}>
                          {b.rc_deadline}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3">
                      {docs[b.id] && docs[b.id].length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {docs[b.id].map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:underline text-xs font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Voir le fichier
                            </a>
                          ))}
                        </div>
                      ) : b.rc_upload_token ? (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/rc/${b.rc_upload_token}`
                            navigator.clipboard.writeText(url)
                            showFlash('Lien d\'upload copié !')
                          }}
                          className="text-xs text-blue-600 hover:underline"
                          title="Copier le lien d'upload"
                        >
                          Copier le lien
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">{rcStatusBadge(b.rc_status, b.rc_deadline)}</td>
                    <td className="p-3">
                      {(b.rc_status === 'pending' || b.rc_status === 'extended') && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => doAction(b.id, 'received')}
                            disabled={actionLoading === b.id}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
                            title="Marquer RC reçue"
                          >
                            {actionLoading === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => setExtendForm({ id: b.id, deadline: b.rc_deadline ?? '', notes: '' })}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            title="Prolonger deadline"
                          >
                            <CalendarPlus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Annuler la réservation de ${b.guest_name} et retenir 20% (${(Number(b.total_amount) * 0.20).toFixed(0)}€) ?`)) {
                                doAction(b.id, 'cancel')
                              }
                            }}
                            disabled={actionLoading === b.id}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                            title="Annuler (retenir 20%)"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {b.rc_status === 'received' && (
                        <span className="text-green-600 text-xs">
                          {b.rc_received_at ? new Date(b.rc_received_at).toLocaleDateString('fr-FR') : ''}
                        </span>
                      )}
                      {b.rc_notes && (
                        <p className="text-xs text-muted mt-1">{b.rc_notes}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {extendForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-500" />
              Prolonger la deadline RC
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nouvelle deadline</label>
                <input
                  type="date"
                  value={extendForm.deadline}
                  onChange={(e) => setExtendForm({ ...extendForm, deadline: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Raison (optionnel)</label>
                <input
                  value={extendForm.notes}
                  onChange={(e) => setExtendForm({ ...extendForm, notes: e.target.value })}
                  placeholder="Ex: client en attente de son assureur"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => doAction(extendForm.id, 'extend', { new_deadline: extendForm.deadline, notes: extendForm.notes })}
                disabled={!extendForm.deadline || actionLoading === extendForm.id}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
              >
                Prolonger
              </button>
              <button
                onClick={() => setExtendForm(null)}
                className="flex-1 bg-surface py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PLATFORMS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'abritel', label: 'Abritel' },
  { value: 'leboncoin', label: 'Leboncoin' },
  { value: 'other', label: 'Autre' },
]

function SyncTab({ token }: { token: string }) {
  const { data: sources, loading, refresh } = useFetch<IcalSource[]>('/api/admin/ical-sources', token)
  const [form, setForm] = useState({ name: '', platform: 'airbnb', ical_url: '' })
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  const addSource = async () => {
    if (!form.ical_url || !form.platform) return
    setAdding(true)
    await fetch('/api/admin/ical-sources', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', platform: 'airbnb', ical_url: '' })
    setAdding(false)
    refresh()
  }

  const deleteSource = async (id: string) => {
    await fetch(`/api/admin/ical-sources?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  const syncSource = async (id: string) => {
    setSyncing(id)
    await fetch('/api/admin/ical-sources', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'sync' }),
    })
    setSyncing(null)
    refresh()
  }

  const toggleSource = async (id: string) => {
    await fetch('/api/admin/ical-sources', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    })
    refresh()
  }

  const icalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/ical`
    : '/api/calendar/ical'

  return (
    <div className="space-y-6">
      <ResyncCalendarButton token={token} lastSync={latestSync(sources)} onSynced={refresh} />

      {/* Export URL */}
      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-2">📤 URL d&apos;export (à coller dans Airbnb/Booking)</h3>
        <code className="block bg-surface p-3 rounded-lg text-sm break-all">{icalUrl}</code>
      </div>

      {/* Add source */}
      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un calendrier externe
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Mon Airbnb"
              className="border border-border rounded-lg px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plateforme</label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="border border-border rounded-lg px-3 py-2 text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1">URL iCal</label>
            <input
              type="url"
              value={form.ical_url}
              onChange={(e) => setForm({ ...form, ical_url: e.target.value })}
              placeholder="https://..."
              className="border border-border rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <button
            onClick={addSource}
            disabled={adding || !form.ical_url}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {adding ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Sources list */}
      {loading ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : !sources || sources.length === 0 ? (
        <p className="text-center text-muted">Aucun calendrier externe configuré</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Plateforme</th>
                <th className="p-3 text-left">Statut</th>
                <th className="p-3 text-left">Dernière synchro</th>
                <th className="p-3 text-left">Actif</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="p-3 font-medium">{s.name || '—'}</td>
                  <td className="p-3 capitalize">{s.platform}</td>
                  <td className="p-3">
                    {s.sync_status === 'ok' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> OK</span>}
                    {s.sync_status === 'error' && (
                      <span className="text-red-600 flex items-center gap-1" title={s.sync_error || ''}>
                        <XCircle className="w-4 h-4" /> Erreur
                      </span>
                    )}
                    {s.sync_status === 'pending' && <span className="text-muted flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>}
                  </td>
                  <td className="p-3 text-muted">
                    {s.last_sync
                      ? new Date(s.last_sync).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Jamais'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleSource(s.id)}
                      className={`text-xs px-2 py-1 rounded ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncSource(s.id)}
                        disabled={syncing === s.id}
                        className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1"
                      >
                        {syncing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                      </button>
                      <button
                        onClick={() => deleteSource(s.id)}
                        className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
