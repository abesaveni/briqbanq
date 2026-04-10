import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lenderService, activityService } from '../../api/dataService';
import { generateCasesTablePDF } from '../../utils/pdfGenerator';

const STATUS_STYLES = {
    DRAFT:        "bg-slate-100 text-slate-600",
    SUBMITTED:    "bg-blue-50 text-blue-700",
    UNDER_REVIEW: "bg-amber-50 text-amber-700",
    APPROVED:     "bg-emerald-50 text-emerald-700",
    LISTED:       "bg-indigo-50 text-indigo-700",
    AUCTION:      "bg-purple-50 text-purple-700",
    FUNDED:       "bg-teal-50 text-teal-700",
    CLOSED:       "bg-slate-100 text-slate-500",
    REJECTED:     "bg-red-50 text-red-700",
};

function formatCaseId(item) {
    if (item.case_number) return item.case_number;
    if (item.id) return item.id.substring(0, 8).toUpperCase();
    return "N/A";
}

function formatCurrency(val) {
    if (!val) return "A$0";
    const n = Number(val);
    if (n >= 1_000_000) return `A$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `A$${(n / 1_000).toFixed(0)}k`;
    return `A$${n.toLocaleString()}`;
}

export default function LenderPortfolioTable() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        lenderService.getMyCases()
            .then(res => {
                if (res.success) {
                    const data = res.data;
                    setPortfolio(Array.isArray(data) ? data : (data?.items || data?.cases || []));
                }
            })
            .catch(err => console.error("Failed to fetch portfolio", err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return portfolio.filter(item =>
            (item.case_number || item.id || "").toLowerCase().includes(q) ||
            (item.title || "").toLowerCase().includes(q) ||
            (item.property_address || item.property || "").toLowerCase().includes(q) ||
            (item.borrower_name || item.borrower || "").toLowerCase().includes(q)
        );
    }, [portfolio, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const allSelected = paginated.length > 0 && selectedIds.length === paginated.length;
    const toggleAll = (e) => setSelectedIds(e.target.checked ? paginated.map(i => i.id) : []);
    const toggleOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleExport = async () => {
        const target = selectedIds.length ? filtered.filter(c => selectedIds.includes(c.id)) : filtered;
        await generateCasesTablePDF({ title: 'Lender Portfolio Report', role: 'Lender', cases: target });
        activityService.logActivity({ title: `Exported ${target.length} portfolio records`, type: 'file' }).catch(() => {});
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Home size={28} className="animate-pulse" />
                    <p className="text-xs font-medium text-slate-500">Loading portfolio…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Home size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">My MIP Portfolio</h3>
                        <p className="text-xs text-slate-400">Active mortgage in possession cases</p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Download size={13} /> Export
                </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Case ID, property, borrower…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Filter size={13} /> Filter
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="pl-5 pr-3 py-3 w-8">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                    className="rounded border-slate-300 accent-blue-600 w-3.5 h-3.5 cursor-pointer" />
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider">Case</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider text-right">Loan Amount</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider">Action Window</th>
                            <th className="pl-3 pr-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-right">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginated.length > 0 ? paginated.map(item => {
                            const caseId = formatCaseId(item);
                            const address = item.property_address || item.property || item.title || "—";
                            const borrower = item.borrower_name || item.borrower || "N/A";
                            const debt = item.outstanding_debt || item.loanAmount || item.debt || 0;
                            const valuation = item.estimated_value || item.valuation || 0;
                            const lvr = valuation > 0 ? Math.round((debt / valuation) * 100) : 0;
                            const status = item.status || "DRAFT";
                            const initials = caseId.substring(0, 2).toUpperCase();
                            const auctionEnd = item.auction_scheduled_end || item.auctionEnd;

                            return (
                                <tr key={item.id}
                                    className={`hover:bg-slate-50/60 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="pl-5 pr-3 py-3.5">
                                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)}
                                            className="rounded border-slate-300 accent-blue-600 w-3.5 h-3.5 cursor-pointer" />
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-xs">{caseId}</p>
                                                <p className="text-slate-400 truncate max-w-[160px] mt-0.5">{address}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <p className="font-medium text-slate-700">{borrower}</p>
                                        <p className="text-slate-400 mt-0.5">{item.risk_level || item.risk || "Medium"} Risk</p>
                                    </td>
                                    <td className="px-3 py-3.5 text-right">
                                        <p className="font-semibold text-slate-900">{formatCurrency(debt)}</p>
                                        <p className="text-emerald-600 font-medium mt-0.5">LVR: {lvr}%</p>
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>
                                            {status.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <p className="text-slate-600 font-medium">
                                            {auctionEnd ? new Date(auctionEnd).toLocaleDateString('en-AU') : "No active timer"}
                                        </p>
                                    </td>
                                    <td className="pl-3 pr-5 py-3.5 text-right">
                                        <button
                                            onClick={() => navigate(`/lender/case-details/${item.id}`)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye size={15} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" className="py-16 text-center">
                                    <Search size={32} className="mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm font-medium text-slate-500">No cases found</p>
                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of <span className="font-semibold text-slate-700">{filtered.length}</span> cases
                </p>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2">
                        {currentPage} / {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors bg-white">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
