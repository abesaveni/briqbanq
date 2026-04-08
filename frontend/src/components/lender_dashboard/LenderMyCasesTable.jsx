import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Eye, Trash2, ChevronDown, RotateCcw, X, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateCasesTablePDF } from '../../utils/pdfGenerator';

const STATUS_STYLES = {
    DRAFT:        "bg-slate-100 text-slate-600 border-slate-200",
    SUBMITTED:    "bg-blue-50 text-blue-700 border-blue-100",
    UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED:     "bg-emerald-50 text-emerald-700 border-emerald-100",
    LISTED:       "bg-indigo-50 text-indigo-700 border-indigo-100",
    AUCTION:      "bg-purple-50 text-purple-700 border-purple-100",
    FUNDED:       "bg-teal-50 text-teal-700 border-teal-100",
    CLOSED:       "bg-slate-100 text-slate-500 border-slate-200",
    REJECTED:     "bg-red-50 text-red-700 border-red-100",
    // legacy frontend statuses
    Active:           "bg-emerald-50 text-emerald-700 border-emerald-100",
    "In Auction":     "bg-purple-50 text-purple-700 border-purple-100",
    Completed:        "bg-slate-100 text-slate-500 border-slate-200",
    Pending:          "bg-amber-50 text-amber-700 border-amber-100",
    "Under Contract": "bg-blue-50 text-blue-700 border-blue-100",
};

const RISK_STYLES = {
    "Low Risk":    "bg-emerald-50 text-emerald-700",
    "Medium Risk": "bg-amber-50 text-amber-700",
    "High Risk":   "bg-red-50 text-red-700",
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

const STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "LISTED", "AUCTION", "FUNDED", "CLOSED", "REJECTED"];

export default function LenderMyCasesTable({ cases = [], onDelete, onStatusUpdate }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState(null);
    const itemsPerPage = 8;

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return cases.filter(item => {
            const caseId = (item.case_number || item.id || "").toLowerCase();
            const borrower = (item.borrower_name || item.borrower || "").toLowerCase();
            const address = (item.property_address || item.property || item.title || "").toLowerCase();
            const matchSearch = caseId.includes(q) || borrower.includes(q) || address.includes(q);
            const matchStatus = statusFilter === "All" || item.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [cases, searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const allSelected = paginated.length > 0 && paginated.every(c => selectedIds.includes(c.id));
    const toggleAll = (e) => setSelectedIds(e.target.checked ? paginated.map(c => c.id) : []);
    const toggleOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleExport = async () => {
        const target = selectedIds.length ? filtered.filter(c => selectedIds.includes(c.id)) : filtered;
        await generateCasesTablePDF({ title: 'My Cases Report', role: 'Lender', cases: target });
        showToast(`PDF downloaded — ${target.length} cases`);
    };

    const handleStatusUpdate = (caseId, newStatus) => {
        onStatusUpdate?.(caseId, newStatus);
        showToast(`Status updated to ${newStatus}`);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden relative">
            {/* Toast */}
            {toast && (
                <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 ml-1"><X size={13} /></button>
                </div>
            )}

            {/* Controls */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search case, borrower, property…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                    />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Download size={13} /> Export
                </button>
                <button onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                    className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                    <RotateCcw size={13} />
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
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider text-right">Loan</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            <th className="px-3 py-3 font-semibold text-slate-500 uppercase tracking-wider text-center">Risk</th>
                            <th className="pl-3 pr-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                            const risk = item.risk_level || item.risk || "Medium Risk";

                            return (
                                <tr key={item.id}
                                    className={`hover:bg-slate-50/60 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/20' : ''}`}>
                                    <td className="pl-5 pr-3 py-3.5">
                                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)}
                                            className="rounded border-slate-300 accent-blue-600 w-3.5 h-3.5 cursor-pointer" />
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <button
                                            onClick={() => navigate(`/lender/case-details/${item.id}`)}
                                            className="font-semibold text-blue-700 hover:text-blue-900 transition-colors block"
                                        >
                                            {caseId}
                                        </button>
                                        <p className="text-slate-400 truncate max-w-[160px] mt-0.5">{address}</p>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <p className="font-medium text-slate-700">{borrower}</p>
                                        <p className="text-slate-400 mt-0.5">{item.suburb || ""}</p>
                                    </td>
                                    <td className="px-3 py-3.5 text-right whitespace-nowrap">
                                        <p className="font-semibold text-slate-900">{formatCurrency(debt)}</p>
                                        <p className="text-emerald-600 font-medium mt-0.5">LVR: {lvr}%</p>
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${RISK_STYLES[risk] || "bg-slate-100 text-slate-600"}`}>
                                            {risk}
                                        </span>
                                    </td>
                                    <td className="pl-3 pr-5 py-3.5 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => navigate(`/lender/case-details/${item.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={() => onDelete?.(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" className="py-16 text-center">
                                    <Search size={32} className="mx-auto mb-2 text-slate-200" />
                                    <p className="text-sm font-medium text-slate-500">No cases found</p>
                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of <span className="font-semibold text-slate-700">{filtered.length}</span> records
                </p>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                        <ChevronLeft size={12} /> Prev
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                        Next <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
