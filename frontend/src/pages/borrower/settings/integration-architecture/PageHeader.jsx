import { Link } from 'react-router-dom'

export default function PageHeader() {
  return (
    <div className="mb-6">
      <Link
        to="/borrower/settings"
        className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 mb-4 inline-flex"
      >
        <span>←</span>
        <span>Back to Grow HQ</span>
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integration Architecture</h1>
          <p className="text-sm text-slate-500 mt-1">How core add-on modules integrate with specialized modules</p>
        </div>
        <div className="border border-indigo-200 bg-indigo-50 rounded-lg px-4 py-2">
          <p className="text-sm font-medium text-indigo-900">
            8 Specialized Modules + 4 Core Add-Ons = Unified Platform
          </p>
        </div>
      </div>
    </div>
  )
}
