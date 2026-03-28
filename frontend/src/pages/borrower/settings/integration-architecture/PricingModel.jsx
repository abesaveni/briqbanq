export default function PricingModel({ pricing = {}, coreModules = [] }) {
  const specialized = pricing.specialized || {}
  const bundles = pricing.bundles || {}
  const bundleEntries = [
    { key: 'small', ...bundles.small },
    { key: 'mid', ...bundles.mid },
    { key: 'enterprise', ...bundles.enterprise },
  ].filter((b) => b.name)

  return (
    <div
      className="border border-green-200 rounded-lg p-6 mb-8"
      style={{ backgroundColor: '#F0FDF4' }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">💰</span>
        <h2 className="text-lg font-semibold text-slate-900">Pricing & Licensing Model</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Specialized Modules</h3>

          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700">Base Price</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">
              ${specialized.basePrice ?? 199}
            </p>
            <p className="text-xs text-slate-600">Per module, per month.</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Includes:</p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>Module-specific functionality</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>Isolated contacts & documents (module-isolated)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>Simple time tracking</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-500">✓</span>
                <span>Limited audit</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Core Add-On Modules</h3>

          <div className="space-y-4">
            {coreModules.map((mod) => (
              <div key={mod.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">{mod.name}</h4>
                  <span
                    className={`text-base font-bold ${mod.price === 0 ? 'text-emerald-600' : 'text-indigo-600'}`}
                  >
                    {mod.price === 0 ? 'FREE' : `$${mod.price}`}
                  </span>
                </div>
                <ul className="space-y-0.5 text-xs text-slate-600">
                  {(mod.features || []).slice(0, 2).map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {bundleEntries.length > 0 && (
        <div className="mt-6 pt-6 border-t border-green-300">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <span>💸</span>
            <span>Example Bundle Pricing</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bundleEntries.map((b) => (
              <div key={b.key} className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-1">{b.name}</p>
                <p className="text-lg font-bold text-slate-900 mb-2">${b.price?.toLocaleString()}{b.period}</p>
                {b.includes && (
                  <p className="text-xs text-slate-600">{b.includes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
