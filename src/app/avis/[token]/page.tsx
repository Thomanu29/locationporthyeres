'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle, AlertTriangle, Loader2, MessageSquareHeart } from 'lucide-react'

interface BookingInfo {
  guest_name: string
  check_in: string
  check_out: string
  already_submitted: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ReviewSubmitPage() {
  const params = useParams()
  const token = params.token as string

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    fetch(`/api/reviews?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error('invalid')
        return r.json()
      })
      .then((data) => { setBooking(data); setLoading(false) })
      .catch(() => { setError('Ce lien est invalide ou a expiré.'); setLoading(false) })
  }, [token])

  const handleSubmit = useCallback(async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment, reviewer_location: location }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi")
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    }
    setSubmitting(false)
  }, [comment, rating, location, token])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!booking) return null

  if (booking.already_submitted || success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Merci pour votre avis !</h1>
          <p className="text-muted">
            {success
              ? 'Votre avis a bien été enregistré et sera publié après vérification.'
              : 'Vous avez déjà partagé votre avis pour ce séjour. Merci !'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-center text-white">
          <MessageSquareHeart className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Votre avis compte</h1>
          <p className="text-blue-100 text-sm mt-1">Appartement du Port · Hyères</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-surface rounded-lg p-4">
            <p className="font-medium">Bonjour {booking.guest_name.split(' ')[0]},</p>
            <p className="text-sm text-muted mt-1">
              Séjour du <strong>{formatDate(booking.check_in)}</strong> au <strong>{formatDate(booking.check_out)}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Votre note</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 ${n <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Votre ville (optionnel)</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex : Lyon"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Votre commentaire</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racontez-nous votre séjour..."
              rows={4}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || submitting}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer mon avis'
            )}
          </button>

          <p className="text-xs text-muted text-center">
            En cas de difficulté, contactez-nous à <a href="mailto:locationporthyeres@gmail.com" className="text-primary hover:underline">locationporthyeres@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
