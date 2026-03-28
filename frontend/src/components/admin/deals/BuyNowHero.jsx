import { useState } from 'react'
import { ChevronLeft, ChevronRight, BedDouble, Bath, Car, Building2, MapPin } from 'lucide-react'
import { PROPERTY_PLACEHOLDER } from '../../../utils/propertyPlaceholder'

export default function BuyNowHero({ deal }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const images = Array.isArray(deal.images) && deal.images.length > 0
        ? deal.images
        : [deal.image || PROPERTY_PLACEHOLDER]

    const nextImage = () => setCurrentImageIndex((currentImageIndex + 1) % images.length)
    const prevImage = () => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="relative h-[600px] rounded-[3rem] overflow-hidden group shadow-2xl">
            {/* Background Image */}
            <img
                src={images[currentImageIndex]}
                alt={deal.address}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Top Badge */}
            <div className="absolute top-8 left-8">
                <div className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                    Buy Now - Fixed Price
                </div>
            </div>

            {/* Navigation Arrows */}
            {/* Same as AuctionRoom */}
            <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Content Overlay */}
            <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between">
                <div className="space-y-6">
                    {/* Thumbnails */}
                    <div className="flex gap-3">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-white scale-110 shadow-xl' : 'border-white/20 opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-5xl font-black text-white tracking-tight">{deal.address}</h2>
                            <div className="flex items-center gap-2 text-white/80">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">{deal.suburb}, {deal.state} {deal.postcode}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <BedDouble className="w-4 h-4" /> {deal.bedrooms} Bed
                            </div>
                            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <Bath className="w-4 h-4" /> {deal.bathrooms} Bath
                            </div>
                            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <Car className="w-4 h-4" /> {deal.parking} Car
                            </div>
                            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <Building2 className="w-4 h-4" /> {deal.propertyType}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Price Card */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white min-w-[320px] shadow-2xl border border-emerald-500/50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Fixed Purchase Price</p>
                            <h3 className="text-4xl font-black tracking-tight">{formatCurrency(deal.financials.fixedPurchasePrice)}</h3>
                        </div>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 inline-block">
                        <p className="text-xs font-black uppercase tracking-widest">{deal.financials.timeToSettlement} settlement</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
