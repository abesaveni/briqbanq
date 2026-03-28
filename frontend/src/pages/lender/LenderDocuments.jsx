import React, { useState } from 'react';
import {
    Folder, FileText, Search, Upload, MoreVertical,
    HardDrive, Download, Trash2, ShieldCheck, ChevronRight
} from "lucide-react";

export default function LenderDocuments() {
    return (
        <div className="space-y-6 animate-fade-in pt-6 pb-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-0.5">Document Vault</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Secure enterprise storage for MIP case files</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                        <Upload size={16} strokeWidth={3} />
                        Upload Files
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StorageCard label="Total Storage" value="45.2 GB" used="12.4 GB" icon={<HardDrive size={20} />} color="text-blue-600" bg="bg-blue-50" />
                <StorageCard label="Case Files" value="1,240" used="Updated just now" icon={<FileText size={20} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StorageCard label="Compliance Docs" value="856" used="All validated" icon={<ShieldCheck size={20} />} color="text-emerald-600" bg="bg-emerald-50" />
                <StorageCard label="Archived" value="45" used="Last 2 years" icon={<Folder size={20} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-5 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Root</span>
                        <ChevronRight size={14} />
                        <span className="text-indigo-600">Active Cases</span>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search in vault..."
                            className="w-full pl-11 pr-5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-[12px] font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 p-5 sm:p-10 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="group cursor-pointer">
                            <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                                <Folder size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <p className="text-center mt-3 text-[11px] font-black text-slate-900 tracking-tight truncate px-2">Case MIP-2026-00{i}</p>
                            <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">14 Files</p>
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
            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">{value}</p>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full opacity-70 w-1/3 transition-all duration-500 ${bg.includes('blue') ? 'bg-blue-500' :
                                bg.includes('indigo') ? 'bg-indigo-500' :
                                    bg.includes('emerald') ? 'bg-emerald-500' :
                                        'bg-amber-500'
                            }`}
                    ></div>
                </div>
                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{used}</span>
            </div>
        </div>
    );
}

