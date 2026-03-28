/**
 * CaseChat — shared chat component used by all roles on any case detail page.
 * Props:
 *   caseId   {string}  — the case UUID
 *   currentUser {object} — { name, role } of the logged-in user
 */
import { useState, useEffect, useRef } from 'react'
import { Send, ShieldCheck, Loader2, RefreshCw } from 'lucide-react'
import api from '../../services/api'

const ROLE_COLORS = {
    Admin:    'bg-indigo-600',
    Lender:   'bg-blue-600',
    Investor: 'bg-emerald-600',
    Lawyer:   'bg-amber-600',
    Borrower: 'bg-rose-500',
}

function roleColor(role = '') {
    const key = Object.keys(ROLE_COLORS).find(k => role.toLowerCase().includes(k.toLowerCase()))
    return key ? ROLE_COLORS[key] : 'bg-gray-500'
}

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

function fmtTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CaseChat({ caseId, currentUser = {} }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const scrollRef = useRef(null)

    const fetchMessages = async () => {
        if (!caseId) return
        try {
            const res = await api.get(`/api/v1/cases/${caseId}/messages`)
            setMessages(Array.isArray(res.data) ? res.data : [])
            setError(null)
        } catch {
            setError('Could not load messages')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()
    }, [caseId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || sending) return
        setSending(true)

        // Optimistic update
        const optimistic = {
            id: `opt-${Date.now()}`,
            sender_name: currentUser.name || 'You',
            sender_role: currentUser.role || 'User',
            message: text,
            created_at: new Date().toISOString(),
            _pending: true,
        }
        setMessages(prev => [...prev, optimistic])
        setInput('')

        try {
            const res = await api.post(`/api/v1/cases/${caseId}/messages`, { message: text })
            setMessages(prev =>
                prev.map(m => m.id === optimistic.id ? res.data : m)
            )
        } catch {
            // Remove optimistic on failure and restore input
            setMessages(prev => prev.filter(m => m.id !== optimistic.id))
            setInput(text)
        } finally {
            setSending(false)
        }
    }

    const myRole = (currentUser.role || '').toLowerCase()

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Case Messages</h2>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        Visible to all case participants
                    </p>
                </div>
                <button
                    onClick={fetchMessages}
                    className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 bg-white rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Chat window */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col" style={{ height: '520px' }}>
                {/* Message area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <p className="text-sm">{error}</p>
                            <button onClick={fetchMessages} className="text-xs text-indigo-600 hover:underline">Retry</button>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Send className="w-10 h-10 text-gray-200" />
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs text-gray-300">Send the first message below</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center">
                                <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                                    Case conversation
                                </span>
                            </div>
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_name === (currentUser.name || '') ||
                                    (msg.sender_role || '').toLowerCase() === myRole
                                const color = roleColor(msg.sender_role)
                                return (
                                    <div key={msg.id || i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${color}`}>
                                            {initials(msg.sender_name)}
                                        </div>
                                        <div className={`max-w-[72%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${color}`}>
                                                    {msg.sender_role}
                                                </span>
                                                {msg._pending && <span className="text-[10px] text-gray-400 italic">sending…</span>}
                                            </div>
                                            <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                                                isMe
                                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                                            }`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-xs text-gray-400">{fmtTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Type a message... (Enter to send)"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={sending}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
