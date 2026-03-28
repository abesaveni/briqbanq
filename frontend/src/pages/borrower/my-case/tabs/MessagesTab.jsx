import { useAuth } from '../../../../context/AuthContext'
import CaseChat from '../../../../components/common/CaseChat'

export default function MessagesTab({ caseId }) {
  const { user } = useAuth()
  return (
    <CaseChat
      caseId={caseId}
      currentUser={{ name: user?.name, role: 'Borrower' }}
    />
  )
}
