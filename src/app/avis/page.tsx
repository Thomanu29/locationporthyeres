'use client'

import { useState, useCallback } from 'react'
import { Star, CheckCircle, Loader2, MessageSquareHeart } from 'lucide-react'

export default function ReviewPublicSubmitPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !comment.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: name,
          reviewer_location: location,
          rating,
          comment,
          website,
        }),
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
  }, [name, location, rating, comment, website])

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Merci pour votre avis !</h1>
          <p className="text-muted">Votre avis a bien été enregistré et est déjà publié sur le site.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-center text-white">
          <MessageSquareHeart className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Laisser un avis</h1>
          <p className="text-blue-100 text-sm mt-1">Appartement du Port · Hyères</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Votre nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Marie D."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Honeypot field, hidden from real visitors */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

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
            disabled={!name.trim() || !comment.trim() || submitting}
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
