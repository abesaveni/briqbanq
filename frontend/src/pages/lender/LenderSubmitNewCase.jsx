import { useNavigate } from 'react-router-dom'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'

export default function LenderSubmitNewCase() {
  const navigate = useNavigate()
  return (
    <SubmitCaseForm
      role="lender"
      onSuccess={() => navigate('/lender/my-cases')}
      onClose={() => navigate('/lender/my-cases')}
    />
  )
}
