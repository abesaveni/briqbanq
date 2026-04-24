// src/pages/admin/case-details/Property.jsx
import { useCaseContext } from '../../../context/CaseContext'
import { MapPin, Bed, Bath, Car, Building2, Ruler, Image as ImageIcon } from 'lucide-react'

export default function Property() {
    const { caseData } = useCaseContext()

    const fmt = (amount) => new Intl.NumberFormat('en-AU', {
        style: 'currency', currency: 'AUD', maximumFractionDigits: 0
    }).format(amount || 0)

    const { property, valuation, images } = caseData

    const specs = [
        { label: 'Property Type', value: property.type || '—', icon: Building2 },
        { label: 'Bedrooms', value: property.bedrooms > 0 ? property.bedrooms : '—', icon: Bed },
        { label: 'Bathrooms', value: property.bathrooms > 0 ? property.bathrooms : '—', icon: Bath },
        { label: 'Parking', value: property.parking > 0 ? property.parking : '—', icon: Car },
        { label: 'Land Size', value: property.landSize ? `${property.landSize} sqm` : '—', icon: Ruler },
        { label: 'State', value: property.state || '—', icon: MapPin },
    ]

    const detailRows = [
        { label: 'Full Address', value: property.address || '—' },
        { label: 'Suburb', value: property.suburb || '—' },
        { label: 'State', value: property.state || '—' },
        { label: 'Postcode', value: property.postcode || '—' },
        { label: 'Property Type', value: property.type || '—' },
        { label: 'Land Size', value: property.landSize ? `${property.landSize} sqm` : '—' },
    ]

    return (
        <div className="space-y-4">
            {/* Property Images */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Images</h3>
                {images.length === 0 ? (
                    <div className="h-48 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageIcon className="w-10 h-10" />
                        <p className="text-sm">No property images uploaded</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                {img.url ? (
                                    <img src={img.url} alt={`Property ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Property Specs */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Specifications</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {specs.map((spec, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <spec.icon className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">{spec.label}</p>
                                    <p className="text-sm font-medium text-gray-900">{spec.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Valuation Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Valuation Summary</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="text-sm text-gray-600">Property Valuation</span>
                            <span className="text-base font-bold text-indigo-700">{fmt(valuation.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">Outstanding Debt</span>
                            <span className="text-sm font-semibold text-gray-900">{fmt(caseData.loan.outstandingDebt)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-sm text-gray-600">Equity Available</span>
                            <span className="text-sm font-semibold text-green-700">{fmt(caseData.financial.equityAvailable)}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">LVR</span>
                            <span className="text-sm font-semibold text-gray-900">{caseData.loan.ltv > 0 ? `${caseData.loan.ltv}%` : '—'}</span>
                        </div>
                        {valuation.date && (
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-500">Valuation Date</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {new Date(valuation.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                        {valuation.valuer && (
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-500">Valuer</span>
                                <span className="text-sm font-semibold text-gray-900">{valuation.valuer}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {detailRows.map((row, i) => (
                        <div key={i}>
                            <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                            <p className="text-sm font-medium text-gray-900">{row.value}</p>
                        </div>
                    ))}
                </div>

                {/* Map placeholder */}
                <div className="mt-4 h-40 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center gap-2 text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{property.address || 'Address not available'}</span>
                </div>
            </div>
        </div>
    )
}
