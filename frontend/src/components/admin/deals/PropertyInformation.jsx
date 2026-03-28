import { Home } from 'lucide-react'

export default function PropertyInformation({ deal }) {
    const info = [
        { label: 'Property Type', value: deal.propertyType || deal.type || '—' },
        { label: 'Land Size', value: deal.landSize || '—' },
        { label: 'Bedrooms', value: deal.bedrooms ?? '—' },
        { label: 'Bathrooms', value: deal.bathrooms ?? '—' },
        { label: 'Parking', value: deal.parking ?? '—' },
        { label: 'Valuer', value: deal.valuer || '—' },
    ]

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Home className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Property Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                {info.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-xl font-black text-gray-900 tracking-tight">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
