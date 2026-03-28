import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from './StatCard'
import ActionCard from './ActionCard'
import TimelineEvent from './TimelineEvent'
import { caseService } from '../../api/dataService'

const emptyStats = {
  propertyValue: 0,
  outstandingDebt: 0,
  documentsCount: 0,
  unreadMessages: 0
}

const emptyProperty = { address: '', location: '', type: '' }

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// Build a timeline from real case data fields
function buildTimeline(c) {
  const events = []
  if (c.created_at) events.push({ id: 1, type: 'submitted', title: 'Case created', date: new Date(c.created_at).toLocaleString('en-AU'), status: 'complete' })
  if (c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'APPROVED' || c.status === 'LISTED' || c.status === 'AUCTION') {
    events.push({ id: 2, type: 'submitted', title: 'Case submitted for review', date: new Date(c.updated_at || c.created_at).toLocaleString('en-AU'), status: 'complete' })
  }
  if (c.approved_at) events.push({ id: 3, type: 'message', title: 'Case approved by admin', date: new Date(c.approved_at).toLocaleString('en-AU'), status: 'complete' })
  if (c.status === 'LISTED' || c.status === 'AUCTION') events.push({ id: 4, type: 'bid', title: 'Case listed for auction', date: new Date(c.updated_at).toLocaleString('en-AU'), status: 'complete' })
  return events
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(emptyStats)
  const [nextActions, setNextActions] = useState([])
  const [timeline, setTimeline] = useState([])
  const [caseId, setCaseId] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [caseStatus, setCaseStatus] = useState('')
  const [property, setProperty] = useState(emptyProperty)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async () => {
      try {
        const res = await caseService.getMyCases()
        if (cancelled) return
        const cases = Array.isArray(res.data) ? res.data : (res.data?.items || [])
        if (cases.length > 0) {
          const c = cases[0]
          const id = c.id
          setCaseId(id)
          setCaseNumber(c.case_number || String(id).slice(0, 8))
          setCaseStatus(c.status || '')
          try { localStorage.setItem('borrowerCaseId', String(id)) } catch { /**/ }
          setStats({
            propertyValue: toNum(c.estimated_value),
            outstandingDebt: toNum(c.outstanding_debt),
            documentsCount: Array.isArray(c.documents) ? c.documents.length : 0,
            unreadMessages: 0,
          })
          setProperty({
            address: c.property_address || '',
            location: '',
            type: c.property_type || '',
          })
          setTimeline(buildTimeline(c))
        }
      } catch {
        // Network error — stay empty, don't show fake data
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>
      </div>
    )
  }

  const hasCase = Boolean(caseId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      {!hasCase ? (
        <div className="bg-white rounded-lg border border-slate-200 p-10 flex flex-col items-center text-center gap-4">
          <span className="text-5xl">🏠</span>
          <h2 className="text-lg font-semibold text-slate-900">No case yet</h2>
          <p className="text-sm text-slate-500 max-w-sm">You haven&apos;t submitted a mortgage resolution case yet. Create one to get started.</p>
          <button
            type="button"
            onClick={() => navigate('/borrower/new-case')}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            Submit New Case
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Welcome back!</h2>
              <p className="text-sm text-slate-600 mt-1">
                {property.address ? `Property: ${property.address}` : 'Your case is active.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/borrower/my-case')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center space-x-2"
              >
                <span>📁</span>
                <span>View My Case</span>
              </button>
            </div>
            <div className="text-right">
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded">
                {caseStatus || 'Active'}
              </span>
              <p className="text-sm text-slate-600 mt-2">{caseNumber || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {hasCase && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Property Value"
          value={stats.propertyValue > 0 ? `$${(stats.propertyValue / 1000).toFixed(0)}k` : '—'}
          iconType="property"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          subtext="Estimated Valuation"
        />
        <StatCard
          label="Outstanding Debt"
          value={stats.outstandingDebt > 0 ? `$${(stats.outstandingDebt / 1000).toFixed(0)}k` : '—'}
          iconType="debt"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtext="Current Balance"
        />
        <StatCard
          label="Documents"
          value={stats.documentsCount > 0 ? stats.documentsCount : '—'}
          iconType="documents"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtext="Uploaded"
        />
        <StatCard
          label="Messages"
          value={stats.unreadMessages > 0 ? stats.unreadMessages : '—'}
          iconType="messages"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          subtext="Unread"
        />
      </div>
      )}

      {hasCase && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center space-x-2">
                <span className="text-amber-500">⚠️</span>
                <h3 className="text-lg font-semibold text-slate-900">Next Actions Required</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {nextActions.length === 0 ? (
                <p className="text-sm text-slate-500">No pending actions.</p>
              ) : (
                nextActions.map((action) => (
                  <ActionCard key={action.id ?? action.title} action={action} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <h3 className="text-lg font-semibold text-slate-900">Case Timeline</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500">No timeline events yet.</p>
              ) : (
                timeline.map((event) => (
                  <TimelineEvent key={event.id ?? event.date} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {hasCase && (
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center space-x-2">
            <span>🏡</span>
            <h3 className="text-lg font-semibold text-slate-900">Your Property</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{property?.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Property Type</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{property?.type || '—'}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">ℹ️</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">What happens next?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Complete all required document uploads</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our team will review your case and property valuation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Once approved, your case will be listed for auction</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You&apos;ll be able to review and accept bids from qualified lenders</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>After accepting a bid, proceed to contract signing and settlement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
