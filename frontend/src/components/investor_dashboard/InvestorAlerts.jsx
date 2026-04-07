import { useNavigate } from "react-router-dom";
import { CheckCircle2, Info } from "lucide-react";

export default function InvestorAlerts({ investments = [] }) {
    const navigate = useNavigate();

    // Calculate dynamic alerts with defensive checks
    const safeInvestments = Array.isArray(investments) ? investments : [];
    const activeOpportunities = safeInvestments.filter(i => i && (i.status === 'Active' || !['Sold', 'Settled'].includes(i.status)));
    const upcomingSettlements = safeInvestments.filter(i => i && i.status === 'Sold');

    // Fallbacks if no data
    const newOppsCount = activeOpportunities.length > 0 ? activeOpportunities.length : 0;

    // Get the most recent sold property or format a fallback
    const hasSettlement = upcomingSettlements.length > 0;
    const targetSettlement = hasSettlement
        ? upcomingSettlements[0]
        : { id: null, propertyData: { address: "No upcoming settlements" }, expectedReturn: 0, currentBid: 0 };

    const settlementId = targetSettlement.id;
    // Use real annual return = principal * interest_rate / 100
    const principal = targetSettlement.currentBid || targetSettlement.loanAmount || 0;
    const rate = targetSettlement.returnRate || 0;
    const annualReturn = principal > 0 && rate > 0 ? Math.round(principal * rate / 100) : 0;
    const settlementReturn = annualReturn > 0 ? annualReturn.toLocaleString() : '—';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opportunities Alert */}
            <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-emerald-900 font-bold text-sm mb-0.5">New Investment Opportunities</h4>
                    <p className="text-emerald-700 text-[11px] mb-2 font-semibold opacity-80">
                        {newOppsCount} new high-yield properties matching your criteria are available
                    </p>
                    <button
                        onClick={() => navigate("/investor/deals")}
                        className="bg-white text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                    >
                        View Opportunities
                    </button>
                </div>
            </div>

            {/* Settlement Alert */}
            <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="text-blue-900 font-bold text-sm mb-0.5">Upcoming Settlement</h4>
                    <p className="text-blue-700 text-[11px] mb-2 font-semibold opacity-80">
                        {hasSettlement
                            ? `${settlementId} settlement scheduled soon - A$${settlementReturn} est. return`
                            : "No upcoming settlements at this time"}
                    </p>
                    {hasSettlement ? (
                        <button
                            onClick={() => navigate(`/investor/case-details/${settlementId}`)}
                            className="bg-white text-blue-700 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                        >
                            View Details
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/investor/escrow")}
                            className="bg-white text-blue-700 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                        >
                            View Settlements
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
