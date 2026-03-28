// src/pages/admin/case-details/Activity.jsx
import { useCaseContext } from '../../../context/CaseContext'
import CaseActivityLog from '../../../components/common/CaseActivityLog'

export default function Activity() {
    const { caseData } = useCaseContext()
    return <CaseActivityLog caseId={caseData?._id} />
}
