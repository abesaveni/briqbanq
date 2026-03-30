import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { casesService } from '../../api/dataService'

function resolveImageUrl(url) {
  if (!url) return null
  return url
}

const AUCTION_STATUS_LABELS = {
  LIVE: { label: 'Live Auction', cls: 'bg-red-100 text-red-700' },
  SCHEDULED: { label: 'Coming Soon', cls: 'bg-amber-100 text-amber-700' },
  PAUSED: { label: 'Paused', cls: 'bg-gray-100 text-gray-700' },
  ENDED: { label: 'Ended', cls: 'bg-slate-100 text-slate-700' },
}
const CASE_STATUS_LABELS = {
  LISTED: { label: 'Listed', cls: 'bg-indigo-100 text-indigo-700' },
  AUCTION: { label: 'In Auction', cls: 'bg-orange-100 text-orange-700' },
}

export default function LiveAuctions() {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await casesService.getLiveListings()
        if (res.success) {
          const raw = Array.isArray(res.data) ? res.data : (res.data?.items || [])
          setCases(raw)
        }
      } catch { /* stay empty */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return cases
    const q = search.toLowerCase()
    return cases.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.property_address?.toLowerCase().includes(q) ||
      c.case_number?.toLowerCase().includes(q)
    )
  }, [cases, search])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Live Auctions</h1>
        <p className="text-sm text-slate-500 mt-1">Properties currently listed or in active auction</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by address, case number..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-slate-400 font-medium">No live auctions found</p>
          <p className="text-sm text-slate-400 mt-1">Properties will appear here once admin lists a case for auction</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => {
            const images = Array.isArray(c.property_images) ? c.property_images : []
            const image = images.length > 0 ? resolveImageUrl(images[0]) : null
            const debt = parseFloat(c.outstanding_debt) || 0
            const value = parseFloat(c.estimated_value) || 0
            const lvr = value > 0 ? Math.round((debt / value) * 100) : 0
            const badge = (c.auction_status && AUCTION_STATUS_LABELS[c.auction_status])
              || CASE_STATUS_LABELS[c.status]
              || { label: c.status, cls: 'bg-gray-100 text-gray-700' }

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/lawyer/assigned-cases/${c.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="relative h-48 bg-gray-100">
                  {image ? (
                    <img src={image} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 truncate">{c.title || c.property_address}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.property_address}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Debt</p>
                      <p className="text-sm font-bold text-slate-800">
                        {debt > 0 ? `$${(debt / 1000).toFixed(0)}k` : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Value</p>
                      <p className="text-sm font-bold text-slate-800">
                        {value > 0 ? `$${(value / 1000).toFixed(0)}k` : '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">LVR</p>
                      <p className="text-sm font-bold text-slate-800">{lvr > 0 ? `${lvr}%` : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-gray-100">
                    <span>{c.case_number || String(c.id).slice(0, 8)}</span>
                    <span className="text-blue-600 font-medium">View Case →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
