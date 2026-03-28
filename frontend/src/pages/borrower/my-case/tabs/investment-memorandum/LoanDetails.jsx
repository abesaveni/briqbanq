function fmtNum(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString()}`
}

export default function LoanDetails({ financials = {}, defaultStatus = {} }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Loan Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Original Loan Amount</span>
              <span className="text-sm font-medium text-slate-900">{fmtNum(financials.originalLoanAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Outstanding Principal</span>
              <span className="text-sm font-medium text-slate-900">{fmtNum(financials.outstandingDebt)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Original Interest Rate</span>
              <span className="text-sm font-medium text-slate-900">
                {financials.originalInterestRate != null ? `${financials.originalInterestRate}% p.a.` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200 bg-amber-50">
              <span className="text-sm text-slate-600">Default Rate</span>
              <span className="text-sm font-bold text-amber-700">
                {financials.defaultRate != null ? `${financials.defaultRate}% p.a.` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Loan to Value Ratio</span>
              <span className="text-sm font-medium text-slate-900">
                {financials.ltvRatio != null ? `${financials.ltvRatio}%` : '—'}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Default Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Days in Default</span>
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded bg-red-100 text-red-700">
                {defaultStatus.daysInDefault != null ? `${defaultStatus.daysInDefault} days` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Days in Arrears</span>
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded bg-red-100 text-red-700">
                {defaultStatus.daysInArrears != null ? `${defaultStatus.daysInArrears} days` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Arrears Amount</span>
              <span className="text-sm font-medium text-slate-900">{fmtNum(defaultStatus.arrearsAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Missed Payments</span>
              <span className="text-sm font-medium text-slate-900">{defaultStatus.missedPayments ?? '—'}</span>
            </div>
            {defaultStatus.note && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-slate-700">
                  <strong>Note:</strong> {defaultStatus.note}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
