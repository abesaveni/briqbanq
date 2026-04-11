import { useState } from "react";
import { Eye, Download, FileText, Lock, X, Info, Loader2 } from "lucide-react";
import PropTypes from 'prop-types';
import api from '../../services/api';

/**
 * DocumentsSection: Displays a list of downloadable/viewable property documents.
 * Handles authenticated downloads for backend-stored files.
 */
export default function DocumentsSection({ deal, documents: providedDocs, title = "Investment Documents", icon: Icon = FileText }) {
  // Defensive fallbacks for data stability
  const documents = Array.isArray(providedDocs) ? providedDocs : (Array.isArray(deal?.documents) ? deal.documents : []);
  const propertyImage = deal?.image || deal?.images?.[0] || null;
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const handleView = (doc) => {
    setPreviewDoc(doc);
  };

  // Authenticated download: fetches file as blob so JWT is included in the request
  const handleAuthDownload = async (doc, open = false) => {
    if (!doc.file) return;
    // If it's a plain external URL (not API), just open directly
    if (!doc.file.startsWith('/api/')) {
      window.open(doc.file, '_blank');
      return;
    }
    setDownloading(doc.id || doc.name);
    try {
      const res = await api.get(doc.file, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      if (open) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name || 'document';
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // If download fails (e.g. 404), show in preview modal so user sees the info
      setPreviewDoc(doc);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownload = async (e, doc) => {
    if (!doc.file) { e.preventDefault(); setPreviewDoc(doc); return; }
    if (doc.file.startsWith('/api/')) { e.preventDefault(); await handleAuthDownload(doc, false); return; }
    // Plain URL — let native <a download> handle it
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center py-16">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <FileText size={32} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Available</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Property documents are currently being processed. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Icon size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Lock size={12} />
          Secured
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div
            key={`${doc.name}-${index}`}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 hover:border-indigo-100 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wider">
                {String(doc.type || "PDF").toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {doc.name || "Untitled Document"}
                </p>
                <p className="text-xs text-gray-400 font-medium pt-0.5">
                  {doc.size || "Unknown size"} • Verified Data
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
              {/* VIEW BUTTON */}
              <button
                onClick={() => doc.file ? handleAuthDownload(doc, true) : handleView(doc)}
                disabled={downloading === (doc.id || doc.name)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                {downloading === (doc.id || doc.name) ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} className="text-indigo-500" />}
                View
              </button>

              {/* DOWNLOAD BUTTON */}
              <button
                onClick={(e) => handleDownload(e, doc)}
                disabled={downloading === (doc.id || doc.name)}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-90 flex items-center justify-center shadow-sm disabled:opacity-50"
              >
                {downloading === (doc.id || doc.name) ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Download size={18} className="text-indigo-600" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-indigo-50/50 rounded-2xl flex items-start gap-3 border border-indigo-100">
        <div className="mt-0.5 text-indigo-600">
          <Lock size={14} />
        </div>
        <p className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
          Disclaimer: Investment involves risk. Ensure you have reviewed all financial memoranda and disclosures before placing a bid. All downloads are monitored for compliance.
        </p>
      </div>

      {/* Document Preview Modal — shown when no file URL exists */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with property image background */}
            <div className="relative h-28 overflow-hidden">
              {propertyImage ? (
                <img src={propertyImage} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
              <div className="absolute bottom-3 left-4 right-10">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-0.5">{String(previewDoc.type || "PDF").toUpperCase()} Document</p>
                <h3 className="font-bold text-white text-[15px] truncate">{previewDoc.name || "Document"}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-indigo-50 p-2 rounded-xl">
                <FileText size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs text-gray-400 font-medium">{previewDoc.size || "Processing"} • Verified</p>
            </div>
            {previewDoc.file ? (
              <div className="space-y-3">
                <p className="text-[13px] text-slate-600 font-medium">Click the button below to open or download this document.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAuthDownload(previewDoc, true)}
                    disabled={downloading === (previewDoc.id || previewDoc.name)}
                    className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {downloading === (previewDoc.id || previewDoc.name) ? <Loader2 size={14} className="animate-spin" /> : <Info size={14} />}
                    Open Document
                  </button>
                  <button
                    onClick={() => handleAuthDownload(previewDoc, false)}
                    disabled={downloading === (previewDoc.id || previewDoc.name)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {downloading === (previewDoc.id || previewDoc.name) ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-blue-700 font-medium leading-relaxed">
                  This document is currently being processed and will be available for viewing shortly. Please check back later or contact support if the issue persists.
                </p>
              </div>
            )}
            <button
              onClick={() => setPreviewDoc(null)}
              className="mt-5 w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors active:scale-95"
            >
              Close
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DocumentsSection.propTypes = {
  deal: PropTypes.shape({
    documents: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
      size: PropTypes.string,
      file: PropTypes.string
    }))
  })
};
