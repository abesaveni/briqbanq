import { useAuth } from '../../../../context/AuthContext'
import CaseBidPanel from '../../../../components/common/CaseBidPanel'

export default function BidsTab({ caseId }) {
  const { user } = useAuth()
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid History</h3>
      <CaseBidPanel
        caseId={caseId}
        canBid={false}
        canClose={true}
        currentUser={{ name: user?.name, role: 'Borrower' }}
      />
    </div>
  )
}
