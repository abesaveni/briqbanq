// src/pages/admin/case-details/Overview.jsx
import { useCaseContext } from '../../../context/CaseContext'
import { Calendar, TrendingUp, Clock, BarChart4, DollarSign, Home, Percent } from 'lucide-react'

export default function Overview() {
    const { caseData } = useCaseContext()

    if (!caseData) return null

    const fmt = (amount) => new Intl.NumberFormat('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0
    }).format(amount || 0)

    const fmtDate = (d, time = false) => {
        if (!d) return '—'
        return new Date(d).toLocaleString('en-AU', {
            day: '2-digit', month: 'short', year: 'numeric',
            ...(time ? { hour: '2-digit', minute: '2-digit', hour12: false } : {})
        })
    }

    const financial = caseData.financial ?? {}
    const valuation = caseData.valuation ?? {}
    const loan = caseData.loan ?? {}

    const statCards = [
        { label: 'Highest Bid', value: financial.currentHighestBid ? fmt(financial.currentHighestBid) : '—', sub: 'Current leading bid', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Equity Available', value: fmt(financial.equityAvailable), sub: 'Post-liability residual', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Property Value', value: fmt(valuation.amount), sub: 'Independent valuation', icon: Home, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'LVR', value: loan.ltv > 0 ? `${loan.ltv}%` : '—', sub: 'Loan to value ratio', icon: Percent, color: 'text-amber-600', bg: 'bg-amber-50' },
    ]

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Capital Stack */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Capital Stack</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Property Valuation', value: fmt(valuation.amount), highlight: false },
                            { label: 'Outstanding Debt', value: fmt(loan.outstandingDebt), highlight: true },
                            { label: 'Equity Available', value: fmt(financial.equityAvailable), accent: true },
                            { label: 'Minimum Bid', value: fmt(financial.minimumBid), highlight: false },
                            { label: 'Interest Rate', value: loan.interestRate > 0 ? `${loan.interestRate}% p.a.` : '—', highlight: false },
                        ].map((row, i) => (
                            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                                row.highlight ? 'bg-red-50 border border-red-100' :
                                row.accent ? 'bg-green-50 border border-green-100' :
                                'bg-gray-50'
                            }`}>
                                <span className="text-sm text-gray-500">{row.label}</span>
                                <span className={`text-sm font-semibold ${
                                    row.highlight ? 'text-red-700' :
                                    row.accent ? 'text-green-700' :
                                    'text-gray-900'
                                }`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Case Timeline</h3>
                    <div className="space-y-4">
                        {[
                            { icon: Calendar, label: 'Case Created', value: fmtDate(caseData.timeline.caseCreated) },
                            { icon: Clock, label: 'Last Updated', value: fmtDate(caseData.timeline.lastUpdated, true) },
                            { icon: BarChart4, label: 'Total Bids', value: `${caseData.bids.length} bid${caseData.bids.length !== 1 ? 's' : ''}` },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">{item.label}</p>
                                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs text-gray-400">Case Status</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {({'DRAFT':'Draft','SUBMITTED':'Submitted','UNDER_REVIEW':'Under Review','APPROVED':'Approved','LISTED':'Listed','AUCTION':'In Auction','FUNDED':'Funded','CLOSED':'Closed','REJECTED':'Rejected'})[caseData.status] || caseData.status}
                        </span>
                        {caseData.auctionStatus && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 ml-1">
                                {({'LIVE':'Auction Live','SCHEDULED':'Auction Scheduled','PAUSED':'Auction Paused','ENDED':'Auction Ended'})[caseData.auctionStatus] || caseData.auctionStatus}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {caseData.activity.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {caseData.activity.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                                    <p className="text-xs text-gray-300 mt-0.5">{item.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty activity state */}
            {caseData.activity.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <p className="text-sm text-gray-400 text-center py-6">No activity recorded yet</p>
                </div>
            )}
        </div>
    )
}
