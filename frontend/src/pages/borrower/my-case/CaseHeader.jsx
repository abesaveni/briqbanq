export default function CaseHeader({ caseId, status, riskLevel, property, borrower, lender, outstandingDebt, propertyValuation, onExportReport, onManageCase }) {
  const propertyAddress = property?.address
    ? [property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(', ') ||
      `${property.address}${property.location ? `, ${property.location}` : ''}`
    : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {status && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-purple-600 text-white uppercase tracking-wider">
                {status}
              </span>
            )}
            {riskLevel && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-amber-400 text-amber-900 uppercase tracking-wider">
                {riskLevel}
              </span>
            )}
          </div>
          {propertyAddress && (
            <p className="text-lg font-medium text-gray-900 leading-tight">{propertyAddress}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportReport}
            className="border border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Export Report
          </button>
          <button
            type="button"
            onClick={onManageCase}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Manage Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-500">Borrower</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">{borrower || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Lender</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">{lender || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Outstanding Debt</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">
            {outstandingDebt ? `$${Number(outstandingDebt).toLocaleString()}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Property Valuation</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">
            {propertyValuation ? `$${Number(propertyValuation).toLocaleString()}` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
