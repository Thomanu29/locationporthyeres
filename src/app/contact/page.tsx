'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  created_at: string
  conversation_id: string
  sender: 'guest' | 'owner'
  content: string
}

interface Conversation {
  id: string
  guest_name: string
  guest_email: string
  subject: string | null
  status: string
  messages: Message[]
}

export default function ContactPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ guest_name: '', guest_email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations?id=${id}`)
    if (res.ok) {
      const data = await res.json()
      setConversation(data)
    } else {
      localStorage.removeItem('conversation_id')
      setConversation(null)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlId = params.get('conversation')
    const savedId = urlId || localStorage.getItem('conversation_id')
    if (savedId) {
      if (urlId) localStorage.setItem('conversation_id', urlId)
      loadConversation(savedId).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [loadConversation])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  useEffect(() => {
    if (!conversation) return
    const interval = setInterval(() => {
      loadConversation(conversation.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [conversation, loadConversation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('conversation_id', data.id)
      setConversation(data)
    }
    setSending(false)
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !conversation) return
    setSending(true)

    await fetch('/api/conversations/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversation.id, sender: 'guest', content: reply }),
    })

    setReply('')
    await loadConversation(conversation.id)
    setSending(false)
  }

  const startNewConversation = () => {
    localStorage.removeItem('conversation_id')
    setConversation(null)
    setFormData({ guest_name: '', guest_email: '', subject: '', message: '' })
  }

  if (loading) {
    return (
      <>
        <Header variant="solid" />
        <main className="min-h-screen bg-surface flex items-center justify-center">
          <p className="text-muted">Chargement...</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-surface">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Nous contacter</h1>
          </div>

          {!conversation ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-border space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sujet</label>
                <input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-border flex flex-col" style={{ minHeight: '500px' }}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold">{conversation.subject || 'Conversation'}</p>
                  <p className="text-sm text-muted">{conversation.guest_name}</p>
                </div>
                <button
                  onClick={startNewConversation}
                  className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Nouvelle conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.messages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                        msg.sender === 'guest'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-surface text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'guest' ? 'text-white/60' : 'text-muted'}`}>
                        {new Date(msg.created_at).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {conversation.status === 'open' && (
                <form onSubmit={handleReply} className="p-4 border-t border-border flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Votre message..."
                    className="flex-1 border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
