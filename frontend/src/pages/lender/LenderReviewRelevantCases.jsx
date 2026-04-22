import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, ChevronRight, AlertTriangle, Search, Eye, ArrowRight, X } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { lenderService } from '../../api/dataService';
import { LoadingState, ErrorState } from '../../components/common/States';

export default function LenderReviewRelevantCases() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const PAGE_SIZE = 20;

    const fetchCases = useCallback(async (pageNum = 1) => {
        try {
            setLoading(true);
            const res = await lenderService.getMyCases();
            if (res.success) {
                const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                if (pageNum === 1) {
                    setCases(data);
                } else {
                    setCases(prev => [...prev, ...data]);
                }
                setHasMore(data.length >= PAGE_SIZE);
            } else {
                setError(res.error || 'Failed to load cases');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(1); }, [fetchCases]);

    const handleViewMore = () => {
        const next = page + 1;
        setPage(next);
        fetchCases(next);
    };

    const normalizeStatus = (s) => (s || '').replace(/[\s_]+/g, '').toLowerCase();

    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchesSearch = !search ||
                (c.id || '').toString().toLowerCase().includes(search.toLowerCase()) ||
                (c.borrower || c.borrower_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (c.property_address || c.property || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'All' || normalizeStatus(c.status) === normalizeStatus(statusFilter);
            return matchesSearch && matchesStatus;
        });
    }, [cases, search, statusFilter]);

    if (loading) return <div className="p-8"><LoadingState /></div>;
    if (error) return <div className="p-8"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Review Relevant Cases</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-relaxed">Cases requiring immediate attention for compliance and listing approval</p>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-8 font-bold uppercase tracking-wider">
                <Home size={14} />
                <ChevronRight size={14} className="opacity-50" />
                <Link to="/lender/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-slate-900">Review Relevant Cases</span>
            </div>

            {/* Alert Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-amber-200 shrink-0">
                    <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                    <h4 className="text-amber-900 font-bold text-[15px] mb-1">Compliance Action Required</h4>
                    <p className="text-amber-800/80 text-[13px] font-medium leading-relaxed">
                        The cases listed below have been flagged for manual compliance review. Please verify all submitted documentation before promoting these to active listing status.
                    </p>
                </div>
            </div>

            {/* Cases Grid/Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Header row: title + search */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3 flex-wrap border-b border-slate-50 bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 text-[15px]">Flagged Cases ({filteredCases.length})</h3>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by case ID, borrower or property..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 font-medium w-64"
                        />
                    </div>
                </div>
                {/* Always-visible status filter tabs */}
                <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Status:</span>
                    {['All', 'SUBMITTED', 'UNDER REVIEW', 'AUCTION', 'APPROVED', 'LISTED', 'CLOSED', 'REJECTED'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                        >
                            {s}
                        </button>
                    ))}
                    {(search || statusFilter !== 'All') && (
                        <button onClick={() => { setSearch(''); setStatusFilter('All'); }} className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 ml-1">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                            <tr>
                                <th className="px-6 py-4">Case ID</th>
                                <th className="px-6 py-4">Borrower</th>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCases.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-[13px] font-medium text-slate-400">No cases found.</td></tr>
                            )}
                            {filteredCases.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{c.case_number || c.id}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{c.borrower || c.borrower_name || '—'}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-400">{c.property_address || c.property || '—'}</td>
                                    <td className="px-6 py-4">
                                        <StatusPill status={c.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => navigate(`/lender/case-details/${c.id}`)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex justify-center">
                    <button
                        onClick={handleViewMore}
                        disabled={loading || !hasMore}
                        className="text-[12px] font-bold text-indigo-600 flex items-center gap-2 hover:gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : hasMore ? 'View More Pending Reviews' : 'All cases loaded'}
                        {hasMore && !loading && <ArrowRight size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

const STATUS_STYLES = {
    SUBMITTED:      { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-100',   label: 'Submitted' },
    UNDER_REVIEW:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100',  label: 'Under Review' },
    'UNDER REVIEW': { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100',  label: 'Under Review' },
    APPROVED:       { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-100',label: 'Approved' },
    LISTED:         { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-100', label: 'Listed' },
    AUCTION:        { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-100', label: 'Auction' },
    CLOSED:         { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  label: 'Closed' },
    REJECTED:       { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-100',    label: 'Rejected' },
    DRAFT:          { bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200',   label: 'Draft' },
};

function StatusPill({ status }) {
    const s = STATUS_STYLES[status] || { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: status || 'Pending' };
    return (
        <span className={`px-2 py-1 ${s.bg} ${s.text} text-[10px] font-bold rounded-md border ${s.border} uppercase tracking-tighter`}>
            {s.label}
        </span>
    );
}
