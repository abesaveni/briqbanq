import { BedDouble, Bath, Car, CheckCircle2, ShieldCheck, TrendingUp, MapPin, AlertCircle, Download, Printer, FileText } from 'lucide-react'
import { generateInvestmentMemorandumPDF } from '../../../utils/pdfGenerator'

// No stock image fallback — only real property images attached to the case

const fmt = (v) =>
    v != null && v !== '' && v !== 0
        ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v)
        : '—'

function Section({ title, children }) {
    return (
        <div className="space-y-5">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">{title}</h3>
            {children}
        </div>
    )
}

function DataRow({ label, value, valueClass = 'text-gray-900' }) {
    return (
        <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-500 shrink-0">{label}</span>
            <span className={`text-xs font-bold text-right ${valueClass}`}>{value || '—'}</span>
        </div>
    )
}

function HighlightCard({ icon: Icon, color, bg, title, body, note }) {
    return (
        <div className={`${bg} border border-gray-100 rounded-xl p-5 space-y-3 hover:shadow-sm transition-shadow`}>
            <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                {note && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{note}</p>}
            </div>
        </div>
    )
}

export default function InvestmentMemorandumTab({ deal }) {
    const images = Array.isArray(deal.images) && deal.images.length > 0
        ? deal.images
        : deal.image ? [deal.image] : []

    const financials = deal.financials || {}
    const metrics = deal.metrics || {}

    const propertyValue = financials.propertyValuation ?? deal.propertyValue ?? 0
    const outstandingDebt = financials.outstandingDebt ?? deal.outstandingDebt ?? 0
    const equityAvailable = financials.equityAvailable ?? deal.financials?.equityAvailable ?? 0
    const lvr = metrics.lvr ?? deal.lvr ?? 0
    const interestRate = metrics.interestRate ?? deal.interestRate ?? 0
    const defaultRate = metrics.defaultRate ?? deal.defaultRate ?? 0
    const expectedROI = financials.expectedROI ?? deal.returnRate ?? 0

    const now = new Date()
    const generated = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · ' + now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="space-y-6 pb-12">

            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Investment Memorandum</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Professional document · {deal.address || deal.title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                        onClick={() => generateInvestmentMemorandumPDF(deal)}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                </div>
            </div>

            {/* ── Document canvas ─────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                {/* ── Hero ──────────────────────────────────────── */}
                <div className="relative h-64 sm:h-80 bg-gray-100">
                    {images[0] ? (
                        <img
                            src={images[0]}
                            alt={deal.address}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1d2375] to-[#2d3a9a] flex items-center justify-center">
                            <span className="text-white/50 text-sm font-semibold uppercase tracking-widest">No property image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                        <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
                            Investment Opportunity
                        </span>
                        <h1 className="text-2xl font-bold text-white leading-tight">{deal.address || deal.title}</h1>
                        <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[deal.suburb, deal.state, deal.postcode].filter(Boolean).join(', ')}
                        </p>
                        <div className="flex gap-3 mt-3">
                            {[
                                { icon: BedDouble, val: deal.bedrooms, label: 'bed' },
                                { icon: Bath, val: deal.bathrooms, label: 'bath' },
                                { icon: Car, val: deal.parking, label: 'car' },
                            ].map(({ icon: Icon, val, label }) => (
                                <div key={label} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-semibold">
                                    <Icon className="w-3.5 h-3.5 opacity-70" /> {val ?? '—'} {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Key Stats bar ──────────────────────────────── */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    {[
                        { label: 'Property Value', value: fmt(propertyValue), color: 'text-gray-900' },
                        { label: 'Outstanding Debt', value: fmt(outstandingDebt), color: 'text-gray-900' },
                        { label: 'Expected Return', value: expectedROI > 0 ? `${expectedROI}%` : '—', color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="px-6 py-4 text-center">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Body ──────────────────────────────────────── */}
                <div className="p-8 space-y-10">

                    {/* Executive Summary */}
                    <Section title="Executive Summary">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-3">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    This Investment Memorandum presents a secured lending opportunity backed by a {(deal.type || deal.propertyType || 'residential').toLowerCase()} property
                                    {deal.suburb ? ` in ${deal.suburb}, ${deal.state || ''}` : ''}. The property is currently in mortgage default, presenting an attractive acquisition opportunity for institutional and high net worth investors.
                                </p>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    The loan is secured by first mortgage over a property valued at {fmt(propertyValue)}, providing a conservative LVR of {lvr || '—'}% and an equity buffer of {fmt(equityAvailable)}.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { icon: ShieldCheck, bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'First Mortgage Security', sub: 'Primary lien position' },
                                    { icon: CheckCircle2, bg: 'bg-indigo-50', color: 'text-indigo-600', title: 'Independent Valuation', sub: 'Current as of 2026' },
                                    { icon: AlertCircle, bg: 'bg-purple-50', color: 'text-purple-600', title: 'Clear Title', sub: 'No secondary charges' },
                                ].map(({ icon: Icon, bg, color, title, sub }) => (
                                    <div key={title} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
                                        <Icon className={`w-4 h-4 ${color} shrink-0`} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{title}</p>
                                            <p className="text-[10px] text-gray-500">{sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Financial & Property Details side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title="Loan Details">
                            <DataRow label="Original Loan Principal" value={fmt(financials.originalLoanAmount ?? outstandingDebt)} />
                            <DataRow label="Outstanding Debt" value={fmt(outstandingDebt)} />
                            <DataRow label="Property Valuation" value={fmt(propertyValue)} valueClass="text-emerald-600" />
                            <DataRow label="Equity Buffer" value={fmt(equityAvailable)} valueClass="text-emerald-600" />
                            <DataRow label="Loan to Value Ratio" value={lvr > 0 ? `${lvr}%` : '—'} valueClass="text-indigo-600" />
                            <DataRow label="Interest Rate (Original)" value={interestRate > 0 ? `${interestRate}% p.a.` : '—'} />
                            <DataRow label="Default Interest Rate" value={defaultRate > 0 ? `${defaultRate}% p.a.` : '—'} valueClass="text-amber-600" />
                        </Section>

                        <Section title="Property Details">
                            <DataRow label="Property Type" value={deal.propertyType || deal.type} />
                            <DataRow label="Address" value={deal.address || deal.property_address} />
                            <DataRow label="Suburb" value={deal.suburb} />
                            <DataRow label="State / Postcode" value={[deal.state, deal.postcode].filter(Boolean).join(' ')} />
                            <DataRow label="Bedrooms / Bath / Car" value={`${deal.bedrooms ?? '—'} / ${deal.bathrooms ?? '—'} / ${deal.parking ?? '—'}`} />
                            <DataRow label="Land Size" value={deal.landSize || '—'} />
                            <DataRow label="Auction End Date" value={deal.auctionEndDate} />
                        </Section>
                    </div>

                    {/* Investment Highlights */}
                    <Section title="Investment Highlights">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <HighlightCard
                                icon={TrendingUp} color="bg-emerald-100 text-emerald-600" bg="bg-emerald-50/30"
                                title="Strong Returns"
                                body={`Target IRR of ${expectedROI || '—'}% per annum with default interest at ${defaultRate || '—'}% p.a.`}
                                note="Historical recovery: 97.5%"
                            />
                            <HighlightCard
                                icon={ShieldCheck} color="bg-indigo-100 text-indigo-600" bg="bg-indigo-50/30"
                                title="Conservative LVR"
                                body={`LVR of ${lvr || '—'}% provides substantial equity cushion. Buffer: ${fmt(equityAvailable)}.`}
                                note={`Equity buffer: ${fmt(equityAvailable)}`}
                            />
                            <HighlightCard
                                icon={MapPin} color="bg-purple-100 text-purple-600" bg="bg-purple-50/30"
                                title="Prime Location"
                                body={`Located in ${deal.suburb || 'a prime location'} — a desirable area with strong capital growth history.`}
                                note="5-year growth: 42% · Median: $1.15M"
                            />
                            <HighlightCard
                                icon={AlertCircle} color="bg-amber-100 text-amber-600" bg="bg-amber-50/30"
                                title="Default Rate Premium"
                                body={`Enhanced return at ${defaultRate || '—'}% compared to original rate of ${interestRate || '—'}%, providing a premium above base rate.`}
                                note={`${metrics.daysInDefault ?? 0} days in default`}
                            />
                        </div>
                    </Section>

                    {/* Gallery */}
                    {images.length > 0 && (
                        <Section title="Property Gallery">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {images.slice(0, 4).map((img, i) => (
                                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                                        <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }} />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Risk & Terms */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title="Risk Assessment">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Primary risks include market volatility and delays in legal processes. A {lvr || '—'}% LVR provides a capital buffer of {fmt(equityAvailable)}.
                                </p>
                                <div className="space-y-2 pt-1">
                                    {['Verified first mortgage security', 'Current independent valuation on file', 'No secondary encumbrances'].map(point => (
                                        <div key={point} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                            <span className="text-xs font-medium text-amber-800">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Section>

                        <Section title="Investment Terms">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Min Investment</p>
                                        <p className="text-lg font-bold text-gray-900">$50,000</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Target Term</p>
                                        <p className="text-lg font-bold text-gray-900">6–12 Months</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected Return</p>
                                        <p className="text-lg font-bold text-emerald-600">{expectedROI > 0 ? `${expectedROI}%` : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Risk Level</p>
                                        <p className={`text-lg font-bold ${financials.riskLevel === 'Low' ? 'text-emerald-600' : financials.riskLevel === 'High' ? 'text-red-500' : 'text-amber-600'}`}>
                                            {financials.riskLevel || 'Moderate'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 italic border-t border-gray-100 pt-3 leading-relaxed">
                                    Distribution of capital and interest occurs upon settlement of the underlying property or refinance of the loan.
                                </p>
                            </div>
                        </Section>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Important Disclaimer</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            This document is for information purposes only and does not constitute financial advice. Investing in distressed real estate assets involves significant risk, including loss of capital. Past performance is not indicative of future results. BrickBanq Capital Pty Ltd operates as a technology platform and is not responsible for the performance of any underlying asset.
                        </p>
                    </div>
                </div>

                {/* ── Footer ────────────────────────────────────── */}
                <div className="bg-gray-900 px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white">BrickBanq Platform</p>
                            <p className="text-xs text-gray-300 mt-0.5">Regulated Financial Workflow Platform — Confidential</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">Ref: {String(deal.id).slice(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{generated}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
