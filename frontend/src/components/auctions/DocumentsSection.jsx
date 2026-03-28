import { Eye, Download, FileText, Lock } from "lucide-react";
import PropTypes from 'prop-types';
import { generateBrandedPDF } from "../../utils/pdfGenerator";

/**
 * DocumentsSection: Displays a list of downloadable/viewable property documents.
 * Refactored for production with proper fallbacks and backend-ready structures.
 */
export default function DocumentsSection({ deal, documents: providedDocs, title = "Investment Documents", icon: Icon = FileText }) {
  // Defensive fallbacks for data stability
  const documents = Array.isArray(providedDocs) ? providedDocs : (Array.isArray(deal?.documents) ? deal.documents : []);

  const handleView = (doc) => {
    if (doc.file) {
      window.open(doc.file, "_blank");
    } else {
      generateBrandedPDF({
        title: doc.name || "Investment Document",
        subtitle: deal?.title || deal?.address || "",
        sections: [{ heading: "Document Details", body: `This document (${doc.name || "Untitled"}) is currently being processed and will be available for download shortly.` }],
      });
    }
  };

  const handleDownload = async (e, doc) => {
    if (doc.file) return; // let native <a download> handle it
    e.preventDefault();
    generateBrandedPDF({
      title: doc.name || "Investment Document",
      subtitle: deal?.title || deal?.address || "",
      sections: [{ heading: "Document Details", body: `This document (${doc.name || "Untitled"}) is currently being processed and will be available for download shortly.` }],
    });
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
                onClick={() => handleView(doc)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-95 shadow-sm"
              >
                <Eye size={16} className="text-indigo-500" />
                View
              </button>

              {/* DOWNLOAD BUTTON */}
              <a
                href={doc.file || "#"}
                download
                onClick={(e) => handleDownload(e, doc)}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-200 transition-all active:scale-90 flex items-center justify-center shadow-sm"
              >
                <Download size={18} className="text-indigo-600" />
              </a>
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
