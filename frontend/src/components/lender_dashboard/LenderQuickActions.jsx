import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Shield, BarChart2 } from "lucide-react";

export default function LenderQuickActions() {
    const navigate = useNavigate();
    const actions = [
        { label: "Create New MIP Case", icon: <Plus size={18} />, color: "text-blue-600", path: "/lender/submit-case" },
        { label: "Generate Portfolio Report", icon: <FileText size={18} />, color: "text-slate-600", path: "/lender/reports" },
        { label: "Compliance Dashboard", icon: <Shield size={18} />, color: "text-indigo-600", path: "/lender/settings" },
        { label: "View Analytics", icon: <BarChart2 size={18} />, color: "text-purple-600", path: "/lender/reports" }
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-slate-900 font-bold text-[15px] mb-4 border-b border-gray-50 pb-3 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => action.path && navigate(action.path)}
                        className="flex items-center gap-3 w-full p-3 border border-slate-100 rounded-xl text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group active:scale-95"
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color.replace('text-', 'bg-').replace('600', '100')} ${action.color} group-hover:scale-110 transition-transform`}>
                            {action.icon}
                        </div>
                        <span className="text-slate-600 font-bold text-[12px] group-hover:text-slate-900 transition-colors tracking-tight">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
