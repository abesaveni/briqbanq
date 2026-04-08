import { useAuth } from '../../../../context/AuthContext'
import CaseBidPanel from '../../../../components/common/CaseBidPanel'

export default function BidsTab({ caseId }) {
  const { user } = useAuth()
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Bid History</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-amber-800">
          Bid acceptance is managed by the Lender or Admin. You will be notified once a bid has been accepted.
        </p>
      </div>
      <CaseBidPanel
        caseId={caseId}
        canBid={false}
        canClose={false}
        currentUser={{ name: user?.name, role: 'Borrower' }}
      />
    </div>
  )
}
