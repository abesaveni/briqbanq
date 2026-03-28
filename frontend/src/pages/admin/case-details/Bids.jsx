// src/pages/admin/case-details/Bids.jsx
import { useState, useEffect } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { Search, Users, Gavel, Target, Trophy, Download } from 'lucide-react'
import CaseBidPanel from '../../../components/common/CaseBidPanel'
import { useAuth } from '../../../context/AuthContext'

export default function Bids() {
    const { caseData } = useCaseContext()
    const { user } = useAuth()
    const [search, setSearch] = useState('')

    const fmt = (amount) => new Intl.NumberFormat('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0
    }).format(amount || 0)

    // CaseBidPanel handles all bid fetching; use caseData.bids for stat cards only
    const bids = caseData.bids || []
    const uniqueBidders = new Set(bids.map(b => b.bidder)).size
    const highestBid = bids.length > 0 ? bids[0].amount : 0

    const filtered = bids.filter(b =>
        !search || (b.bidder || '').toLowerCase().includes(search.toLowerCase())
    )

    const statCards = [
        { label: 'Total Bids', value: bids.length, icon: Gavel, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Unique Bidders', value: uniqueBidders, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Highest Bid', value: highestBid > 0 ? fmt(highestBid) : '—', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Reserve Price', value: fmt(caseData.financial?.minimumBid), icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    ]

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">{card.label}</p>
                                <p className="text-base font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Bid Panel — real-time fetch, place bid, accept bid */}
            <CaseBidPanel
                caseId={caseData._id || caseData.id}
                canBid={true}
                canClose={true}
                currentUser={{ name: user?.name, role: 'Admin' }}
            />
        </div>
    )
}
