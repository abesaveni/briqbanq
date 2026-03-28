export default function HeaderControls({ onEdit, onPrint, onDownload }) {
  return (
    <div className="flex items-center justify-end space-x-3 mb-6 no-print">
      <button
        type="button"
        onClick={onEdit}
        className="border border-slate-300 bg-white text-slate-700 text-sm px-4 py-2 rounded hover:bg-slate-50 flex items-center space-x-2"
      >
        <span>✏️</span>
        <span>Edit</span>
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="border border-slate-300 bg-white text-slate-700 text-sm px-4 py-2 rounded hover:bg-slate-50 flex items-center space-x-2"
      >
        <span>🖨️</span>
        <span>Print</span>
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded flex items-center space-x-2"
      >
        <span>📥</span>
        <span>Download PDF</span>
      </button>
    </div>
  )
}
