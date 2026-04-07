import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, FileText, Eye, RefreshCw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LenderMyCasesTable from "../../components/lender_dashboard/LenderMyCasesTable";
import { lenderService, casesService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";

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
                setCases(res.data || []);
            } else {
                setError(res.error || "Failed to load cases");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const stats = useMemo(() => [
        { label: "Total Cases", value: cases.length, icon: <FileText size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active Cases", value: cases.filter(c => ['UNDER_REVIEW', 'APPROVED', 'LISTED', 'AUCTION'].includes(c.status)).length, icon: <Eye size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "In Auction", value: cases.filter(c => ['LISTED', 'AUCTION'].includes(c.status)).length, icon: <RefreshCw size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "Completed", value: cases.filter(c => c.status === "CLOSED").length, icon: <CheckCircle2 size={20} />, color: "text-purple-600", bg: "bg-purple-50" }
    ], [cases]);

    const handleDeleteCase = (id) => {
        if (window.confirm(`Are you sure you want to delete case ${id}?`)) {
            setCases(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleStatusUpdate = async (caseId, newStatus) => {
        try {
            const res = await casesService.updateCaseStatus(caseId, newStatus);
            if (res.success) {
                setCases(prev => prev.map(c =>
                    c.id === caseId ? { ...c, status: newStatus } : c
                ));
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    if (loading) return <div className="p-8 max-w-[1240px] mx-auto"><LoadingState /></div>;
    if (error) return <div className="p-8 max-w-[1240px] mx-auto"><ErrorState message={error} /></div>;

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in font-['Inter',sans-serif]">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">My MIP Cases</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-none">Manage defaulted loans and auctions</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-all group">
                        <div>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Management Console</h2>
                    <p className="text-gray-500 text-[13px] font-medium">Viewing {cases.length} records in your active high-assurance portfolio</p>
                </div>
            </div>

            {/* Main Table Area */}
            <LenderMyCasesTable
                cases={cases}
                onDelete={handleDeleteCase}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
}
