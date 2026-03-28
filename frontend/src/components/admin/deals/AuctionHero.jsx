import { useState } from 'react'
import { ChevronLeft, ChevronRight, BedDouble, Bath, Car, Building2, MapPin, Clock } from 'lucide-react'
import useCountdown from '../../../hooks/useCountdown'

import { PROPERTY_PLACEHOLDER as FALLBACK } from '../../../utils/propertyPlaceholder'

export default function AuctionHero({ deal }) {
    const [idx, setIdx] = useState(0)

    const endTime = deal?.scheduled_end || deal?.scheduledEnd || deal?.auctionEnd || deal?.end_time
        || new Date(Date.now() + 72 * 60 * 60 * 1000)
    const countdown = useCountdown(endTime)

    const images = Array.isArray(deal.images) && deal.images.length > 0 ? deal.images : [deal.image || FALLBACK]
    const total = images.length
    const prev = () => setIdx((idx - 1 + total) % total)
    const next = () => setIdx((idx + 1) % total)

    const pad = (n) => String(n ?? 0).padStart(2, '0')
    const isLive = deal?.status === 'LIVE'

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">

                {/* ── Image (2/3) ──────────────────────────────────── */}
                <div className="lg:col-span-2 relative h-72 lg:h-80 bg-gray-100 overflow-hidden">
                    <img
                        src={images[idx]}
                        alt={deal.address}
                        className="w-full h-full object-cover transition-all duration-500"
                        onError={(e) => { e.target.src = FALLBACK }}
                    />

                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-4 left-4">
                        {isLive ? (
                            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Auction
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {(deal.status || 'Scheduled').replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>

                    {/* Image nav */}
                    {total > 1 && (
                        <>
                            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {/* Dots */}
                            <div className="absolute bottom-3 right-4 flex gap-1.5">
                                {images.map((_, i) => (
                                    <button key={i} onClick={() => setIdx(i)}
                                        className={`rounded-full transition-all ${i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Address overlay */}
                    <div className="absolute bottom-4 left-4 right-16">
                        <h2 className="text-white font-bold text-lg leading-tight drop-shadow-md line-clamp-1">{deal.address || deal.title}</h2>
                        <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {deal.suburb}{deal.state ? `, ${deal.state}` : ''} {deal.postcode}
                        </p>
                    </div>
                </div>

                {/* ── Info panel (1/3) ─────────────────────────────── */}
                <div className="flex flex-col p-6 gap-6 justify-between bg-white">

                    {/* Specs */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Property Details</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: BedDouble, label: 'Bedrooms', val: deal.bedrooms ?? '—' },
                                { icon: Bath, label: 'Bathrooms', val: deal.bathrooms ?? '—' },
                                { icon: Car, label: 'Parking', val: deal.parking ?? '—' },
                                { icon: Building2, label: 'Type', val: deal.propertyType || '—' },
                            ].map(({ icon: Icon, label, val }) => (
                                <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                                        <p className="text-sm font-bold text-gray-900">{val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="bg-gray-900 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Auction Ends In</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: 'Days', val: pad(countdown.days) },
                                { label: 'Hrs', val: pad(countdown.hours) },
                                { label: 'Min', val: pad(countdown.minutes) },
                                { label: 'Sec', val: pad(countdown.seconds) },
                            ].map(({ label, val }) => (
                                <div key={label} className="text-center">
                                    <p className="text-xl font-bold text-white leading-none">{val}</p>
                                    <p className="text-[9px] text-gray-500 font-medium mt-1 uppercase tracking-wider">{label}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3 text-center">
                            Ends {deal.auctionEndDate || '—'}
                        </p>
                    </div>

                    {/* Thumbnail strip */}
                    {total > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.slice(0, 5).map((img, i) => (
                                <button key={i} onClick={() => setIdx(i)}
                                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                    <img src={img} className="w-full h-full object-cover" onError={(e) => { e.target.src = FALLBACK }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
