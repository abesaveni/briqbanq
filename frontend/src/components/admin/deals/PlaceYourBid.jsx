import { useState } from 'react'
import { Gavel } from 'lucide-react'

export default function PlaceYourBid({ currentBid, onPlaceBid }) {
    const [bidAmount, setBidAmount] = useState('')

    const increments = [10000, 25000, 50000]

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleIncrement = (inc) => {
        const base = parseInt(bidAmount) || currentBid
        setBidAmount(String(base + inc))
    }

    const handlePlaceBid = () => {
        const amount = parseInt(bidAmount)
        if (amount > currentBid) {
            onPlaceBid(amount)
            setBidAmount('')
        }
    }

    const buyerPremium = (parseInt(bidAmount) || 0) * 0.02
    const totalInvestment = (parseInt(bidAmount) || 0) + buyerPremium

    return (
        <div className="bg-[#F8FAFF] border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Gavel className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Place Your Bid</h3>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bid Amount (AUD)</p>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">A$</span>
                        <input
                            type="number"
                            placeholder="Enter bid amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full pl-14 pr-8 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-lg font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all"
                        />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400">Minimum increment: A$10,000 • Current bid: {formatCurrency(currentBid)}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {increments.map((inc) => (
                        <button
                            key={inc}
                            onClick={() => handleIncrement(inc)}
                            className="py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all hover:scale-[1.02]"
                        >
                            +A${(inc / 1000).toFixed(0)}k
                        </button>
                    ))}
                </div>

                <button
                    onClick={handlePlaceBid}
                    disabled={!bidAmount || parseInt(bidAmount) <= currentBid}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                    <Gavel className="w-4 h-4" />
                    Place Bid
                </button>

                <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-widest">Your bid:</span>
                        <span className="text-gray-900 font-black">{formatCurrency(parseInt(bidAmount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-widest">Buyer premium (2%):</span>
                        <span className="text-gray-900 font-black">{formatCurrency(buyerPremium)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                        <span className="text-indigo-600 font-black uppercase tracking-widest">Total Investment:</span>
                        <span className="text-indigo-600 font-black text-lg">{formatCurrency(totalInvestment)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
