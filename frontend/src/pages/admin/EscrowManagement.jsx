import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminBadge from '../../components/admin/AdminBadge'
import { useState, useEffect } from 'react'
import { escrowService } from '../../api/dataService'
import { Loader2 } from 'lucide-react'

export default function EscrowManagement() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [releasingId, setReleasingId] = useState(null)
    const [releasingAll, setReleasingAll] = useState(false)

    useEffect(() => {
        escrowService.getEscrowTransactions()
            .then((res) => setTransactions(res.data || res || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const formatCurrency = (amount) => {
        if (!amount) return 'A$0'
        return `A$${Number(amount).toLocaleString()}`
    }

    const isPending = (t) => !t.released && t.status !== 'Completed' && t.status !== 'completed'

    const handleRelease = async (transaction) => {
        setReleasingId(transaction.id)
        try {
            const res = await escrowService.releaseFunds(transaction.id)
            if (res.success || res.status !== false) {
                setTransactions(prev => prev.map(t =>
                    t.id === transaction.id ? { ...t, released: true, status: 'Completed' } : t
                ))
            }
        } catch { /* ignore */ } finally {
            setReleasingId(null)
        }
    }

    const handleReleaseAll = async () => {
        const pending = transactions.filter(isPending)
        if (!pending.length) return
        setReleasingAll(true)
        try {
            await Promise.allSettled(pending.map(t => escrowService.releaseFunds(t.id)))
            setTransactions(prev => prev.map(t => isPending(t) ? { ...t, released: true, status: 'Completed' } : t))
        } catch { /* ignore */ } finally {
            setReleasingAll(false)
        }
    }

    const totalHeld = transactions.filter(isPending).reduce((s, t) => s + (t.amount || 0), 0)
    const totalReleased = transactions.filter(t => !isPending(t)).reduce((s, t) => s + (t.amount || 0), 0)
    const pendingTransactions = transactions.filter(isPending)

    return (
        <div className="space-y-6">
            <AdminBreadcrumb items={[
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Escrow Management' }
            ]} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Escrow Release</h1>
                <p className="text-sm text-gray-500 mt-1">Platform administration and compliance management</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <AdminStatCard label="Total Held" value={formatCurrency(totalHeld)} icon="📋" iconBg="bg-blue-100" iconColor="text-blue-600" />
                <AdminStatCard label="Total Released" value={formatCurrency(totalReleased)} icon="📈" iconBg="bg-green-100" iconColor="text-green-600" />
                <AdminStatCard label="Pending Releases" value={pendingTransactions.length} icon="$" iconBg="bg-purple-100" iconColor="text-purple-600" />
            </div>

            {pendingTransactions.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600">⚠</span>
                        <div>
                            <p className="text-sm font-medium text-yellow-800">Pending Releases</p>
                            <p className="text-sm text-yellow-700">
                                {pendingTransactions.length} transaction{pendingTransactions.length !== 1 ? 's' : ''} awaiting release ({formatCurrency(totalHeld)})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleReleaseAll}
                        disabled={releasingAll}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded flex items-center gap-2 disabled:opacity-70"
                    >
                        {releasingAll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {releasingAll ? 'Releasing...' : 'Release All'}
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Transaction History <span className="text-gray-500 font-normal">— {transactions.length} total transactions</span>
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Date</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Type</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Recipient</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Amount</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No transactions found</td></tr>
                            ) : transactions.map((transaction, index) => (
                                <tr key={transaction.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.date || (transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('en-AU') : '—')}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.type || transaction.transaction_type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.recipient || transaction.recipient_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(transaction.amount)}</td>
                                    <td className="px-4 py-3">
                                        <AdminBadge
                                            label={transaction.status}
                                            variant={!isPending(transaction) ? 'completed' : 'pending'}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {!isPending(transaction) ? (
                                            <span className="text-sm text-green-600 font-medium">✓ Released</span>
                                        ) : (
                                            <button
                                                onClick={() => handleRelease(transaction)}
                                                disabled={releasingId === transaction.id}
                                                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded flex items-center gap-1.5 disabled:opacity-70"
                                            >
                                                {releasingId === transaction.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                                {releasingId === transaction.id ? 'Releasing...' : 'Release'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Escrow Details</h3>
                    <div className="space-y-3">
                        <div><p className="text-sm text-gray-500">Escrow Agent</p><p className="text-sm text-gray-900 font-medium">Australian Settlement Services</p></div>
                        <div><p className="text-sm text-gray-500">License</p><p className="text-sm text-gray-900 font-medium">ESA-2024-5678</p></div>
                        <div>
                            <p className="text-sm text-gray-500">Settlement Date</p>
                            <p className="text-sm text-gray-900 font-medium">28 February 2026</p>
                            <p className="text-xs text-gray-500">15 days remaining</p>
                        </div>
                        <div><p className="text-sm text-gray-500">Account Number</p><p className="text-sm text-gray-900 font-medium">ESC-2024-1234</p></div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Compliance</h3>
                    <div className="space-y-3">
                        {[
                            { title: 'Secure Escrow', sub: 'Funds held in trust account' },
                            { title: 'Two-Factor Authentication', sub: 'All releases require 2FA' },
                            { title: 'Audit Trail', sub: 'All transactions logged' },
                            { title: 'Insured', sub: 'Professional indemnity insurance' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-indigo-600 mt-0.5">✓</span>
                                <div>
                                    <p className="text-sm text-gray-900 font-medium">{item.title}</p>
                                    <p className="text-xs text-gray-500">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
