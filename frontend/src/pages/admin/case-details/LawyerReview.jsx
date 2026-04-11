// src/pages/admin/case-details/LawyerReview.jsx
import { useCaseContext } from '../../../context/CaseContext'
import LawyerReviewPanel from '../../../components/common/LawyerReviewPanel'

export default function LawyerReview() {
    const { caseData } = useCaseContext()
    if (!caseData) return null
    return (
        <div className="space-y-4">
            <LawyerReviewPanel caseItem={caseData} />
        </div>
    )
}
