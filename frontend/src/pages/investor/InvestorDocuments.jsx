import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Download,
    Shield, Clock, CheckCircle, AlertCircle,
    Upload, Trash2, Folder, File, User,
    FileCheck, ChevronRight, Home
} from "lucide-react";
import { Link } from 'react-router-dom';
import { userService, contractService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";

export default function InvestorDocuments() {
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [investorDocs, setInvestorDocs] = useState([]);
    const [contracts, setContracts] = useState([]);

    useEffect(() => {
        const fetchAllDocs = async () => {
            try {
                setLoading(true);
                setError(null);

                const [docsRes, contractsRes] = await Promise.all([
                    userService.getInvestorDocuments(),
                    contractService.getContracts()
                ]);

                if (docsRes.success) {
                    const docsData = docsRes.data;
                    setInvestorDocs(Array.isArray(docsData) ? docsData : (docsData?.items || []));
                }
                if (contractsRes.success) {
                    const contractsData = contractsRes.data;
                    // contractsRes.data might be direct array or { items: [] } or { contracts: [] }
                    // contractService might already handle this, but let's be safe here too
                    setContracts(Array.isArray(contractsData) ? contractsData : (contractsData?.items || contractsData?.contracts || []));
                }
            } catch (err) {
                setError(err.message || "Failed to load documents");
            } finally {
                setLoading(false);
            }
        };

        fetchAllDocs();
    }, []);

    const categories = [
        "All Categories",
        "Identity & KYC",
        "Signed Contracts",
        "Financial Statements",
        "Property Disclosures"
    ];

    // Combine and category-map documents
    const allDocuments = [
        ...(investorDocs || []).map(doc => ({
            id: doc.id || Math.random(),
            name: doc.name,
            type: doc.type || 'PDF',
            category: 'Identity & KYC',
            date: doc.date || 'Jan 24, 2026',
            size: doc.size || '1.2 MB',
            status: 'Verified',
            file: doc.file
        })),
        ...(contracts || []).map(contract => ({
            id: contract.id,
            name: `Contract: ${contract.propertyAddress || contract.id}`,
            type: 'PDF',
            category: 'Signed Contracts',
            date: contract.date || 'Feb 15, 2026',
            size: '2.4 MB',
            status: contract.status === 'Signed' ? 'Verified' : 'Pending',
            link: `/investor/contracts/${contract.id}`
        }))
    ];

    const filteredDocs = allDocuments.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "All Categories" || doc.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="p-8"><LoadingState /></div>;
    if (error) return <div className="p-8"><ErrorState message={error} /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 w-full min-h-screen">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Documents</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-relaxed">Secure storage for your verification documents, contracts, and financial reports</p>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-6 font-bold uppercase tracking-wider">
                <Home size={12} className="text-slate-300" />
                <ChevronRight size={12} />
                <Link to="/investor/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                <ChevronRight size={12} />
                <span className="text-indigo-600">Document Vault</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Documents"
                    value={allDocuments.length}
                    icon={<Folder size={18} />}
                    color="indigo"
                />
                <StatCard
                    label="Signed Contracts"
                    value={contracts.filter(c => c.status === 'Signed').length}
                    icon={<FileCheck size={18} />}
                    color="green"
                />
                <StatCard
                    label="Pending Actions"
                    value={contracts.filter(c => c.status !== 'Signed').length}
                    icon={<Clock size={18} />}
                    color="orange"
                />
                <StatCard
                    label="Storage Limit"
                    value="12%"
                    subtext="Used (0.6 GB of 5 GB)"
                    icon={<Shield size={18} />}
                    color="blue"
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-gray-100 flex flex-col lg:flex-row gap-4 shadow-sm items-center mb-6">
                <div className="flex-1 relative w-full">
                    <input
                        type="text"
                        placeholder="Search document name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[180px]"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Document Grid/List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Document Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Uploaded</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-indigo-50/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-0.5">{doc.name}</h4>
                                                    <p className="text-[11px] text-gray-400 font-medium">{doc.size}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[12px] font-bold text-gray-500">{doc.category}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center px-1">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-black uppercase tracking-widest">{doc.type}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[12px] font-bold text-gray-500">{doc.date}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {doc.status === 'Verified' ? (
                                                    <div className="bg-green-100/60 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                        <CheckCircle size={10} /> Verified
                                                    </div>
                                                ) : (
                                                    <div className="bg-orange-100/60 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                        <Clock size={10} /> Pending
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Search size={32} className="mb-3 opacity-20" />
                                            <p className="text-[15px] font-bold">No documents found matching your search</p>
                                            <button
                                                onClick={() => { setSearchQuery(""); setCategoryFilter("All Categories") }}
                                                className="mt-2 text-indigo-600 font-bold text-[13px] hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disclaimer & Information */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-800/5 p-6 rounded-2xl border border-indigo-800/10 flex gap-4">
                    <div className="w-12 h-12 bg-indigo-800 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="text-gray-900 font-black text-[15px] mb-1">Secure Document Storage</h4>
                        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                            All documents are encrypted and stored in high-security data centers compliant with Australian financial regulations. Your data is protected by 256-bit AES encryption.
                        </p>
                    </div>
                </div>

                <div className="bg-fuchsia-50/50 p-6 rounded-2xl border border-fuchsia-100 flex gap-4">
                    <div className="w-12 h-12 bg-fuchsia-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-fuchsia-100">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-gray-900 font-black text-[15px] mb-1">Verification Required?</h4>
                        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                            If any of your documents are marked as 'Expired' or 'Action Needed', please update them immediately to ensure uninterrupted access to the platform and bidding participation.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}

function StatCard({ label, value, subtext, icon, color }) {
    const colorMap = {
        indigo: "bg-indigo-600/10 text-indigo-600 border-indigo-600/20 shadow-indigo-100/50",
        green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-100/50",
        orange: "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-100/50",
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-blue-100/50"
    };

    return (
        <div className="bg-white p-6 rounded-[22px] border border-slate-100 shadow-sm flex items-start justify-between group hover:border-indigo-600/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden h-32">
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
                </div>
                {subtext && <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{subtext}</p>}
            </div>

            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10 shadow-lg ${colorMap[color] || colorMap.indigo}`}>
                {icon}
            </div>

            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        </div>
    );
}
