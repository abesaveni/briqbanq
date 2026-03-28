export default function FixedPurchasePriceSummary({ financials }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const items = [
        { label: 'Outstanding Debt:', value: formatCurrency(financials.outstandingDebtSummary), color: 'text-gray-900' },
        { label: 'Equity Gain:', value: formatCurrency(financials.equityGain), color: 'text-emerald-500' },
        { label: 'Settlement Period:', value: financials.settlementPeriod, color: 'text-gray-900' },
    ]

    return (
        <div className="bg-white border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-xl shadow-emerald-500/5">
            <div className="text-center space-y-2 mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fixed Purchase Price</p>
                <p className="text-5xl font-black text-emerald-500 tracking-tighter">{formatCurrency(financials.fixedPurchasePrice)}</p>
            </div>

            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                        <span className={`font-black ${item.color} tracking-tight`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
