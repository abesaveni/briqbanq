function fmtNum(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString()}`
}

export default function PropertyDetails({ property = {}, valuation = {} }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Property Features</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Type</p>
              <p className="text-sm font-medium text-slate-900">{property.type || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Bedrooms</p>
              <p className="text-sm font-medium text-slate-900">{property.bedrooms ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Bathrooms</p>
              <p className="text-sm font-medium text-slate-900">{property.bathrooms ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Parking</p>
              <p className="text-sm font-medium text-slate-900">{property.parking ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Land Size</p>
              <p className="text-sm font-medium text-slate-900">
                {property.landSize != null ? `${property.landSize} m²` : '—'}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Valuation</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Current Value</p>
              <p className="text-sm font-medium text-slate-900">{fmtNum(valuation.currentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Valuation Date</p>
              <p className="text-sm font-medium text-slate-900">{valuation.valuationDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Valuer</p>
              <p className="text-sm font-medium text-slate-900">{valuation.valuer || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Method</p>
              <p className="text-sm font-medium text-slate-900">{valuation.method || '—'}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Location</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Suburb</p>
              <p className="text-sm font-medium text-slate-900">{property.suburb || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">State</p>
              <p className="text-sm font-medium text-slate-900">{property.state || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Postcode</p>
              <p className="text-sm font-medium text-slate-900">{property.postcode || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">CBD Distance</p>
              <p className="text-sm font-medium text-slate-900">{property.cbdDistance || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
