'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react'

interface DocumentUploadProps {
  bookingId: string
}

interface BookingDocument {
  id: string
  booking_id: string
  document_type: string
  file_url: string
  uploaded_at: string
}

export default function DocumentUpload({ bookingId }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')
  const [document, setDocument] = useState<BookingDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check localStorage for previous upload
    const stored = localStorage.getItem(`doc_upload_${bookingId}`)
    if (stored) {
      setUploaded(true)
      setDocument(JSON.parse(stored))
      return
    }

    // Also check the server
    fetch(`/api/bookings/documents?booking_id=${encodeURIComponent(bookingId)}`)
      .then((r) => r.json())
      .then((docs: BookingDocument[]) => {
        if (Array.isArray(docs) && docs.length > 0) {
          setUploaded(true)
          setDocument(docs[0])
          localStorage.setItem(`doc_upload_${bookingId}`, JSON.stringify(docs[0]))
        }
      })
      .catch(() => {})
  }, [bookingId])

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    // Client-side validations
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Format non accepté. Utilisez PDF, JPG ou PNG.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo.')
      return
    }

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('booking_id', bookingId)

      const res = await fetch('/api/bookings/documents', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Erreur lors de l\'envoi')
      }

      const doc: BookingDocument = await res.json()
      setDocument(doc)
      setUploaded(true)
      localStorage.setItem(`doc_upload_${bookingId}`, JSON.stringify(doc))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6 mb-8 text-left">
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Justificatif obligatoire
      </h3>

      {uploaded && document ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-800">Document envoyé avec succès</p>
            <p className="text-sm text-green-700 mt-1">
              Votre attestation de responsabilité civile a bien été reçue.
            </p>
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Voir le document
            </a>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">
            Merci de télécharger une copie de votre attestation de responsabilité civile.
            Formats acceptés : PDF, JPG, PNG (5 Mo max).
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
                className="block w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer file:transition disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
