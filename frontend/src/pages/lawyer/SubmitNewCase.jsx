import { useNavigate } from 'react-router-dom'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'

export default function SubmitNewCase({ onClose, onSuccess }) {
  const navigate = useNavigate()
  const handleClose = onClose || (() => navigate('/lawyer/assigned-cases'))
  const handleSuccess = (caseId) => {
    onSuccess?.()
    onClose ? onClose() : navigate('/lawyer/assigned-cases')
  }
  return (
    <SubmitCaseForm
      role="lawyer"
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  )
}
