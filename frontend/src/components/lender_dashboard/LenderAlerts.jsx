import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, ChevronRight } from "lucide-react";

export default function LenderAlerts() {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compliance Alert */}
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[20px] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-[#FDE68A]">
                    <AlertTriangle size={20} className="text-[#D97706]" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[#92400E] font-bold text-[15px] mb-1 tracking-tight">Compliance Review Required</h4>
                    <p className="text-[#B45309] text-[13px] mb-3 font-medium opacity-80 leading-snug">
                        2 cases require quarterly compliance review before auction listing can proceed.
                    </p>
                    <button
                        onClick={() => navigate('/lender/review-relevant-cases')}
                        className="inline-flex items-center gap-1.5 text-[#92400E] text-[12px] font-bold hover:underline group"
                    >
                        Review Relevant Cases
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Market Update */}
            <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-[20px] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-[#BAE6FD]">
                    <Info size={20} className="text-[#0284C7]" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[#075985] font-bold text-[15px] mb-1 tracking-tight">System Market Intelligence</h4>
                    <p className="text-[#0369A1] text-[13px] mb-3 font-medium opacity-80 leading-snug">
                        Property market showing 3.2% increase in target suburbs this quarter.
                    </p>
                    <button
                        onClick={() => navigate('/lender/trend-analysis')}
                        className="inline-flex items-center gap-1.5 text-[#075985] text-[12px] font-bold hover:underline group"
                    >
                        View Trend Analysis
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
