import { useState, useEffect } from 'react'
import { casesService } from '../../../../api/dataService'
import LawyerReviewPanel from '../../../../components/common/LawyerReviewPanel'
import { Loader2 } from 'lucide-react'

export default function LawyerReviewTab({ caseId, caseItem: propCaseItem }) {
  const [caseItem, setCaseItem] = useState(propCaseItem || null)
  const [loading, setLoading] = useState(!propCaseItem)

  useEffect(() => {
    if (propCaseItem) { setCaseItem(propCaseItem); return }
    if (!caseId) return
    setLoading(true)
    casesService.getCaseById(caseId)
      .then(res => { if (res?.success) setCaseItem(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [caseId, propCaseItem])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading legal review…</span>
      </div>
    )
  }

  return <LawyerReviewPanel caseItem={caseItem} />
}
