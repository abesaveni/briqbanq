import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ChevronRight,
    Home,
    FileText,
    Download,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    PenTool
} from 'lucide-react';

export default function ContractSigning() {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5">
                <h1 className="text-2xl font-bold text-gray-900">Contract Signing</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">Platform administration and compliance management</p>

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mt-4 text-sm font-medium">
                    <Link to="/admin/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <Link to="/admin/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors"> Dashboard </Link>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <Link to="/admin/contracts" className="text-gray-400 hover:text-indigo-600 transition-colors"> Contracts </Link>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <span className="text-indigo-600">Contract {id || 'MIP-2026-001'}</span>
                </nav>
            </div>

            <div className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Document Viewer */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900">Contract Document</h2>
                            </div>
                            <div className="flex-1 bg-gray-50 p-8 flex flex-col items-center justify-center min-h-[800px]">
                                <div className="w-full max-w-2xl aspect-[1/1.414] bg-white rounded shadow-lg border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="flex flex-col items-center gap-4 text-gray-400 transition-all duration-300 group-hover:scale-105">
                                        <FileText className="w-16 h-16 stroke-[1.5]" />
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-gray-900">PDF Viewer</p>
                                            <p className="text-sm font-medium mt-1">Contract_MIP-2026-001.pdf</p>
                                            <p className="text-xs mt-4 opacity-70">Awaiting signature</p>
                                        </div>
                                    </div>

                                    {/* Decorative PDF elements */}
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-semibold">PDF</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Contract Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">Contract Summary</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Deal ID</p>
                                    <p className="text-sm font-semibold text-gray-900">MIP-2026-001</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Property</p>
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">45 Victoria Street, Potts Point, NSW</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Borrower</p>
                                    <p className="text-sm font-bold text-gray-700">Sarah Mitchell</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Lender</p>
                                    <p className="text-sm font-bold text-gray-700">Commonwealth Bank</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Loan Amount</p>
                                    <p className="text-lg font-semibold text-indigo-600">A$980,000</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Status</p>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider border border-gray-200">
                                        Pending
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group">
                                <PenTool className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                                Sign Contract
                            </button>
                            <button className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                            <Link to="/admin/contracts" className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Contracts
                            </Link>
                        </div>

                        {/* Important Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                Important Information
                            </h3>
                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 mb-6">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-tighter mb-1">Legal Binding Agreement</p>
                                    <p className="text-xs text-blue-800 leading-relaxed font-medium">By signing this contract, you agree to all terms and conditions outlined in the document.</p>
                                </div>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    'Read all pages carefully before signing',
                                    'Ensure all details are correct',
                                    'Contact support if you have questions',
                                    'Digital signature is legally binding',
                                    'Cannot be undone once signed'
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs font-bold text-gray-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Checklist */}
                        <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-8 shadow-sm">
                            <h3 className="text-orange-900 font-bold text-sm mb-6 uppercase tracking-widest">Before You Sign</h3>
                            <div className="space-y-4">
                                {[
                                    'Review all contract terms',
                                    'Verify property details',
                                    'Confirm financial amounts',
                                    'Check settlement timeline'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <p className="text-sm font-semibold text-gray-700">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
