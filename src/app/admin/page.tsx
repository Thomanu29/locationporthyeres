'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import type { Booking, PricingRule, BlockedDate, Review, Guest, Photo } from '@/lib/types'
import MessagesTab from '@/components/admin/MessagesTab'

type Tab = 'dashboard' | 'bookings' | 'guests' | 'pricing' | 'blocked' | 'reviews' | 'photos' | 'messages'

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
  const { data: bookings, loading } = useFetch<Booking[]>('/api/admin/bookings', token)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all')

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted">Aucune réservation</td></tr>
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

function PricingTab({ token }: { token: string }) {
  const { data: rules, loading, refresh } = useFetch<PricingRule[]>('/api/admin/pricing', token)
  const [form, setForm] = useState({ label: '', date_from: '', date_to: '', price_per_night: '', min_nights: '2' })

  const addRule = async () => {
    await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        price_per_night: Number(form.price_per_night),
        min_nights: Number(form.min_nights),
      }),
    })
    setForm({ label: '', date_from: '', date_to: '', price_per_night: '', min_nights: '2' })
    refresh()
  }

  const deleteRule = async (id: string) => {
    await fetch(`/api/admin/pricing?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter une période
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Label" className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })}
            className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="number" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
            placeholder="€/nuit" className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="number" value={form.min_nights} onChange={(e) => setForm({ ...form, min_nights: e.target.value })}
            placeholder="Min nuits" className="border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={addRule} className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 font-medium">Label</th>
              <th className="p-3 font-medium">Du</th>
              <th className="p-3 font-medium">Au</th>
              <th className="p-3 font-medium">€/nuit</th>
              <th className="p-3 font-medium">Min nuits</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted">Chargement...</td></tr>
            ) : (
              rules?.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-surface">
                  <td className="p-3">{r.label}</td>
                  <td className="p-3">{r.date_from}</td>
                  <td className="p-3">{r.date_to}</td>
                  <td className="p-3 font-medium">{r.price_per_night}€</td>
                  <td className="p-3">{r.min_nights}</td>
                  <td className="p-3">
                    <button onClick={() => deleteRule(r.id)} className="text-red-500 hover:text-red-700">
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

function BlockedTab({ token }: { token: string }) {
  const { data: blocked, loading, refresh } = useFetch<BlockedDate[]>('/api/admin/blocked', token)
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

  const addReview = async () => {
    await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        rating: Number(form.rating),
        stay_date: form.stay_date || null,
        reviewer_location: form.reviewer_location || null,
      }),
    })
    setForm({ reviewer_name: '', reviewer_location: '', rating: '5', comment: '', stay_date: '', source: 'direct' })
    refresh()
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
  { value: 'terrasse', label: 'Terrasse' },
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
                      className="w-full aspect-[4/3] object-cover rounded-lg"
                    />
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
