import { ShieldCheck, Info, BarChart3, Target } from "lucide-react";
import PropTypes from 'prop-types';

/**
 * InvestmentSummary: Provides an executive overview of the property's investment potential.
 * Fully dynamic and ready for backend integration with defensive fallbacks.
 */
export default function InvestmentSummary({ deal }) {
  if (!deal) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2.5 text-gray-900 font-bold">
        <BarChart3 size={20} className="text-gray-400" />
        Investment Summary
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-4">
          <SummaryRow
            label="Expected ROI"
            value={deal.expectedROI}
            highlight="text-green-600 font-bold text-base"
          />
          <SummaryRow
            label="Recovery Rate"
            value={deal.recoveryRate || "87.5%"}
            highlight="text-gray-900 font-bold text-base"
          />
          <SummaryRow
            label="Time to Settlement"
            value={deal.timeToSettlement || "45-60 days"}
            highlight="text-gray-900 font-bold text-base"
          />

          <div className="flex justify-between items-center group/row py-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Risk Level:</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${deal.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                deal.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
              }`}>
              {deal.riskLevel || "Medium"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 text-[10px] text-gray-400 font-medium leading-relaxed italic text-center">
          * Historic data used for projections. Actual returns may vary based on market conditions at settlement.
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = "text-gray-900 font-bold" }) {
  return (
    <div className="flex justify-between items-center group/row border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}:
      </span>
      <span className={`${highlight}`}>
        {value || "N/A"}
      </span>
    </div>
  );
}

InvestmentSummary.propTypes = {
  deal: PropTypes.shape({
    expectedROI: PropTypes.string,
    recoveryRate: PropTypes.string,
    timeToSettlement: PropTypes.string,
    riskLevel: PropTypes.string,
    analysisNote: PropTypes.string
  })
};
