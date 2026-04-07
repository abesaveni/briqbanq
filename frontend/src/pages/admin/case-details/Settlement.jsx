// src/pages/admin/case-details/Settlement.jsx
import { useState } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { settlementService } from '../../../api/dataService'
import { CheckCircle2, Clock, AlertTriangle, Send, ShieldCheck, Building2, Loader2 } from 'lucide-react'

export default function Settlement() {
    const { caseData } = useCaseContext()
    const [finalising, setFinalising] = useState(false)
    const [finalised, setFinalised] = useState(false)
    const [finaliseError, setFinaliseError] = useState('')
    const [messages, setMessages] = useState([
        { id: 1, sender: 'System', role: 'Automated', time: 'Today', text: 'Settlement workflow initiated for this case.', isSystem: true },
    ])
    const [newMessage, setNewMessage] = useState('')

    const handleSend = () => {
        if (!newMessage.trim()) return
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'Admin',
            role: 'Administrator',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: newMessage,
            isAdmin: true,
        }])
        setNewMessage('')
    }

    const handleFinalise = async () => {
        if (!caseData?._id || finalising || finalised) return
        setFinalising(true)
        setFinaliseError('')
        try {
            const res = await settlementService.markReadyForSettlement(caseData._id)
            if (res.success) {
                setFinalised(true)
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'System',
                    role: 'Automated',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: 'Settlement has been marked as ready for finalisation.',
                    isSystem: true,
                }])
            } else {
                setFinaliseError(res.error || 'Failed to finalise settlement. Please try again.')
            }
        } catch {
            setFinaliseError('Failed to finalise settlement. Please try again.')
        }
        setFinalising(false)
    }

    const { settlement, property } = caseData

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Settlement</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{property.address || 'Property address'}</p>
                </div>
                <button
                    onClick={handleFinalise}
                    disabled={finalising || finalised}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        finalised ? 'bg-gray-400 cursor-default' : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-70`}
                >
                    {finalising ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {finalised ? 'Settlement Finalised' : finalising ? 'Finalising...' : 'Finalise Settlement'}
                </button>
            </div>

            {finaliseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                    {finaliseError}
                </div>
            )}

            {/* Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Overall Progress</h3>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{settlement.estimatedProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${settlement.estimatedProgress}%` }}
                    />
                </div>
                {settlement.estimatedProgress === 0 && (
                    <p className="text-xs text-gray-400 mt-2">Settlement checklist items will update progress</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Status cards */}
                {[
                    { label: 'Action Required', value: 'Title Transfer', sub: 'Pending document upload', color: 'red', icon: AlertTriangle },
                    { label: 'Pending Signature', value: 'Loan Deed', sub: 'ETA: 24 hours', color: 'amber', icon: Clock },
                    { label: 'Verified', value: 'Discharge Order', sub: 'Confirmed', color: 'green', icon: ShieldCheck },
                ].map((card, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                            card.color === 'red' ? 'bg-red-50' : card.color === 'amber' ? 'bg-amber-50' : 'bg-green-50'
                        }`}>
                            <card.icon className={`w-4 h-4 ${
                                card.color === 'red' ? 'text-red-500' : card.color === 'amber' ? 'text-amber-500' : 'text-green-500'
                            }`} />
                        </div>
                        <p className={`text-xs font-medium mb-1 ${
                            card.color === 'red' ? 'text-red-500' : card.color === 'amber' ? 'text-amber-500' : 'text-green-500'
                        }`}>{card.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Checklist */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Settlement Checklist</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Required items for settlement completion</p>
                    </div>
                    {settlement.checklist.length === 0 ? (
                        <div className="py-12 text-center">
                            <CheckCircle2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No checklist items yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Item</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Responsible</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {settlement.checklist.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    item.status === 'Approved' ? 'bg-green-500' : 'bg-amber-400'
                                                }`} />
                                                <span className="text-sm text-gray-900">{item.item}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.responsible}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                item.status === 'Approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>{item.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>

                {/* Settlement Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Milestones</h3>
                    {settlement.timeline.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No milestones defined</p>
                    ) : (
                        <div className="space-y-3">
                            {settlement.timeline.map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                                        step.status === 'in-progress' ? 'bg-indigo-100 text-indigo-600' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {step.status === 'completed' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <Clock className={`w-4 h-4 ${step.status === 'in-progress' ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${step.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {step.step}
                                        </p>
                                        {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                                        step.status === 'in-progress' ? 'bg-indigo-100 text-indigo-600' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>{step.status}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Settlement comms */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Settlement Notes</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {messages.map(msg => (
                                <div key={msg.id} className={`text-sm px-3 py-2 rounded-lg ${
                                    msg.isSystem ? 'bg-gray-50 text-gray-500 text-center text-xs' :
                                    msg.isAdmin ? 'bg-indigo-50 text-indigo-800' :
                                    'bg-gray-50 text-gray-700'
                                }`}>
                                    {!msg.isSystem && <span className="font-medium">{msg.sender}: </span>}
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <input
                                type="text"
                                placeholder="Add a settlement note..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                            />
                            <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
