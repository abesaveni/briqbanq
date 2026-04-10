import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, FileText, Eye, RefreshCw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LenderMyCasesTable from "../../components/lender_dashboard/LenderMyCasesTable";
import { lenderService, casesService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";

const STAT_CARDS = [
    { label: "Total Cases",  filter: () => true,                                                          icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Active",       filter: c => ['UNDER_REVIEW','APPROVED','LISTED','AUCTION'].includes(c.status), icon: Eye,          color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "In Auction",   filter: c => ['LISTED','AUCTION'].includes(c.status),                        icon: RefreshCw,    color: "text-rose-600",   bg: "bg-rose-50" },
    { label: "Completed",    filter: c => c.status === "CLOSED",                                          icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
];

export default function LenderMyCases() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const res = await lenderService.getMyCases();
            if (res.success) {
                const d = res.data
                setCases(Array.isArray(d) ? d : (d?.items || d?.cases || []));
            } else {
                setError(res.error || "Failed to load cases");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const stats = useMemo(() =>
        STAT_CARDS.map(s => ({ ...s, value: cases.filter(s.filter).length })),
    [cases]);

    const handleDeleteCase = async (id) => {
        if (window.confirm(`Delete case ${id}?`)) {
            setCases(prev => prev.filter(c => c.id !== id));
            try { await casesService.deleteCase(id); } catch (err) { console.error("Delete failed", err); }
        }
    };

    const handleStatusUpdate = async (caseId, newStatus) => {
        try {
            const res = await casesService.updateCaseStatus(caseId, newStatus);
            if (res.success) {
                setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    if (loading) return <div className="p-6"><LoadingState /></div>;
    if (error)   return <div className="p-6"><ErrorState message={error} /></div>;

    return (
        <div className="space-y-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">My MIP Cases</h1>
                    <p className="text-sm text-slate-500">Manage defaulted loans and auctions</p>
                </div>
                <button
                    onClick={() => navigate('/lender/submit-case')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold hover:bg-[#142d55] transition-colors"
                >
                    <Plus size={13} strokeWidth={2.5} /> New Case
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                            </div>
                            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                                <Icon size={18} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Section label */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Case Management</h2>
                    <p className="text-xs text-slate-500">{cases.length} records in your portfolio</p>
                </div>
            </div>

            <LenderMyCasesTable
                cases={cases}
                onDelete={handleDeleteCase}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
}
