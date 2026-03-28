import { useNavigate } from 'react-router-dom'

export default function ActionCard({ action }) {
  const navigate = useNavigate()

  const title = action?.title ?? action?.name ?? ''
  const dueDate = action?.dueDate ?? action?.due_date ?? ''
  const status = action?.status ?? 'pending'
  const actionLabel = action?.action ?? (status === 'complete' ? null : 'Start')

  const handleStart = () => {
    if (title.includes('identity')) {
      navigate('/borrower/identity-verification')
    } else if (title.includes('valuation') || title.includes('auction')) {
      navigate('/borrower/my-case')
    } else {
      navigate('/borrower/my-case')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {status === 'complete' ? (
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 border-2 border-amber-500 rounded-full"></div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{dueDate}</p>
        </div>
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={handleStart}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
