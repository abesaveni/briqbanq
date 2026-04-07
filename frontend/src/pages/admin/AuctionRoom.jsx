import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auctionService } from '../../api/dataService'
import { useNotifications } from '../../context/NotificationContext'
import AuctionHero from '../../components/admin/deals/AuctionHero'
import InvestmentMemorandumTab from '../../components/admin/deals/InvestmentMemorandumTab'
import {
    FileText, Gavel, ArrowLeft, MapPin,
    ShieldAlert, Home, Users, CheckCircle2, TrendingUp,
    List, FolderOpen, Download, Eye
} from 'lucide-react'
import { generateBrandedPDF } from '../../utils/pdfGenerator'

/* ─── helpers ──────────────────────────────────────────────────────────── */
const fmt = (v) =>
    v != null && v !== 0
        ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v)
        : '—'

/* ─── MetricPill ───────────────────────────────────────────────────────── */
function MetricPill({ label, value, sub, color = 'text-gray-900', bg = 'bg-gray-50' }) {
    return (
        <div className={`${bg} rounded-xl px-5 py-4 space-y-1`}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`text-xl font-bold ${color} leading-none`}>{value}</p>
            {sub && <p className="text-[10px] text-gray-400 font-medium">{sub}</p>}
        </div>
    )
}

/* ─── Section card ─────────────────────────────────────────────────────── */
function Card({ title, icon: Icon, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600', children, className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl ${className}`}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

/* ─── Row ──────────────────────────────────────────────────────────────── */
function Row({ label, value, valueClass = 'text-gray-900' }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
        </div>
    )
}

/* ─── LoanDetails ──────────────────────────────────────────────────────── */
function LoanDetails({ financials, metrics }) {
    return (
        <Card title="Loan Details" icon={ShieldAlert}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                <div>
                    <Row label="Outstanding Debt" value={fmt(financials.outstandingDebt)} />
                    <Row label="Original Loan Amount" value={fmt(financials.originalLoanAmount)} />
                    <Row label="Property Valuation" value={fmt(financials.propertyValuation)} valueClass="text-emerald-600" />
                </div>
                <div>
                    <Row label="Equity Available" value={fmt(financials.equityAvailable)} valueClass="text-emerald-600" />
                    <Row label="Interest Rate" value={metrics.interestRate > 0 ? `${metrics.interestRate}% p.a.` : '—'} />
                    <Row label="Default Rate" value={metrics.defaultRate > 0 ? `${metrics.defaultRate}% p.a.` : '—'} valueClass="text-amber-600" />
                </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-amber-800">Risk Assessment</p>
                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                        LVR of {metrics.lvr || '—'}% — property valuation is current. Reserve met when highest bid exceeds outstanding debt.
                    </p>
                </div>
            </div>
        </Card>
    )
}

/* ─── PropertyInfo ─────────────────────────────────────────────────────── */
function PropertyInfo({ deal }) {
    const rows = [
        { label: 'Property Type', value: deal.propertyType || deal.type || '—' },
        { label: 'Bedrooms', value: deal.bedrooms || '—' },
        { label: 'Bathrooms', value: deal.bathrooms || '—' },
        { label: 'Parking', value: deal.parking || '—' },
        { label: 'Land Size', value: deal.landSize || '—' },
        { label: 'Tenure', value: deal.tenure ? `${deal.tenure} months` : '—' },
    ]
    return (
        <Card title="Property Information" icon={Home}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                {rows.map((r, i) => (
                    <Row key={i} label={r.label} value={r.value} />
                ))}
            </div>
        </Card>
    )
}

/* ─── Documents ────────────────────────────────────────────────────────── */
function Documents({ documents }) {
    const docs = Array.isArray(documents) ? documents : []
    const getName = (d) => d.document_name || d.name || 'Document'
    const getType = (d) => d.document_type || d.type || ''
    const getUrl = (d) => d.s3_key || d.file_url || null

    const handleDownload = async (doc) => {
        const url = getUrl(doc)
        if (url) { window.open(url, '_blank'); return }
        try {
            await generateBrandedPDF({
                title: getName(doc), subtitle: getType(doc),
                fileName: `${getName(doc).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
                infoItems: [{ label: 'Document', value: getName(doc) }, { label: 'Type', value: getType(doc) }],
            })
        } catch { /* ignore */ }
    }

    return (
        <Card title="Case Documents" icon={FileText}>
            {docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                    <FolderOpen className="w-8 h-8 mb-2" />
                    <p className="text-xs font-medium text-gray-400">No documents attached</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div key={doc.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 group transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{getName(doc)}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{getType(doc)}</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {getUrl(doc) && (
                                    <button onClick={() => window.open(getUrl(doc), '_blank')} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

/* ─── CurrentBid ───────────────────────────────────────────────────────── */
function CurrentBid({ amount, bidderCount, reservePrice, isReserveMet }) {
    return (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1">Current Highest Bid</p>
            <p className="text-4xl font-bold tracking-tight mb-4">{fmt(amount)}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{bidderCount || 0} bidder{bidderCount !== 1 ? 's' : ''}</span>
                </div>
                {isReserveMet ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> Reserve Met
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-200 uppercase tracking-widest">Reserve</p>
                        <p className="text-sm font-bold">{fmt(reservePrice)}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── PlaceBid ─────────────────────────────────────────────────────────── */
function PlaceBid({ currentBid, onPlaceBid }) {
    const [amount, setAmount] = useState('')
    const parsed = parseInt(amount) || 0
    const premium = parsed * 0.02
    const total = parsed + premium

    const add = (n) => setAmount(String((parseInt(amount) || currentBid) + n))
    const submit = () => {
        if (parsed > currentBid) { onPlaceBid(parsed); setAmount('') }
    }

    return (
        <Card title="Place Your Bid" icon={Gavel} iconBg="bg-indigo-600" iconColor="text-white">
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1.5">Bid Amount (AUD)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">A$</span>
                        <input
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">Min increment A$10,000 · Current: {fmt(currentBid)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[10000, 25000, 50000].map((n) => (
                        <button key={n} onClick={() => add(n)}
                            className="py-2 text-[10px] font-bold uppercase tracking-wide text-gray-600 border border-gray-200 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all">
                            +{n / 1000}k
                        </button>
                    ))}
                </div>

                <button onClick={submit} disabled={!amount || parsed <= currentBid}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Gavel className="w-3.5 h-3.5" /> Place Bid
                </button>

                {parsed > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Your bid</span><span className="font-bold">{fmt(parsed)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Buyer premium (2%)</span><span className="font-bold">{fmt(premium)}</span></div>
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                            <span className="font-bold text-indigo-600">Total</span>
                            <span className="font-bold text-indigo-600">{fmt(total)}</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

/* ─── BidHistory ───────────────────────────────────────────────────────── */
function BidHistory({ bids }) {
    return (
        <Card title={`Bid History · ${bids.length} bids`} icon={List} iconBg="bg-gray-100" iconColor="text-gray-500">
            {bids.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">No bids placed yet</p>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {bids.map((bid, i) => (
                        <div key={bid.id || i}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl ${bid.isWinning ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'}`}>
                            <div>
                                <p className="text-xs font-bold text-gray-700">{bid.bidder}</p>
                                <p className="text-[10px] text-gray-400">{bid.timestamp}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${bid.isWinning ? 'text-emerald-600' : 'text-gray-900'}`}>{fmt(bid.amount)}</p>
                                {bid.isWinning && <p className="text-[10px] font-semibold text-emerald-500">Leading</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

/* ─── InvestmentSummary ────────────────────────────────────────────────── */
function InvestmentSummary({ financials }) {
    const riskColor = financials.riskLevel?.includes('Low') ? 'text-emerald-600' : financials.riskLevel?.includes('High') ? 'text-red-500' : 'text-amber-500'
    return (
        <Card title="Investment Summary" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600">
            <div className="space-y-0">
                <Row label="Expected ROI" value={`${financials.expectedROI ?? '—'}%`} valueClass="text-emerald-600" />
                <Row label="Recovery Rate" value={`${financials.recoveryRate ?? 97.5}%`} />
                <Row label="Time to Settlement" value={financials.timeToSettlement || '45 Days'} />
                <Row label="Risk Level" value={financials.riskLevel || 'Moderate'} valueClass={riskColor} />
            </div>
        </Card>
    )
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function AuctionRoom() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addNotification } = useNotifications()
    const [deal, setDeal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('live')
    const [bids, setBids] = useState([])
    const [highestBid, setHighestBid] = useState(0)

    useEffect(() => {
        setLoading(true)
        auctionService.getAuctionById(id)
            .then((res) => {
                if (!res.success || !res.data) return
                const a = res.data
                const rawBids = Array.isArray(a.bids) ? a.bids : []
                const startingPrice = Number(a.starting_price) || 0
                const currentHighestBid = Number(a.current_highest_bid) || 0
                const estimatedValue = Number(a.estimated_value) || 0
                const outstandingDebt = Number(a.outstanding_debt) || startingPrice
                const interestRate = Number(a.interest_rate) || 0
                const lvr = estimatedValue > 0 ? Math.round((outstandingDebt / estimatedValue) * 100) : 0
                const equityAvailable = Math.max(0, estimatedValue - outstandingDebt)
                const defaultRate = Number(a.default_rate) || (interestRate > 0 ? +(interestRate + 2).toFixed(2) : 0)
                const expectedROI = interestRate > 0 ? +(interestRate + 1.5).toFixed(2) : 8.5
                const location = [a.suburb, a.state, a.postcode].filter(Boolean).join(', ') || a.property_address || ''

                const bidHistory = [...rawBids]
                    .sort((x, y) => Number(y.amount) - Number(x.amount))
                    .map((b, i) => ({
                        id: b.id || i,
                        bidder: b.bidder_name || 'Bidder',
                        amount: Number(b.amount) || 0,
                        timestamp: b.created_at
                            ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '',
                        isWinning: i === 0,
                        isYou: false,
                    }))

                const propertyImages = Array.isArray(a.property_images) && a.property_images.length > 0 ? a.property_images : []

                const normalized = {
                    ...a,
                    address: a.property_address || a.title || '',
                    suburb: a.suburb || '', state: a.state || '', postcode: a.postcode || '',
                    propertyType: a.property_type || 'Residential',
                    type: a.property_type || 'Residential',
                    images: propertyImages, image: propertyImages[0] || null, location,
                    bedrooms: a.bedrooms || 0, bathrooms: a.bathrooms || 0, parking: a.parking || 0,
                    landSize: a.land_size || '—', valuer: a.valuer_name || '—',
                    tenure: a.tenure || null,
                    propertyValue: estimatedValue, outstandingDebt, lvr,
                    interestRate, defaultRate, returnRate: expectedROI,
                    auctionStartDate: a.scheduled_start ? new Date(a.scheduled_start).toLocaleDateString('en-AU') : '—',
                    auctionEndDate: a.scheduled_end ? new Date(a.scheduled_end).toLocaleDateString('en-AU') : '—',
                    bidHistory,
                    documents: Array.isArray(a.documents) ? a.documents : [],
                    metrics: {
                        interestRate, defaultRate, lvr,
                        daysInDefault: a.days_in_default || 0, daysInArrears: 0,
                        totalArrears: Math.round(outstandingDebt * (defaultRate / 100) / 12),
                        defaultStatus: 'In Default', arrearsSub: 'Accruing',
                        interestSub: 'p.a.', defaultRateSub: 'p.a. penalty',
                        lvrSub: 'of est. value', arrearsStatus: 'Active',
                    },
                    financials: {
                        currentHighestBid, bidderCount: rawBids.length,
                        reservePrice: startingPrice,
                        originalLoanAmount: outstandingDebt, outstandingDebt,
                        lastPaymentDate: '—', lastPaymentAmount: 0,
                        propertyValuation: estimatedValue, equityAvailable,
                        fixedPurchasePrice: startingPrice, expectedROI,
                        recoveryRate: 97.5,
                        timeToSettlement: a.tenure ? `${a.tenure} mo.` : '45 Days',
                        riskLevel: lvr > 80 ? 'High' : lvr > 60 ? 'Moderate' : 'Low',
                        equityPosition: equityAvailable, missedPayments: 0,
                    },
                }
                setDeal(normalized)
                setBids(bidHistory)
                setHighestBid(currentHighestBid || startingPrice)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [id])

    // Poll bids every 15s so admin sees all new bids in near-real-time
    useEffect(() => {
        const auctionIdToUse = deal?.id || id
        if (!auctionIdToUse) return
        const pollBids = async () => {
            const bidsRes = await auctionService.getBidHistory(auctionIdToUse)
            if (bidsRes.success && Array.isArray(bidsRes.data)) {
                const mapped = [...bidsRes.data]
                    .sort((x, y) => Number(y.amount) - Number(x.amount))
                    .map((b, i) => ({
                        id: b.id || i,
                        bidder: b.bidder_name || 'Bidder',
                        amount: Number(b.amount) || 0,
                        timestamp: b.created_at
                            ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '',
                        isWinning: i === 0,
                        isYou: false,
                    }))
                setBids(mapped)
                if (mapped.length > 0) setHighestBid(mapped[0].amount)
            }
        }
        const interval = setInterval(pollBids, 15000)
        return () => clearInterval(interval)
    }, [deal?.id, id])

    const handlePlaceBid = async (amount) => {
        const auctionIdToUse = deal?.id || id
        const res = await auctionService.placeBid(auctionIdToUse, amount)
        if (res.success) {
            // Optimistic update
            setBids(prev => [
                { id: res.data?.id || Date.now(), bidder: 'You', amount, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isWinning: true, isYou: true },
                ...prev.map(b => ({ ...b, isWinning: false }))
            ])
            setHighestBid(amount)
            // Refresh from backend to get correct bidder names for all
            const bidsRes = await auctionService.getBidHistory(auctionIdToUse)
            if (bidsRes.success && Array.isArray(bidsRes.data)) {
                const mapped = [...bidsRes.data]
                    .sort((x, y) => Number(y.amount) - Number(x.amount))
                    .map((b, i) => ({
                        id: b.id || i,
                        bidder: b.bidder_name || 'Bidder',
                        amount: Number(b.amount) || 0,
                        timestamp: b.created_at
                            ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '',
                        isWinning: i === 0,
                        isYou: i === 0,
                    }))
                setBids(mapped)
            }
        } else {
            addNotification({ type: 'error', title: 'Bid Failed', message: res.error || 'Failed to place bid. Please try again.' })
        }
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading…</p>
            </div>
        </div>
    )

    if (!deal) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-3">
                <p className="font-bold text-gray-500">Auction not found</p>
                <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Go back</button>
            </div>
        </div>
    )

    const statusColors = {
        LIVE: 'bg-red-50 text-red-600 border-red-200',
        SCHEDULED: 'bg-blue-50 text-blue-600 border-blue-200',
        PAUSED: 'bg-amber-50 text-amber-600 border-amber-200',
        ENDED: 'bg-gray-100 text-gray-500 border-gray-200',
    }
    const statusColor = statusColors[deal.status] || 'bg-gray-100 text-gray-500 border-gray-200'

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: breadcrumb + title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <button onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors shrink-0">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-3 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusColor}`}>
                                {deal.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                {deal.status || 'Auction'}
                            </span>
                            <h1 className="text-sm font-bold text-gray-900 truncate">{deal.address || deal.title}</h1>
                            <span className="text-xs text-gray-400 font-medium shrink-0 hidden sm:block">
                                <MapPin className="w-3 h-3 inline mr-0.5" />{deal.location}
                            </span>
                        </div>
                    </div>

                    {/* Right: tab switcher */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
                        {[
                            { key: 'live', icon: Gavel, label: 'Live Auction' },
                            { key: 'memo', icon: FileText, label: 'Memo' },
                        ].map(({ key, icon: Icon, label }) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'live' ? (
                <div className="p-6 space-y-6">

                    {/* ── Hero image ─────────────────────────────── */}
                    <AuctionHero deal={deal} />

                    {/* ── Metrics row ────────────────────────────── */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <MetricPill label="LVR" value={`${deal.metrics.lvr || '—'}%`} sub="loan-to-value" color="text-indigo-600" bg="bg-indigo-50" />
                        <MetricPill label="Interest Rate" value={deal.metrics.interestRate > 0 ? `${deal.metrics.interestRate}%` : '—'} sub="p.a." color="text-gray-800" />
                        <MetricPill label="Default Rate" value={deal.metrics.defaultRate > 0 ? `${deal.metrics.defaultRate}%` : '—'} sub="p.a. penalty" color="text-amber-600" bg="bg-amber-50" />
                        <MetricPill label="Equity Buffer" value={fmt(deal.financials.equityAvailable)} sub="available" color="text-emerald-600" bg="bg-emerald-50" />
                        <MetricPill label="Bidders" value={deal.financials.bidderCount} sub="registered" color="text-gray-800" />
                        <MetricPill label="Risk Level" value={deal.financials.riskLevel || 'Moderate'} sub="assessment" color={deal.financials.riskLevel === 'Low' ? 'text-emerald-600' : deal.financials.riskLevel === 'High' ? 'text-red-500' : 'text-amber-600'} bg={deal.financials.riskLevel === 'Low' ? 'bg-emerald-50' : deal.financials.riskLevel === 'High' ? 'bg-red-50' : 'bg-amber-50'} />
                    </div>

                    {/* ── Main grid ──────────────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                        {/* Left — 3 cols */}
                        <div className="xl:col-span-3 space-y-6">
                            <LoanDetails financials={deal.financials} metrics={deal.metrics} />
                            <PropertyInfo deal={deal} />
                            <Documents documents={deal.documents} />
                        </div>

                        {/* Right — 2 cols */}
                        <div className="xl:col-span-2 space-y-4">
                            <CurrentBid
                                amount={highestBid}
                                bidderCount={deal.financials.bidderCount}
                                reservePrice={deal.financials.reservePrice}
                                isReserveMet={highestBid >= deal.financials.reservePrice}
                            />
                            <PlaceBid currentBid={highestBid} onPlaceBid={handlePlaceBid} />
                                    <BidHistory bids={bids} />
                            <InvestmentSummary financials={deal.financials} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6">
                    <InvestmentMemorandumTab deal={deal} />
                </div>
            )}
        </div>
    )
}
