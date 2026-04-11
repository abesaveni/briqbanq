import { useNavigate } from "react-router-dom";
import { Gavel, Calendar } from "lucide-react";

export default function InvestorAlerts({ investments = [] }) {
    const navigate = useNavigate();

    const safeInvestments = Array.isArray(investments) ? investments : [];
    const activeCount = safeInvestments.filter(i => i && !['Sold', 'Settled'].includes(i.status)).length;
    const settlements = safeInvestments.filter(i => i?.status === 'Sold');
    const hasSettlement = settlements.length > 0;
    const topSettlement = settlements[0] || null;
    const principal = topSettlement?.currentBid || topSettlement?.loanAmount || 0;
    const rate = topSettlement?.returnRate || 0;
    const annualReturn = principal > 0 && rate > 0 ? Math.round(principal * rate / 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gavel size={16} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">New Opportunities</p>
                    <p className="text-xs text-emerald-700 mt-0.5 mb-3">
                        {activeCount > 0 ? `${activeCount} active investments in your portfolio` : "Browse live auctions to start investing"}
                    </p>
                    <button
                        onClick={() => navigate("/investor/auctions")}
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                        Browse Auctions
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-blue-700" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Upcoming Settlement</p>
                    <p className="text-xs text-blue-700 mt-0.5 mb-3">
                        {hasSettlement
                            ? `Est. return A$${annualReturn.toLocaleString()} — settlement pending`
                            : "No upcoming settlements at this time"}
                    </p>
                    <button
                        onClick={() => hasSettlement ? navigate(`/investor/case-details/${topSettlement.id}`) : navigate("/investor/escrow")}
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        {hasSettlement ? "View Settlement" : "View Escrow"}
                    </button>
                </div>
            </div>
        </div>
    );
}
