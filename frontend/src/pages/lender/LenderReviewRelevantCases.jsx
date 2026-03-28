import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, AlertTriangle, Search, Filter, Eye, ArrowRight } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { casesService } from '../../api/dataService';
import { LoadingState, ErrorState } from '../../components/common/States';

export default function LenderReviewRelevantCases() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true);
                const res = await casesService.getCases();
                if (res.success) {
                    // Simulating "Relevant Cases" (e.g. those requiring compliance review)
                    const relevant = res.data.filter(c => c.status === 'Pending' || Math.random() > 0.7);
                    setCases(relevant);
                } else {
                    setError(res.error);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, []);

    if (loading) return <div className="p-8"><LoadingState /></div>;
    if (error) return <div className="p-8"><ErrorState message={error} /></div>;

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in font-['Inter',sans-serif]">
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
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 text-[15px]">Flagged Cases ({cases.length})</h3>
                    <div className="flex items-center gap-2">
                         <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 font-medium" />
                         </div>
                         <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                             <Filter size={16} />
                         </button>
                    </div>
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
                            {cases.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{c.id}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{c.borrower}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-400">{c.property}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-100 uppercase tracking-tighter">Review Pending</span>
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
                    <button className="text-[12px] font-bold text-indigo-600 flex items-center gap-2 hover:gap-3 transition-all">
                        View More Pending Reviews
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
