import { Search, Download, Eye, Gavel, Briefcase, Plus, FileText, CheckCircle2, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateCasesTablePDF } from '../../utils/pdfGenerator';

export default function InvestorActiveInvestments({ investments = [] }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTime, setFilterTime] = useState("All time");
    const [selectedIds, setSelectedIds] = useState([]);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const filteredInvestments = useMemo(() => {
        const safeInvestments = Array.isArray(investments) ? investments : [];
        return safeInvestments.filter((item) => {
            if (!item) return false;
            
            const matchesSearch =
                (item.id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (item.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (item.suburb?.toLowerCase() || "").includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (filterTime === "All time") return true;

            const daysMap = {
                "Last 7 days": 7,
                "Last 30 days": 30,
                "Last 90 days": 90,
                "Last 1 year": 365,
            };

            const days = daysMap[filterTime];
            if (days && item.created_at) {
                const createdDate = new Date(item.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - createdDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= days;
            }

            return true;
        });
    }, [investments, searchTerm, filterTime]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterTime]);

    const totalPages = Math.max(1, Math.ceil(filteredInvestments.length / itemsPerPage));
    const paginatedInvestments = filteredInvestments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredInvestments.map(i => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleExport = async () => {
        const dataToExport = selectedIds.length > 0
            ? filteredInvestments.filter(i => selectedIds.includes(i.id))
            : filteredInvestments;

        if (dataToExport.length === 0) {
            setToast({ message: "No data to export", type: "error" });
            return;
        }

        await generateCasesTablePDF({
            title: 'Active Investments Report',
            role: 'Investor',
            cases: dataToExport.map(i => ({
                id: i.id,
                property: i.title,
                borrower: `${i.suburb || ''}, ${i.state || ''}`.trim().replace(/^,\s*/, ''),
                status: i.status,
                value: i.currentBid,
                lvr: i.lvr,
                image: i.image || null,
            })),
        });

        setToast({ message: `Exported ${dataToExport.length} investment(s) as PDF`, type: "success" });
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkAction = (action) => {
        setToast({
            message: `${selectedIds.length} investment(s) ${action === 'watchlist' ? 'added to watchlist' : 'reports generated'}`,
            type: action
        });
    };

    const handleBid = (deal) => {
        setToast({
            message: `Bid successfully placed for Case #${deal.id}`,
            type: 'bid'
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-4 right-4 z-[100] animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-white" />
                        </div>
                        <span className="text-[11px] font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="text-emerald-400 hover:text-emerald-600">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Briefcase size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-[#1E293B] font-bold text-base leading-none">Active Investments</h3>
                        <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider mt-1.5">Current portfolio</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={filterTime}
                        onChange={(e) => setFilterTime(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#475569] outline-none hover:border-indigo-300 transition-colors cursor-pointer grow sm:grow-0"
                    >
                        <option>All time</option>
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                        <option>Last 1 year</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#475569] hover:bg-gray-50 transition-colors shrink-0"
                    >
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar & Search */}
            <div className="px-5 py-3 bg-gray-50/30 border-b border-gray-50 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative max-w-[280px] flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Case #, Property..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <>
                            <button 
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-[#475569] hover:bg-gray-50 transition-colors"
                            >
                                <Download size={14} />
                                Export
                            </button>
                            <button
                                onClick={() => handleBulkAction('watchlist')}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#1E40AF] text-white rounded-lg text-[10px] font-bold hover:bg-blue-800 transition-all active:scale-95 shadow-sm"
                            >
                                <Eye size={14} />
                                Add to Watchlist ({selectedIds.length})
                            </button>
                            <button
                                onClick={() => handleBulkAction('report')}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#1E40AF] text-white rounded-lg text-[10px] font-bold hover:bg-blue-800 transition-all active:scale-95 shadow-sm"
                            >
                                <FileText size={14} />
                                Generate Report ({selectedIds.length})
                            </button>
                        </>
                    )}
                </div>

                <p className="text-[#64748B] text-[10px] font-bold">
                    Showing {filteredInvestments.length} of {investments.length} results
                    {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
                </p>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8FAFC]/50 text-[#64748B] text-[10px] font-semibold uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="pl-5 pr-3 py-4 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 accent-indigo-600 cursor-pointer w-4 h-4"
                                    checked={selectedIds.length === filteredInvestments.length && filteredInvestments.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-3 py-4">Case #</th>
                            <th className="px-3 py-4">Property</th>
                            <th className="px-3 py-4">My Bid</th>
                            <th className="px-3 py-4">Est. Return</th>
                            <th className="px-3 py-4">LVR</th>
                            <th className="px-3 py-4 text-center">Status</th>
                            <th className="pl-3 pr-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedInvestments.length > 0 ? (
                            paginatedInvestments.map((deal) => (
                                <tr
                                    key={deal.id}
                                    className={`hover:bg-indigo-50/20 transition-colors group ${selectedIds.includes(deal.id) ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <td className="pl-5 pr-3 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 accent-indigo-600 cursor-pointer w-4 h-4"
                                            checked={selectedIds.includes(deal.id)}
                                            onChange={() => handleSelectOne(deal.id)}
                                        />
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => navigate(`/investor/case-details/${deal.id}`)}
                                            className="text-indigo-600 font-bold text-[11px] hover:underline"
                                        >
                                            {deal.case_number || String(deal.id).slice(0, 8).toUpperCase()}
                                        </button>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="min-w-[140px]">
                                            <p className="text-[#0F172A] font-bold text-[11px] leading-tight truncate">{deal.title}</p>
                                            <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-tight">
                                                {deal.suburb}, {deal.state}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <span className="text-[#0F172A] font-bold text-[11px]">
                                            {deal.currentBid ? `A$${deal.currentBid.toLocaleString()}` : "A$No bid"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <span className="text-emerald-600 font-semibold text-[11px]">
                                            {deal.returnRate ? `+${deal.returnRate}%` : "+0%"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="w-20">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${deal.lvr || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-gray-400 text-[10px] font-bold">{deal.lvr || 0}%</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${deal.status === "Live Auction"
                                                ? "bg-purple-50 text-purple-600"
                                                : deal.status === "Active"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : deal.status === "Sold"
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : deal.status === "Under Contract"
                                                            ? "bg-indigo-50 text-indigo-600"
                                                            : "bg-gray-50 text-gray-500"
                                                }`}
                                        >
                                            {deal.status === "Live Auction" ? "In Auction" : deal.status}
                                        </span>
                                    </td>
                                    <td className="pl-3 pr-5 py-4">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                                onClick={() => navigate(`/investor/case-details/${deal.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <Search size={32} strokeWidth={1.5} />
                                        <p className="text-sm font-bold">No investments found matching your search</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Info / Pagination */}
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/20 text-[10px] font-bold text-gray-400 flex justify-between items-center mt-auto">
                <span>
                    Showing {paginatedInvestments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                    {Math.min(currentPage * itemsPerPage, filteredInvestments.length)} of {filteredInvestments.length} investments
                </span>
                {totalPages > 1 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-2 py-1 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-2 py-1 rounded ${currentPage === i + 1 ? 'bg-white border border-gray-100 text-indigo-600' : 'hover:text-indigo-600'}`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-2 py-1 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
