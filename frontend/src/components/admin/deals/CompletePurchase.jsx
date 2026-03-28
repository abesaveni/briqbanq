import { useState } from 'react'
import { ShoppingCart, CheckCircle2 } from 'lucide-react'

export default function CompletePurchase({ financials }) {
    const [agreed, setAgreed] = useState(false)
    const [purchased, setPurchased] = useState(false)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const legalFees = 2500
    const stampDuty = 42000
    const totalEstCost = financials.fixedPurchasePrice + legalFees + stampDuty

    const inclusions = [
        'Full property ownership transfer',
        'All legal documentation',
        '45-day settlement period',
        'Professional conveyancing'
    ]

    if (purchased) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[2.5rem] p-10 shadow-sm text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-emerald-800 tracking-tight mb-2">Purchase Confirmed</h3>
                <p className="text-sm text-emerald-600 font-medium leading-relaxed">
                    Our administrative team will contact you within 24 hours to initiate the legal documentation process.
                </p>
                <button
                    onClick={() => setPurchased(false)}
                    className="mt-8 text-xs font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-200 pb-1"
                >
                    View Purchase Receipt
                </button>
            </div>
        )
    }

    return (
        <div className="bg-[#F8FAFF] border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <ShoppingCart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Complete Purchase</h3>
            </div>

            <div className="space-y-8">
                {/* Inclusions */}
                <div className="bg-white border border-gray-50 rounded-2xl p-6 space-y-3">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">What's Included:</p>
                    {inclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-600">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Terms */}
                <div className="flex gap-4">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-1 cursor-pointer"
                    />
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                        I agree to the terms and conditions, and I understand this is a binding purchase agreement.
                    </p>
                </div>

                <button
                    onClick={() => setPurchased(true)}
                    disabled={!agreed}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Purchase Now - {formatCurrency(financials.fixedPurchasePrice)}
                </button>

                <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Purchase Price:</span>
                        <span className="text-gray-900">{formatCurrency(financials.fixedPurchasePrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Legal Fees (est.):</span>
                        <span className="text-gray-900">{formatCurrency(legalFees)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Stamp Duty (est.):</span>
                        <span className="text-gray-900">{formatCurrency(stampDuty)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                        <span className="text-indigo-600 font-black uppercase tracking-widest">Total Est. Cost:</span>
                        <span className="text-indigo-600 font-black text-lg">{formatCurrency(totalEstCost)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
