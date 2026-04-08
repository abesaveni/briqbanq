import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";

export default function LenderAlerts() {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-amber-200 shrink-0">
                    <AlertTriangle size={15} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-amber-900 mb-0.5">Compliance Review Required</h4>
                    <p className="text-xs text-amber-700/80 leading-relaxed">
                        Cases may require quarterly compliance review before auction listing can proceed.
                    </p>
                    <button
                        onClick={() => navigate('/lender/review-relevant-cases')}
                        className="inline-flex items-center gap-1 text-amber-800 text-xs font-semibold mt-2 hover:underline"
                    >
                        Review Cases <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
                    <TrendingUp size={15} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900 mb-0.5">Market Intelligence Update</h4>
                    <p className="text-xs text-blue-700/80 leading-relaxed">
                        Property market data available for your portfolio's target suburbs this quarter.
                    </p>
                    <button
                        onClick={() => navigate('/lender/trend-analysis')}
                        className="inline-flex items-center gap-1 text-blue-800 text-xs font-semibold mt-2 hover:underline"
                    >
                        View Trend Analysis <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
