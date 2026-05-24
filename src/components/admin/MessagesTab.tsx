'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, X, CheckCircle, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  created_at: string
  conversation_id: string
  sender: 'guest' | 'owner'
  content: string
}

interface Conversation {
  id: string
  created_at: string
  guest_name: string
  guest_email: string
  subject: string | null
  status: 'open' | 'closed'
  last_message_at: string
  last_message_preview: string
  last_message_sender: string | null
  unread_count: number
}

export default function MessagesTab({ token }: { token: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/admin/conversations', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
    }
    setLoading(false)
  }, [token])

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/conversations/messages?conversation_id=${conversationId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedId) return
    loadMessages(selectedId)
    const interval = setInterval(() => loadMessages(selectedId), 10000)
    return () => clearInterval(interval)
  }, [selectedId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !selectedId) return
    setSending(true)

    await fetch('/api/conversations/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversation_id: selectedId, sender: 'owner', content: reply }),
    })

    setReply('')
    await loadMessages(selectedId)
    await loadConversations()
    setSending(false)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    await fetch('/api/admin/conversations', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id, status: newStatus }),
    })
    await loadConversations()
  }

  const filtered = conversations.filter((c) => filter === 'all' || c.status === filter)
  const selected = conversations.find((c) => c.id === selectedId)

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 86400000) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="bg-white rounded-xl border border-border flex flex-col md:flex-row" style={{ minHeight: '600px' }}>
      <div className={`md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-border flex gap-1">
          {(['all', 'open', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                filter === f ? 'bg-primary text-white' : 'bg-surface text-muted'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : 'Clos'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-center text-muted text-sm">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-center text-muted text-sm">Aucune conversation</p>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-3 border-b border-border hover:bg-surface transition ${
                  selectedId === conv.id ? 'bg-surface' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{conv.guest_name}</span>
                  <span className="text-xs text-muted shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                </div>
                {conv.subject && (
                  <p className="text-xs font-medium text-foreground truncate">{conv.subject}</p>
                )}
                <p className="text-xs text-muted truncate">{conv.last_message_preview}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    conv.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {conv.status === 'open' ? 'Ouvert' : 'Clos'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-muted">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden text-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <p className="font-semibold text-sm">{selected?.guest_name}</p>
                  <p className="text-xs text-muted">{selected?.guest_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected && (
                  <button
                    onClick={() => toggleStatus(selected.id, selected.status)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selected.status === 'open'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selected.status === 'open' ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Fermer</>
                    ) : (
                      <><RotateCcw className="w-3.5 h-3.5" /> Rouvrir</>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      msg.sender === 'owner'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-surface text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'owner' ? 'text-white/60' : 'text-muted'}`}>
                      {new Date(msg.created_at).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selected?.status === 'open' && (
              <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Votre réponse..."
                  className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          </>
        )}
      </div>
    </div>
  )
}
