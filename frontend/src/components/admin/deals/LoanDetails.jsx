import { ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function LoanDetails({ financials, metrics, buyNow }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Loan Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-y-10 gap-x-12 mb-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Original Loan Amount</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(financials.originalLoanAmount)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding Debt</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(financials.outstandingDebt)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Payment Date</p>
                    <p className="text-xl font-bold text-gray-900 tracking-tight">{financials.lastPaymentDate}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Payment Amount</p>
                    <p className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(financials.lastPaymentAmount)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Property Valuation</p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">{formatCurrency(financials.propertyValuation)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equity Available</p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">{formatCurrency(financials.equityAvailable)}</p>
                </div>
            </div>

            {buyNow ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-6 flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Fixed Price Opportunity</p>
                        <p className="text-sm text-emerald-600 font-medium leading-relaxed">
                            This property is available at a fixed price of {formatCurrency(financials.fixedPurchasePrice)}. Lower risk profile with {metrics.daysInDefault} days in default and strong equity position. Property valuation is current as of Jan 2026.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-6 flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Risk Assessment</p>
                        <p className="text-sm text-amber-600 font-medium leading-relaxed">
                            This loan is {metrics.daysInDefault} days in default with {metrics.arrearsSub}. Current LVR of {metrics.lvr}% provides adequate security. Property valuation is current as of Jan 2026.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
