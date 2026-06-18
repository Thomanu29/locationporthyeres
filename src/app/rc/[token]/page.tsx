'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Upload, CheckCircle, AlertTriangle, Loader2, FileText } from 'lucide-react'

interface BookingInfo {
  id: string
  guest_name: string
  guest_email: string
  check_in: string
  check_out: string
  rc_status: string
  rc_deadline: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RcUploadPage() {
  const params = useParams()
  const token = params.token as string

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    fetch(`/api/rc/upload?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error('invalid')
        return r.json()
      })
      .then((data) => { setBooking(data); setLoading(false) })
      .catch(() => { setError('Ce lien est invalide ou a expiré.'); setLoading(false) })
  }, [token])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('token', token)

    try {
      const res = await fetch('/api/rc/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    }
    setUploading(false)
  }, [selectedFile, token])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!booking) return null

  if (booking.rc_status === 'received' || success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Attestation reçue !</h1>
          <p className="text-gray-600 mb-4">
            Merci {booking.guest_name.split(' ')[0]}, votre attestation de responsabilité civile a bien été enregistrée.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium">Séjour du {formatDate(booking.check_in)} au {formatDate(booking.check_out)}</p>
            <p className="mt-1">Votre dossier est complet. À bientôt à Hyères !</p>
          </div>
        </div>
      </div>
    )
  }

  if (booking.rc_status === 'cancelled_no_rc') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Réservation annulée</h1>
          <p className="text-gray-600">Cette réservation a été annulée car l&apos;attestation RC n&apos;a pas été fournie dans les délais.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-center text-white">
          <Shield className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Attestation RC</h1>
          <p className="text-blue-100 text-sm mt-1">Appartement du Port · Hyères</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-medium text-blue-900">Bonjour {booking.guest_name.split(' ')[0]},</p>
            <p className="text-sm text-blue-800 mt-1">
              Séjour du <strong>{formatDate(booking.check_in)}</strong> au <strong>{formatDate(booking.check_out)}</strong>
            </p>
            {booking.rc_deadline && (
              <p className="text-sm text-blue-800 mt-1">
                Date limite : <strong className="text-red-600">{formatDate(booking.rc_deadline)}</strong>
              </p>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Déposez votre attestation</h2>
            <p className="text-sm text-gray-600 mb-3">
              Votre attestation d&apos;assurance responsabilité civile villégiature. Elle est très probablement incluse dans votre assurance habitation.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => document.getElementById('rc-file-input')?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-green-600">({(selectedFile.size / 1024 / 1024).toFixed(1)} Mo)</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Glissez votre fichier ici ou <span className="text-blue-600 font-medium">cliquez pour choisir</span></p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP · 5 Mo max</p>
                </>
              )}
              <input
                id="rc-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setSelectedFile(file)
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Envoyer mon attestation
              </>
            )}
          </button>

          <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Comment obtenir ce document ?</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>Connectez-vous à l&apos;espace client de votre assureur</li>
              <li>Ou appelez votre assurance habitation</li>
              <li>Demandez une « attestation de responsabilité civile villégiature »</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400 text-center">
            En cas de difficulté, contactez-nous à <a href="mailto:locationporthyeres@gmail.com" className="text-blue-600 hover:underline">locationporthyeres@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
