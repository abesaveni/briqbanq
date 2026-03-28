import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Eye, Trash2, ChevronDown, RotateCcw, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateCasesTablePDF } from '../../utils/pdfGenerator';

export default function LenderMyCasesTable({ cases = [], onDelete, onStatusUpdate }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState(null);
    const itemsPerPage = 8;

    // Filter logic
    const filteredCases = useMemo(() => {
        return cases.filter(item => {
            const matchesSearch =
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.suburb && item.suburb.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === "All Status" || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [cases, searchTerm, statusFilter]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredCases.length / itemsPerPage));
    const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedCases.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleExport = async () => {
        const target = selectedIds.length
            ? filteredCases.filter(c => selectedIds.includes(c.id))
            : filteredCases;
        await generateCasesTablePDF({ title: 'My Cases Report', role: 'Lender', cases: target });
        setToast({ message: `PDF downloaded — ${target.length} cases`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    const handleStatusLocalUpdate = (caseId, newStatus) => {
        onStatusUpdate(caseId, newStatus);
        setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
        setTimeout(() => setToast(null), 2000);
    };

    const formatCurrency = (val) => {
        if (!val) return "A$0k";
        return `A$${(val / 1000).toLocaleString()}k`;
    };

    const statusOptions = ["Active", "In Auction", "Completed", "Pending", "Under Contract"];

    return (
        <div className="bg-white rounded-[22px] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative min-h-[500px] font-['Inter',sans-serif]">
            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-4 right-4 z-[100] animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-[12px] font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
                    </div>
                </div>
            )}

            {/* Header & Controls */}
            <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/30">
                <div className="flex-1 min-w-[300px] relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Case, Borrower, Property..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
                        >
                            <option>All Status</option>
                            {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Download size={14} />
                        Export Data
                    </button>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95 shadow-sm">
                        <RotateCcw size={16} onClick={() => { setSearchTerm(""); setStatusFilter("All Status"); }} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-50">
                        <tr>
                            <th className="pl-8 w-12 py-4">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === paginatedCases.length && paginatedCases.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-300 accent-[#1E40AF] w-4 h-4 cursor-pointer"
                                />
                            </th>
                            <th className="px-4 py-4">Case Details</th>
                            <th className="px-4 py-4">Borrower</th>
                            <th className="px-4 py-4 text-right">Loan Amount</th>
                            <th className="px-4 py-4 text-center">Status</th>
                            <th className="px-4 py-4 text-center">Risk Profile</th>
                            <th className="pl-4 pr-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedCases.length > 0 ? paginatedCases.map((item) => (
                            <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="pl-8 py-5">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => handleSelectOne(item.id)}
                                        className="rounded border-slate-300 accent-[#1E40AF] w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-5">
                                    <button
                                        className="text-slate-900 font-bold text-[14px] hover:text-indigo-600 transition-colors mb-0.5 block"
                                        onClick={() => navigate(`/lender/case-details/${item.id}`)}
                                    >
                                        {item.id}
                                    </button>
                                    <p className="text-slate-400 text-[11px] font-medium uppercase tracking-tight truncate max-w-[180px]">
                                        {item.property}
                                    </p>
                                </td>
                                <td className="px-4 py-5">
                                    <span className="text-slate-700 font-semibold text-[13px]">{item.borrower}</span>
                                    <p className="text-slate-400 text-[11px] font-medium mt-0.5">{item.suburb || 'Location N/A'}</p>
                                </td>
                                <td className="px-4 py-5 text-right whitespace-nowrap">
                                    <span className="text-slate-900 font-bold text-[14px]">{formatCurrency(item.loanAmount || item.debt)}</span>
                                    <p className="text-emerald-600 text-[11px] font-bold mt-0.5">LVR: {Math.round(((item.loanAmount || item.debt) / (item.valuation || 1)) * 100)}%</p>
                                </td>
                                <td className="px-4 py-5 text-center">
                                    <div className="relative inline-block text-left">
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusLocalUpdate(item.id, e.target.value)}
                                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-tight border cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all ${item.status === 'In Auction' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        item.status === 'Completed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                            item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}
                                        >
                                            {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
                                        </select>
                                        <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${item.risk === 'Low Risk' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            item.risk === 'Medium Risk' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                        {item.risk}
                                    </span>
                                </td>
                                <td className="pl-4 pr-8 py-5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/lender/case-details/${item.id}`)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-200">
                                        <Search size={48} className="mb-4 opacity-50" />
                                        <h4 className="text-base font-bold text-slate-900">No cases matched your search</h4>
                                        <p className="text-[13px] font-medium text-slate-400 mt-1">Try changing your filters or search keywords</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[13px] font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-bold">{paginatedCases.length}</span> of <span className="text-slate-900 font-bold">{filteredCases.length}</span> records
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        Previous
                    </button>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
