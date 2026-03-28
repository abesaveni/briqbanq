import { Users, CheckCircle2 } from 'lucide-react'

export default function CurrentHighestBid({ amount, bidderCount, reservePrice, isReserveMet }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="bg-white border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Highest Bid</p>
                    <p className="text-5xl font-black text-emerald-500 tracking-tighter">{formatCurrency(amount)}</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <Users className="w-4 h-4 text-gray-400" />
                    5 bids from {bidderCount} bidders
                </div>

                <div className="w-full pt-6 border-t border-gray-50 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reserve Price</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(reservePrice)}</p>

                    {isReserveMet && (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reserve Met</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
