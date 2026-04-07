import React, { useState, useEffect, useMemo } from 'react';
import {
    Folder, FileText, Search, Upload, HardDrive, ShieldCheck, ChevronRight, Home
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../api/dataService';
import { LoadingState, ErrorState } from '../../components/common/States';

export default function LenderDocuments() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                const res = await documentService.getAllDocuments();
                if (res.success) {
                    const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                    setDocuments(data);
                } else {
                    setError(res.error || 'Failed to load documents');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, []);

    const caseFolders = useMemo(() => {
        const groups = {};
        documents.forEach(doc => {
            const key = doc.case_number || doc.case_id || 'Uncategorized';
            if (!groups[key]) {
                groups[key] = { caseNumber: key, caseId: doc.case_id, files: [] };
            }
            groups[key].files.push(doc);
        });
        return Object.values(groups).filter(g =>
            !search || g.caseNumber.toString().toLowerCase().includes(search.toLowerCase())
        );
    }, [documents, search]);

    const formatBytes = (bytes) => {
        if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
        if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
        if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' KB';
        return (bytes || 0) + ' B';
    };

    const totalBytes = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
    const complianceDocs = documents.filter(d =>
        ['CONTRACT', 'KYC', 'COMPLIANCE', 'LEGAL'].includes((d.document_type || '').toUpperCase())
    ).length;
    const thisWeek = documents.filter(d => {
        if (!d.created_at) return false;
        return (Date.now() - new Date(d.created_at).getTime()) < 7 * 24 * 3600 * 1000;
    }).length;

    if (loading) return <div className="p-8"><LoadingState /></div>;
    if (error) return <div className="p-8"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pt-6 pb-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-0.5">Document Vault</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Secure enterprise storage for MIP case files</p>
                </div>
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                    <Upload size={16} />
                    Upload Files
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StorageCard label="Total Storage" value={formatBytes(totalBytes)} used={`${caseFolders.length} folders`} icon={<HardDrive size={20} />} color="text-blue-600" bg="bg-blue-50" />
                <StorageCard label="Case Files" value={documents.length.toLocaleString()} used={thisWeek > 0 ? `${thisWeek} this week` : 'Up to date'} icon={<FileText size={20} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StorageCard label="Compliance Docs" value={complianceDocs.toLocaleString()} used="All validated" icon={<ShieldCheck size={20} />} color="text-emerald-600" bg="bg-emerald-50" />
                <StorageCard label="Case Folders" value={caseFolders.length.toLocaleString()} used="Active cases" icon={<Folder size={20} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-5 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <Home size={12} />
                        <ChevronRight size={14} />
                        <span className="text-indigo-600">Active Cases</span>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search in vault..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-[12px] font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 p-5 sm:p-10 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                    {caseFolders.length === 0 && (
                        <div className="col-span-6 flex flex-col items-center justify-center py-16 text-slate-400">
                            <Folder size={40} className="mb-3 opacity-40" />
                            <p className="text-sm font-medium">{search ? 'No folders match your search' : 'No documents found'}</p>
                        </div>
                    )}
                    {caseFolders.map((folder) => (
                        <div
                            key={folder.caseNumber}
                            className="group cursor-pointer"
                            onClick={() => folder.caseId && navigate(`/lender/case-details/${folder.caseId}`)}
                        >
                            <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                                <Folder size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <p className="text-center mt-3 text-[11px] font-bold text-slate-900 tracking-tight truncate px-2">{folder.caseNumber}</p>
                            <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{folder.files.length} File{folder.files.length !== 1 ? 's' : ''}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StorageCard({ label, value, used, icon, color, bg }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} mb-4`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tighter leading-none mb-1">{value}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full opacity-70 w-1/3 transition-all duration-500 ${
                        bg.includes('blue') ? 'bg-blue-500' :
                        bg.includes('indigo') ? 'bg-indigo-500' :
                        bg.includes('emerald') ? 'bg-emerald-500' :
                        'bg-amber-500'
                    }`} />
                </div>
                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{used}</span>
            </div>
        </div>
    );
}
