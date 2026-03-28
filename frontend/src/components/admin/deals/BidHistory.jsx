import { Gavel } from 'lucide-react'

export default function BidHistory({ bids }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center gap-3 mb-8 shrink-0">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Gavel className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Bid History ({bids.length} bids)</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {bids.map((bid, idx) => (
                    <div key={bid.id} className={`p-6 rounded-[1.5rem] border transition-all ${bid.isWinning
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-white border-gray-50'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${bid.isYou ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {bid.bidder}
                                </span>
                                {bid.isYou && (
                                    <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">YOU</span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-gray-300">{bid.timestamp}</span>
                        </div>

                        <div className="flex justify-between items-end">
                            <h4 className={`text-2xl font-black tracking-tighter ${bid.isWinning ? 'text-emerald-500' : 'text-gray-900'}`}>
                                {formatCurrency(bid.amount)}
                            </h4>
                            <div className="flex flex-col items-end gap-1">
                                {bid.isWinning && (
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                                        Winning
                                    </span>
                                )}
                                <span className="text-[10px] font-bold text-gray-400">+{formatCurrency(bid.increment)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
