/**
 * CaseActivityLog — shared activity/audit-trail component used by all roles.
 * Props:
 *   caseId {string} — the case UUID
 */
import { useState, useEffect } from 'react'
import { Activity, DollarSign, FileText, MessageSquare, RefreshCw, CheckCircle2, Loader2, Download } from 'lucide-react'
import api from '../../services/api'

function getIcon(eventType = '', title = '') {
    const t = (eventType + title).toLowerCase()
    if (t.includes('bid')) return DollarSign
    if (t.includes('document') || t.includes('valuation') || t.includes('upload')) return FileText
    if (t.includes('message')) return MessageSquare
    if (t.includes('status') || t.includes('update')) return RefreshCw
    return CheckCircle2
}

const EVENT_COLORS = {
    bid:      'bg-emerald-100 text-emerald-600',
    document: 'bg-blue-100 text-blue-600',
    message:  'bg-purple-100 text-purple-600',
    status:   'bg-amber-100 text-amber-600',
    general:  'bg-indigo-100 text-indigo-600',
}

function fmtTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-AU', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function CaseActivityLog({ caseId }) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchActivity = async () => {
        if (!caseId) return
        setLoading(true)
        try {
            const res = await api.get(`/api/v1/cases/${caseId}/activity`)
            setEvents(Array.isArray(res.data) ? res.data : [])
        } catch {
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivity()
    }, [caseId])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Full audit trail of all case events</p>
                </div>
                <button
                    onClick={fetchActivity}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="py-16 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="py-16 text-center">
                        <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-400">No activity recorded yet</p>
                        <p className="text-xs text-gray-300 mt-1">Events will appear here as the case progresses</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {events.map((item, index) => {
                            const Icon = getIcon(item.event_type, item.title)
                            const colorClass = EVENT_COLORS[item.event_type] || EVENT_COLORS.general
                            return (
                                <div key={item.id || index} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                                {item.actor_name && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        by <span className="font-medium text-gray-600">{item.actor_name}</span>
                                                        {item.actor_role && <span className="ml-1 text-gray-400">({item.actor_role})</span>}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                {fmtTime(item.created_at)}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
