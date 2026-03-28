import RiskBadge from './RiskBadge'
import StatusBadge from './StatusBadge'

export default function CaseCard({ case: c, onView, onStatusChange }) {
  if (!c) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">{c.caseNumber}</span>
        <StatusBadge status={c.status} />
      </div>
      <p className="text-sm text-gray-700">{c.borrower}</p>
      <p className="text-sm text-gray-500">{c.property}</p>
      <p className="text-sm font-medium text-gray-900">{c.debt}</p>
      <div className="flex items-center justify-between pt-2">
        <RiskBadge risk={c.risk} />
        <span className="text-xs text-gray-500">{c.created}</span>
      </div>
      {onStatusChange && (
        <select
          value={c.status}
          onChange={(e) => onStatusChange(c.id, e.target.value)}
          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="In Progress">In Progress</option>
          <option value="In Auction">In Auction</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      )}
      {onView && (
        <button
          type="button"
          onClick={() => onView(c.id)}
          className="w-full mt-2 py-2 text-sm font-medium text-[#6366F1] hover:bg-gray-50 rounded-lg"
        >
          View
        </button>
      )}
    </div>
  )
}
