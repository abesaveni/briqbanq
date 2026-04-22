import { useNavigate } from 'react-router-dom'
import SubmitCaseForm from '../../components/case/SubmitCaseForm'

export default function InvestorSubmitNewCase() {
  const navigate = useNavigate()
  return (
    <SubmitCaseForm
      role="investor"
      onSuccess={() => navigate('/investor/dashboard')}
      onClose={() => navigate('/investor/dashboard')}
    />
  )
}
