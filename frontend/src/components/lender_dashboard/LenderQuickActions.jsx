import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Shield, BarChart2, ChevronRight } from "lucide-react";

const ACTIONS = [
    { label: "Create New MIP Case",      icon: Plus,      color: "text-blue-600",    bg: "bg-blue-50",    path: "/lender/submit-case" },
    { label: "Generate Portfolio Report", icon: FileText,  color: "text-slate-600",   bg: "bg-slate-100",  path: "/lender/reports" },
    { label: "Compliance Dashboard",      icon: Shield,    color: "text-indigo-600",  bg: "bg-indigo-50",  path: "/lender/settings" },
    { label: "View Analytics",            icon: BarChart2, color: "text-purple-600",  bg: "bg-purple-50",  path: "/lender/reports" },
];

export default function LenderQuickActions() {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
                {ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={i}
                            onClick={() => navigate(action.path)}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group text-left"
                        >
                            <div className={`w-7 h-7 ${action.bg} ${action.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <Icon size={13} />
                            </div>
                            <span className="text-xs font-medium text-slate-700 flex-1">{action.label}</span>
                            <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
