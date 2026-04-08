import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardData } from './api'
import { LoadingState, ErrorState } from './components/PageState'

const StatIcons = {
  folder: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  dollar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  gavel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
}

const PlatformStatusIcons = {
  lightning: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  rocket: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  exclamation: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
}

const QuickActionIcons = {
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  gear: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export default function LawyerDashboard() {
  const navigate = useNavigate()
  const [chartRange, setChartRange] = useState('Last 7 Months')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDashboardData()
      .then((res) => {
        if (!cancelled && res.error) setError(res.error)
        if (!cancelled && res.data) setData(res.data)
      })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load dashboard') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <LoadingState message="Loading dashboard..." />
  if (error) return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); getDashboardData().then((res) => { setData(res.data); setError(res.error); }).finally(() => setLoading(false)) }} />

  const stats = data?.stats ?? []
  const platformStatus = data?.platformStatus ?? []
  const recentCases = data?.recentCases ?? []
  const recentSales = data?.recentSales ?? []
  const quickActions = data?.quickActions ?? []
  const { months = [], casesCreated = [], salesVolume = [], salesVolumeLabel = '' } = data?.monthlyOverview ?? {}
  const maxCases = casesCreated.length ? Math.max(...casesCreated) : 1
  const maxSales = salesVolume.length ? Math.max(...salesVolume) : 1

  return (
    <>
    <div className="space-y-4 pb-6 w-full min-w-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your legal case management</p>
      </div>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className={`text-xs font-medium mt-0.5 ${stat.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.trendUp ? '+' : ''}{stat.trend}%
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.description}</p>
              </div>
              <div className={`flex-shrink-0 ${
                  stat.icon === 'folder' || stat.icon === 'briefcase' ? 'text-blue-600' :
                  stat.icon === 'dollar' ? 'text-emerald-500' :
                  stat.icon === 'users' ? 'text-[#6A0DAD]' :
                  stat.icon === 'gavel' ? 'text-amber-500' : 'text-slate-500'
                }`}>
                {StatIcons[stat.icon] ?? StatIcons.briefcase}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Monthly Overview + Platform Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Monthly Overview</h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option>Last 7 Months</option>
              <option>Last 12 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="p-4">
            <div className="h-40 flex items-end gap-2">
              {months.map((month, i) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '120px' }}>
                    <div
                      className="flex-1 min-w-0 rounded-t bg-blue-600 max-h-full"
                      style={{ height: `${(casesCreated[i] / maxCases) * 100}%`, minHeight: '4px' }}
                      title={`Cases: ${casesCreated[i]}`}
                    />
                    <div
                      className="flex-1 min-w-0 rounded-t bg-green-500 max-h-full"
                      style={{ height: `${(salesVolume[i] / maxSales) * 100}%`, minHeight: '4px' }}
                      title={`Sales: A$${salesVolume[i]}M`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded bg-blue-500" /> Cases Created
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded bg-green-500" /> Sales Volume
              </span>
              <span className="text-sm font-medium text-slate-700 ml-auto">{salesVolumeLabel}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Platform Status</h3>
          </div>
          <div className="p-4 space-y-3">
            {platformStatus.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'live') navigate('/lawyer/assigned-cases')
                  if (item.id === 'pending') navigate('/admin/kyc-review')
                  if (item.id === 'completed') navigate('/lawyer/assigned-cases')
                  if (item.id === 'attention') navigate('/lawyer/notifications')
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  item.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                  item.color === 'orange' ? 'bg-amber-50 hover:bg-amber-100' :
                  item.color === 'green' ? 'bg-green-50 hover:bg-green-100' :
                  'bg-red-50 hover:bg-red-100'
                }`}
              >
                <span className={item.color === 'blue' ? 'text-blue-600' : item.color === 'orange' ? 'text-amber-600' : item.color === 'green' ? 'text-green-600' : 'text-red-600'}>
                  {PlatformStatusIcons[item.icon] ?? PlatformStatusIcons.rocket}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{item.label}:</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
                <span className={`flex-shrink-0 font-bold text-base ${
                  item.color === 'blue' ? 'text-blue-600' : item.color === 'orange' ? 'text-amber-600' : item.color === 'green' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Cases + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent Cases</h3>
            <button
              type="button"
              onClick={() => navigate('/lawyer/assigned-cases')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate('/lawyer/assigned-cases')}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{c.id}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    c.status === 'SOLD' ? 'bg-green-100 text-green-800' :
                    c.status === 'FOR SALE' || c.status === 'BUY NOW' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{c.property}</p>
                <p className="text-[10px] text-slate-400">{c.location}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold text-slate-800">{c.price}</span>
                  <span className="text-[10px] text-slate-400">{c.bids}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent Sales</h3>
            <button
              type="button"
              onClick={() => navigate('/admin/reports-analytics')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View Reports
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentSales.map((s) => (
              <button
                key={`${s.id}-${s.timeAgo}`}
                type="button"
                onClick={() => navigate('/admin/reports-analytics')}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{s.id}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800">{s.status}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{s.property}</p>
                <p className="text-[10px] text-slate-400">{s.location}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold text-slate-800">{s.price}</span>
                  <span className="text-[10px] text-slate-400">{s.timeAgo}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => navigate(action.path.startsWith('/') ? action.path : `/lawyer/${action.path}`)}
            className="bg-white rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
          >
            <div className="flex-shrink-0 text-[#1B3A6B]">
              {QuickActionIcons[action.icon]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">{action.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{action.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Help bar */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
        <p className="text-sm text-slate-500">Need assistance? Our support team is here to help.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowSupportModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">Support Resources</button>
          <button type="button" onClick={() => setShowContactModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Contact Support</button>
        </div>
      </div>
    </div>

    {/* Support Resources Modal */}
    {showSupportModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setShowSupportModal(false)}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Support Resources</h2>
            <button type="button" onClick={() => setShowSupportModal(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            <p className="text-xs text-gray-500 mb-2">Free &amp; confidential services available to you.</p>
            {[
              { name: 'National Debt Helpline',  phone: '1800 007 007', url: 'https://ndh.org.au' },
              { name: 'MoneySmart (ASIC)',        phone: null,           url: 'https://moneysmart.gov.au' },
              { name: 'AFCA Disputes',            phone: '1800 931 678', url: 'https://afca.org.au' },
              { name: 'Legal Aid NSW',            phone: null,           url: 'https://www.legalaid.nsw.gov.au' },
              { name: 'Beyond Blue',              phone: '1300 22 4636', url: 'https://beyondblue.org.au' },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p>
                  {r.phone && <p className="text-xs text-gray-500">{r.phone}</p>}
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline shrink-0 ml-3">Visit →</a>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-2">
            <button type="button" onClick={() => setShowSupportModal(false)} className="w-full py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors">Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Contact Support Modal */}
    {showContactModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setShowContactModal(false)}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Contact Support</h2>
            <button type="button" onClick={() => setShowContactModal(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="px-4 py-4 space-y-2">
            <p className="text-xs text-gray-500 mb-3">Our team typically responds within one business day.</p>
            <a href="mailto:support@briqbanq.com?subject=Lawyer%20Support" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              <div><p className="text-xs font-semibold text-gray-800">Email Support</p><p className="text-xs text-gray-500">support@briqbanq.com</p></div>
            </a>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
              <div><p className="text-xs font-semibold text-gray-800">Debt Helpline</p><p className="text-xs text-gray-500">1800 007 007 · Free &amp; confidential</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <div><p className="text-xs font-semibold text-gray-800">AFCA Disputes</p><p className="text-xs text-gray-500">1800 931 678 · afca.org.au</p></div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button type="button" onClick={() => setShowContactModal(false)} className="w-full py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors">Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
