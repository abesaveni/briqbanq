import ActivityTab from './ActivityTab'

export default function OverviewTab({ caseData }) {
  if (!caseData) {
    return <p className="text-sm text-slate-500">No case data available.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Summary - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Case Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Case Created</span>
                <span className="text-sm font-medium text-slate-900">{caseData.created || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Last Updated</span>
                <span className="text-sm font-medium text-slate-900">{caseData.lastUpdated || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Status</span>
                <span className="text-sm font-medium text-slate-900">{caseData.status || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Tasks Received</span>
                <span className="text-sm font-medium text-slate-900">
                  {caseData.tasksReceived ? `${caseData.tasksReceived} tasks received` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Current Highest Bid</span>
                <span className="text-sm font-medium text-indigo-600">
                  {caseData.currentHighestBid ? `$${Number(caseData.currentHighestBid).toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview - Right Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Overview</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-600">Property Valuation</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {caseData.propertyValuation ? `$${Number(caseData.propertyValuation).toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Outstanding Debt</span>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {caseData.outstandingDebt ? `$${Number(caseData.outstandingDebt).toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <span className="text-sm text-slate-600">Equity Available</span>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {caseData.equityAvailable ? `$${Number(caseData.equityAvailable).toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <span className="text-sm text-slate-600">Minimum Bid</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {caseData.minimumBid ? `$${Number(caseData.minimumBid).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <ActivityTab caseId={caseData.id || caseData._id} />
      </div>
    </div>
  )
}
