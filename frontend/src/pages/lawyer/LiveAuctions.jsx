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
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Auctions</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1">Properties currently listed or in active auction</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-36 bg-slate-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-8 bg-slate-100 rounded" />)}
                </div>
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-slate-400 font-medium">No live auctions found</p>
          <p className="text-sm text-slate-400 mt-1">Properties will appear here once admin lists a case for auction</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => {
            const images = Array.isArray(c.property_images) ? c.property_images : []
            const image = images.length > 0 ? images[0] : null
            const debt = parseFloat(c.outstanding_debt) || 0
            const value = parseFloat(c.estimated_value) || 0
            const lvr = value > 0 ? Math.round((debt / value) * 100) : 0
            const badge = (c.auction_status && AUCTION_STATUS_LABELS[c.auction_status])
              || CASE_STATUS_LABELS[c.status]
              || { label: c.status, cls: 'bg-gray-100 text-gray-700' }

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/lawyer/auctions/${c.id}`)}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="relative h-36 flex-shrink-0">
                  <img
                    src={image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f1f5f9'/%3E%3Cpath d='M160 140V100l40-30 40 30v40z' fill='%23cbd5e1'/%3E%3Crect x='180' y='110' width='20' height='30' fill='%2394a3b8'/%3E%3C/svg%3E"}
                    alt={c.title || c.property_address}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f1f5f9'/%3E%3Cpath d='M160 140V100l40-30 40 30v40z' fill='%23cbd5e1'/%3E%3Crect x='180' y='110' width='20' height='30' fill='%2394a3b8'/%3E%3C/svg%3E" }}
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{c.title || c.property_address}</h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.property_address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] border-t border-slate-100 pt-2">
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Debt</p>
                      <p className="font-bold text-slate-800">{debt > 0 ? `$${(debt/1000).toFixed(0)}k` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Value</p>
                      <p className="font-bold text-slate-800">{value > 0 ? `$${(value/1000).toFixed(0)}k` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">LVR</p>
                      <p className="font-bold text-indigo-600">{lvr > 0 ? `${lvr}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Ref</p>
                      <p className="font-bold text-slate-500 text-[10px]">{c.case_number || String(c.id).slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/lawyer/auctions/${c.id}`) }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      Place Bid
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/lawyer/assigned-cases/${c.id}`) }}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      View Case
                    </button>
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
