
export default function BidsTab({ bidHistory }) {
    return (
        <div className="bg-white border border-gray-100 rounded-[20px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
            <h3 className="text-[17px] font-bold text-slate-800 mb-10">Bid History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-transparent">
                            <th className="px-1 py-4 text-[13px] font-bold text-gray-900 w-1/4">Bidder</th>
                            <th className="px-1 py-4 text-[13px] font-bold text-gray-900 w-1/4">Bid Amount</th>
                            <th className="px-1 py-4 text-[13px] font-bold text-gray-900 w-1/4">Timestamp</th>
                            <th className="px-1 py-4 text-[13px] font-bold text-gray-900 w-1/4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 border-t border-gray-50">
                        {(bidHistory || []).length === 0 ? (
                            <tr><td colSpan={4} className="px-1 py-8 text-center text-gray-400 text-sm">No bids placed yet.</td></tr>
                        ) : (bidHistory || []).map((bid, i) => (
                            <tr key={bid.id || i} className="hover:bg-gray-50/30 transition-all">
                                <td className="px-1 py-6 text-[14px] font-medium text-gray-900">{bid.bidder_name || bid.bidder || 'Bidder'}</td>
                                <td className="px-1 py-6 text-[14px] font-bold text-gray-900">
                                    {typeof bid.amount === 'number' || typeof bid.amount === 'string'
                                        ? `A$${Number(bid.amount).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`
                                        : bid.amount}
                                </td>
                                <td className="px-1 py-6 text-[14px] text-gray-500 font-medium">
                                    {bid.created_at ? new Date(bid.created_at).toLocaleString('en-AU') : (bid.timestamp || '—')}
                                </td>
                                <td className="px-1 py-6">
                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight ${
                                        bid.status === 'WINNING' || bid.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        bid.status === 'WON' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        'bg-gray-50 text-gray-400 border border-gray-100'
                                    }`}>
                                        {bid.status === 'WINNING' ? 'Highest' : bid.status === 'WON' ? 'Won' : bid.status === 'OUTBID' ? 'Outbid' : bid.status || '—'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
