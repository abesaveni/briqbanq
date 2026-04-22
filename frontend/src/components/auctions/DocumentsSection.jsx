import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Download, FileText, Lock, X, ExternalLink, Loader2, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import PropTypes from 'prop-types';
import api from '../../services/api';

export default function DocumentsSection({ deal, documents: providedDocs, title = "Investment Documents", icon: Icon = FileText }) {
  const documents = Array.isArray(providedDocs) ? providedDocs : (Array.isArray(deal?.documents) ? deal.documents : []);
  const propertyImage = deal?.image || deal?.images?.[0] || null;

  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const openModal = (doc) => {
    setPreviewDoc(doc);
    setDownloadError(null);
  };

  const closeModal = () => {
    setPreviewDoc(null);
    setDownloadError(null);
  };

  const handleAuthDownload = async (doc, open = false) => {
    if (!doc.file) {
      openModal(doc);
      return;
    }

    // Direct URL (not API) — open straight away
    if (!doc.file.startsWith('/api/')) {
      if (open) {
        window.open(doc.file, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = doc.file;
        a.download = doc.name || 'document';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    setDownloading(doc.id || doc.name);
    setDownloadError(null);
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // If modal is open, show error message inside it; otherwise open the modal
      if (previewDoc) {
        setDownloadError('Unable to load this document. The file may be unavailable.');
      } else {
        openModal(doc);
        // Try fallback direct URL if different from API URL
        if (doc.file_url && doc.file_url !== doc.file) {
          try {
            if (open) window.open(doc.file_url, '_blank');
            else {
              const a = document.createElement('a');
              a.href = doc.file_url;
              a.download = doc.name || 'document';
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } catch { /* ignore fallback failure */ }
        }
      }
    } finally {
      setDownloading(null);
    }
  };

  const fileTypeColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('image') || t.includes('photo')) return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500' };
    if (t.includes('pdf')) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' };
    if (t.includes('legal') || t.includes('contract')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' };
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-500' };
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-100">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
            <p className="text-[11px] text-gray-400 font-medium">{documents.length} document{documents.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <Shield size={11} />
          Secured
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {documents.map((doc, index) => {
          const colors = fileTypeColor(doc.type);
          const isLoading = downloading === (doc.id || doc.name);
          return (
            <div
              key={`${doc.name}-${index}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
            >
              {/* Type badge */}
              <div className={`shrink-0 w-11 h-11 ${colors.bg} ${colors.border} border rounded-xl flex flex-col items-center justify-center`}>
                <FileText size={16} className={colors.text} />
                <span className={`text-[8px] font-black uppercase ${colors.text} mt-0.5`}>
                  {String(doc.type || "DOC").split(' ')[0].slice(0, 4)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                  {doc.name || "Untitled Document"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  <p className="text-[11px] text-gray-400 font-medium">
                    {doc.size || "—"} &bull; Verified
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => doc.file ? handleAuthDownload(doc, true) : openModal(doc)}
                  disabled={isLoading}
                  title="View document"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                  View
                </button>
                <button
                  onClick={() => handleAuthDownload(doc, false)}
                  disabled={isLoading}
                  title="Download document"
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-gray-500 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="p-3.5 bg-slate-50 rounded-xl flex items-start gap-2.5 border border-slate-100">
        <Lock size={12} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          All documents are encrypted and access is monitored for compliance. Review all disclosures before placing a bid.
        </p>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image header */}
            <div className="relative h-28 overflow-hidden">
              {propertyImage ? (
                <img src={propertyImage} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide mb-1 ${fileTypeColor(previewDoc.type).bg} ${fileTypeColor(previewDoc.type).text}`}>
                  {String(previewDoc.type || 'Document').toUpperCase()}
                </span>
                <h3 className="font-bold text-white text-[12px] leading-tight truncate">
                  {previewDoc.name || "Document"}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Meta */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <FileText size={11} className="text-indigo-400" />
                  {previewDoc.size || "—"}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                  <CheckCircle2 size={11} />
                  Verified
                </div>
              </div>

              {/* Error banner */}
              {downloadError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-red-700 font-medium leading-snug">{downloadError}</p>
                </div>
              )}

              {previewDoc.file ? (
                <>
                  {!downloadError && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      Open in a new tab or download to your device.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAuthDownload(previewDoc, true)}
                      disabled={downloading === (previewDoc.id || previewDoc.name)}
                      className="flex-1 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {downloading === (previewDoc.id || previewDoc.name)
                        ? <Loader2 size={12} className="animate-spin" />
                        : <ExternalLink size={12} />}
                      Open
                    </button>
                    <button
                      onClick={() => handleAuthDownload(previewDoc, false)}
                      disabled={downloading === (previewDoc.id || previewDoc.name)}
                      className="flex-1 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {downloading === (previewDoc.id || previewDoc.name)
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Download size={12} />}
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 font-medium leading-snug">
                    This document is being processed and will be available shortly.
                  </p>
                </div>
              )}

              <button
                onClick={closeModal}
                className="w-full py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

DocumentsSection.propTypes = {
  deal: PropTypes.shape({
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    documents: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
      size: PropTypes.string,
      file: PropTypes.string,
      file_url: PropTypes.string,
    }))
  }),
  documents: PropTypes.array,
  title: PropTypes.string,
  icon: PropTypes.elementType,
};
