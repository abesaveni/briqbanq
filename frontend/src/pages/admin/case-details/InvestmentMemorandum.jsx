// src/pages/admin/case-details/InvestmentMemorandum.jsx
import { useCaseContext } from '../../../context/CaseContext'
import {
    Download, Printer, Bed, Bath, Car, ShieldCheck,
    MapPin, TrendingUp, Building2, Shield, Image as ImageIcon,
    DollarSign, Percent, FileText, AlertTriangle
} from 'lucide-react'
import { generateInvestmentMemorandumPDF } from '../../../utils/pdfGenerator'

export default function InvestmentMemorandum() {
    const { caseData } = useCaseContext()

    if (!caseData) return null

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU') : '—'
    const fmt = (amount) => new Intl.NumberFormat('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0
    }).format(amount || 0)

    const { property = {}, loan = {}, valuation = {}, financial = {}, images = [], borrower = {}, lender = {}, id } = caseData

    const handleDownloadPDF = async () => {
        await generateInvestmentMemorandumPDF({
            title: `Investment Memorandum — ${caseData.id}`,
            location: [property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(', '),
            address: property.address,
            suburb: property.suburb,
            image: caseData.image || null,
            images,
            type: property.type || 'Residential',
            status: caseData.status,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            kitchens: property.kitchens,
            parking: property.parking,
            propertyValue: valuation.amount,
            property_value: valuation.amount,
            outstandingDebt: loan.outstandingDebt,
            interestRate: loan.interestRate,
            defaultRate: loan.defaultRate,
            lvr: loan.ltv,
            returnRate: loan.interestRate,
            auctionStartDate: fmtDate(caseData.auctionStart),
            auctionEndDate: fmtDate(caseData.auctionEnd),
            auction_start: fmtDate(caseData.auctionStart),
            auction_end: fmtDate(caseData.auctionEnd),
        })
    }
    const heroImage = caseData.image || images?.[0]?.url || (typeof images?.[0] === 'string' ? images[0] : null) || null
    const galleryImages = Array.from({ length: 4 }, (_, i) => images?.[i]?.url || (typeof images?.[i] === 'string' ? images[i] : null))

    return (
        <div className="space-y-6 pb-10">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Investment Memorandum</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Official investment dossier · Case {id}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Document Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                    {heroImage ? (
                        <img src={heroImage} alt="Property" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="w-16 h-16" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6 text-white">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-xs font-medium rounded mb-2">
                            <AlertTriangle className="w-3 h-3" />
                            Secured Investment Opportunity
                        </div>
                        <h1 className="text-2xl font-bold">{property.address || 'Property Address'}</h1>
                        <p className="text-sm text-gray-300 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {[property.suburb, property.state, property.postcode].filter(Boolean).join(', ') || 'Location not specified'}
                        </p>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg">
                        <p className="text-xs text-white/60">Case ID</p>
                        <p className="text-xs font-semibold text-white">{id}</p>
                    </div>
                </div>

                {/* Key Metrics Bar */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    <div className="px-6 py-4">
                        <p className="text-xs text-gray-400 mb-1">Property Valuation</p>
                        <p className="text-lg font-bold text-gray-900">{valuation.amount > 0 ? `$${(valuation.amount / 1000).toFixed(0)}k` : '—'}</p>
                    </div>
                    <div className="px-6 py-4">
                        <p className="text-xs text-gray-400 mb-1">LVR</p>
                        <p className="text-lg font-bold text-gray-900">{loan.ltv > 0 ? `${loan.ltv}%` : '—'}</p>
                    </div>
                    <div className="px-6 py-4 bg-indigo-50">
                        <p className="text-xs text-indigo-400 mb-1">Interest Rate</p>
                        <p className="text-lg font-bold text-indigo-700">{loan.interestRate > 0 ? `${loan.interestRate}%` : '—'}</p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-8">

                    {/* Property Specs row */}
                    {(property.bedrooms > 0 || property.bathrooms > 0 || property.parking > 0) && (
                        <div className="flex gap-3">
                            {[
                                { icon: Bed, val: property.bedrooms, label: 'Beds' },
                                { icon: Bath, val: property.bathrooms, label: 'Baths' },
                                { icon: Car, val: property.parking, label: 'Parking' },
                            ].filter(s => s.val > 0).map((s, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                    <s.icon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-900">{s.val}</span>
                                    <span className="text-xs text-gray-400">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Executive Summary */}
                    <section>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Executive Summary</h3>
                        <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-3">Investment Overview</p>
                        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                            <p>
                                This secured investment opportunity is backed by a{property.type ? ` ${property.type.toLowerCase()}` : ''} asset
                                {property.address ? <> at <strong className="text-gray-900">{property.address}</strong></> : ''}.
                                {' '}Borrower: <strong className="text-gray-900">{borrower.name}</strong>.
                                {lender.name !== 'Unassigned' && <> Lender: <strong className="text-gray-900">{lender.name}</strong>.</>}
                            </p>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 italic">
                                "This asset presents a secured position with {loan.ltv > 0 ? `${loan.ltv}% LVR` : 'verified LVR'} and
                                {loan.interestRate > 0 ? ` ${loan.interestRate}% p.a. interest rate` : ' competitive interest rate'},
                                offering capital preservation with yield potential."
                            </div>
                            <p>
                                The underlying security is valued at <strong className="text-gray-900">{fmt(valuation.amount)}</strong> with
                                outstanding debt of <strong className="text-gray-900">{fmt(loan.outstandingDebt)}</strong>,
                                maintaining an equity buffer of <strong className="text-gray-900">{fmt(financial.equityAvailable)}</strong>.
                            </p>
                        </div>
                    </section>

                    {/* Security Highlights */}
                    <section>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Security Highlights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { title: 'First Mortgage', desc: 'Secured first mortgage position over the property', icon: Shield, color: 'bg-green-50 text-green-600 border-green-100' },
                                { title: 'Verified Security', desc: 'Independent property valuation completed', icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                                { title: 'Registered Title', desc: 'Clear freehold title with no encumbrances', icon: FileText, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Investment Highlights */}
                    <section>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Investment Highlights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { title: 'Interest Rate', desc: `${loan.interestRate > 0 ? `${loan.interestRate}% p.a.` : 'Competitive rate'} — stable yield on secured capital`, value: loan.interestRate > 0 ? `${loan.interestRate}% p.a.` : '—', icon: TrendingUp, bg: 'bg-green-50', text: 'text-green-600' },
                                { title: 'Equity Buffer', desc: `${loan.ltv > 0 ? `${loan.ltv}% LVR` : 'LVR'} provides downside protection`, value: fmt(financial.equityAvailable), icon: ShieldCheck, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                                { title: 'Property Type', desc: `${property.type || 'Residential'} with secured first mortgage`, value: property.type || 'Residential', icon: Building2, bg: 'bg-purple-50', text: 'text-purple-600' },
                                { title: 'Outstanding Debt', desc: 'Total secured principal at current conditions', value: fmt(loan.outstandingDebt), icon: DollarSign, bg: 'bg-red-50', text: 'text-red-600' },
                            ].map((card, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                                        <card.icon className={`w-4 h-4 ${card.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                                            <span className={`text-sm font-bold ${card.text}`}>{card.value}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Property Gallery */}
                    <section>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Property Gallery</h3>
                        {images.length === 0 ? (
                            <div className="h-36 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                                <ImageIcon className="w-8 h-8" />
                                <p className="text-sm">No property images uploaded</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {galleryImages.map((src, i) => (
                                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        {src ? (
                                            <img src={src} alt={`Property ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Loan Architecture + Property Details */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Loan Architecture</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Outstanding Principal', value: fmt(loan.outstandingDebt), highlight: true },
                                    { label: 'Property Valuation', value: fmt(valuation.amount) },
                                    { label: 'Equity Available', value: fmt(financial.equityAvailable), accent: true },
                                    { label: 'LVR', value: loan.ltv > 0 ? `${loan.ltv}%` : '—' },
                                    { label: 'Interest Rate', value: loan.interestRate > 0 ? `${loan.interestRate}% p.a.` : '—' },
                                ].map((row, i) => (
                                    <div key={i} className={`flex justify-between items-center px-4 py-2.5 rounded-lg ${
                                        row.highlight ? 'bg-red-50 border border-red-100' :
                                        row.accent ? 'bg-green-50 border border-green-100' :
                                        'bg-gray-50'
                                    }`}>
                                        <span className="text-sm text-gray-500">{row.label}</span>
                                        <span className={`text-sm font-semibold ${
                                            row.highlight ? 'text-red-700' :
                                            row.accent ? 'text-green-700' : 'text-gray-900'
                                        }`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Property Details</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Address', value: property.address || '—' },
                                    { label: 'Suburb', value: property.suburb || '—' },
                                    { label: 'State', value: property.state || '—' },
                                    { label: 'Postcode', value: property.postcode || '—' },
                                    { label: 'Property Type', value: property.type || '—' },
                                    { label: 'Borrower', value: borrower.name },
                                    { label: 'Lender', value: lender.name },
                                    { label: 'Case Status', value: caseData.status },
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-400">{row.label}</span>
                                        <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-xs text-gray-600 font-medium">© 2026 Brickbanq · Confidential Investment Document</p>
                        <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString('en-AU', { timeZoneName: 'short' })}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <p className="text-xs text-gray-500">support@brickbanq.com.au</p>
                        <p className="text-xs text-gray-500">1800 275 426</p>
                        <p className="text-xs text-gray-500">www.brickbanq.com.au</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
