import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Eye, Home, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { casesService, activityService } from '../../api/dataService';
import { generateCasesTablePDF } from '../../utils/pdfGenerator';

export default function LenderPortfolioTable() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const itemsPerPage = 5;

    // Fetch portfolio data on mount
    useEffect(() => {
        const fetchPortfolio = async () => {
            setLoading(true);
            try {
                const res = await casesService.getCases();
                if (res.success) {
                    setPortfolio(res.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch portfolio", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    // Helper for currency
    const formatCurrency = (val) => {
        if (!val) return "A$0k";
        if (val >= 1000000) return `A$${(val / 1000000).toFixed(1)}M`;
        return `A$${(val / 1000).toLocaleString()}k`;
    };

    // Filter logic
    const filteredPortfolio = useMemo(() => {
        return portfolio.filter(item =>
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.property?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.borrower?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [portfolio, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredPortfolio.length / itemsPerPage) || 1;
    const paginatedPortfolio = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPortfolio.slice(start, start + itemsPerPage);
    }, [filteredPortfolio, currentPage]);

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedPortfolio.map(item => item.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleExportData = async () => {
        const target = selectedIds.length
            ? filteredPortfolio.filter(c => selectedIds.includes(c.id))
            : filteredPortfolio;

        await generateCasesTablePDF({
            title: 'Lender Portfolio Report',
            role: 'Lender',
            cases: target,
        });

        activityService.logActivity({
            title: `Exported ${target.length} portfolio records`,
            details: 'Portfolio PDF downloaded',
            type: 'file'
        }).catch(() => {});
    };

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-indigo-600 animate-pulse">
                    <Home size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in relative z-10">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-[18px] flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                        <Home size={22} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">My MIP Portfolio</h3>
                        <p className="text-gray-500 text-[13px] font-medium mt-1">Manage and track your active mortgage in possession cases</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportData}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={14} />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="px-6 py-4 bg-slate-50/40 border-b border-gray-50 flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Case ID, Property or Borrower..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={14} />
                        Filters
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="pl-8 pr-4 py-4 w-10">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === paginatedPortfolio.length && paginatedPortfolio.length > 0}
                                    className="rounded border-slate-300 accent-indigo-600 cursor-pointer w-4 h-4"
                                />
                            </th>
                            <th className="px-4 py-4">Case Details</th>
                            <th className="px-4 py-4">Borrower</th>
                            <th className="px-4 py-4 text-right">Loan Amount</th>
                            <th className="px-4 py-4 text-center">Status</th>
                            <th className="px-4 py-4">Action Window</th>
                            <th className="pl-4 pr-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedPortfolio.length > 0 ? paginatedPortfolio.map((item) => (
                            <RowWithMenu
                                key={item.id}
                                item={item}
                                navigate={navigate}
                                formatCurrency={formatCurrency}
                                selectedIds={selectedIds}
                                handleSelectItem={handleSelectItem}
                            />
                        )) : (
                            <tr>
                                <td colSpan="7" className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <Search size={48} className="mb-4 opacity-20" />
                                        <h4 className="text-[17px] font-bold text-slate-900">No cases found</h4>
                                        <p className="text-slate-400 text-[13px] mt-1 font-medium">Try adjusting your search criteria or filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="mt-auto p-6 bg-slate-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[13px] font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-bold">{paginatedPortfolio.length}</span> of <span className="text-slate-900 font-bold">{filteredPortfolio.length}</span> cases
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center px-3">
                        <span className="text-[13px] font-bold text-slate-900">Page {currentPage} of {totalPages}</span>
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RowWithMenu({ item, navigate, formatCurrency, selectedIds, handleSelectItem }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <tr className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
            <td className="pl-8 pr-4 py-5">
                <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-slate-300 accent-indigo-600 cursor-pointer w-4 h-4"
                />
            </td>
            <td className="px-4 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0">
                        {(item.id || 'AA').substring(0, 2)}
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold text-[14px] leading-tight mb-1">{item.id}</p>
                        <p className="text-slate-500 text-[12px] font-medium truncate max-w-[180px]">{item.property || item.title}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight mt-1">{item.suburb}, {item.state}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-5">
                <p className="text-slate-700 font-semibold text-[13px]">{item.borrower || 'N/A'}</p>
                <p className="text-slate-400 text-[11px] font-medium mt-1">{item.risk || 'Low Risk'}</p>
            </td>
            <td className="px-4 py-5 text-right font-inter">
                <p className="text-slate-900 font-bold text-[14px]">{formatCurrency(item.loanAmount || item.debt || 0)}</p>
                <p className="text-emerald-600 text-[11px] font-bold mt-1">LVR: {item.valuation ? Math.round(((item.loanAmount || item.debt) / item.valuation) * 100) : 0}%</p>
            </td>
            <td className="px-4 py-5 text-center">
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${item.status === 'In Auction' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            item.status === 'Under Contract' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                item.status === 'Completed' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                    'bg-gray-50 text-gray-500 border border-gray-100'
                    }`}>
                    {item.status}
                </span>
            </td>
            <td className="px-4 py-5 font-inter">
                <p className="text-slate-600 text-[12px] font-bold">{item.auctionEnd !== '-' && item.auctionEnd ? item.auctionEnd : 'No active timer'}</p>
                {item.auctionEnd !== '-' && item.auctionEnd && (
                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 w-2/3 animate-pulse" />
                    </div>
                )}
            </td>
            <td className="pl-4 pr-8 py-5 text-right relative">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => navigate(`/lender/case-details/${item.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
