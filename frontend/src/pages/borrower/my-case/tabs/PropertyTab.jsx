import { useState } from 'react'

function Spinner({ value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors text-lg leading-none select-none"
      >
        −
      </button>
      <span className="w-8 text-center text-base font-semibold text-gray-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors text-lg leading-none select-none"
      >
        +
      </button>
    </div>
  )
}

export default function PropertyTab({ data, valuation }) {
  const [bedrooms,  setBedrooms]  = useState(data?.bedrooms  ?? 2)
  const [bathrooms, setBathrooms] = useState(data?.bathrooms ?? 2)
  const [parking,   setParking]   = useState(data?.parking   ?? 1)
  const [saved, setSaved] = useState(false)

  if (!data) {
    return <p className="text-sm text-slate-500">No property data available.</p>
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">

      {/* Property Details card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">Property Details</h3>
        </div>

        {/* Address row */}
        <div className="flex items-start gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-32 flex-shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Address</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{data.address || '—'}</p>
            {data.location && (
              <p className="text-xs text-gray-500 mt-0.5">{data.location}</p>
            )}
          </div>
        </div>

        {/* Property type row */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-32 flex-shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</p>
          </div>
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {data.type || '—'}
            </span>
          </div>
        </div>

        {/* Features section header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Features</p>
        </div>

        {/* Bedrooms spinner */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-32 flex-shrink-0 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
            </svg>
            <p className="text-sm text-gray-600">Bedrooms</p>
          </div>
          <div className="flex-1">
            <Spinner value={bedrooms} onChange={setBedrooms} min={0} max={20} />
          </div>
        </div>

        {/* Bathrooms spinner */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-32 flex-shrink-0 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h.01M8 11h.01M12 7h.01M12 11h.01M16 7h.01M16 11h.01M3 15h18M3 19h18M21 5H3" />
            </svg>
            <p className="text-sm text-gray-600">Bathrooms</p>
          </div>
          <div className="flex-1">
            <Spinner value={bathrooms} onChange={setBathrooms} min={0} max={20} />
          </div>
        </div>

        {/* Parking spinner */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-32 flex-shrink-0 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 12h8M7 7h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">Parking</p>
          </div>
          <div className="flex-1">
            <Spinner value={parking} onChange={setParking} min={0} max={10} />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Saved successfully
          </span>
        )}
      </div>

      {/* Valuation card */}
      {valuation && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Valuation</h3>
          </div>

          {/* Valuation amount */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-green-50">
            <div className="w-36 flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Valuation Amount</p>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                {valuation.amount ? `$${Number(valuation.amount).toLocaleString()}` : '—'}
              </p>
            </div>
          </div>

          {/* Valuation date */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
            <div className="w-36 flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Valuation Date</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{valuation.date || '—'}</p>
            </div>
          </div>

          {/* Valuer */}
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="w-36 flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Valuer</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{valuation.valuer || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
