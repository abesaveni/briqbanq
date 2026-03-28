export default function TopInfoBoxes() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Cross-Sell Opportunity */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-emerald-600 text-lg">✓</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Cross-Sell Opportunity</h3>
            <p className="text-xs text-slate-700">CRM identifies future opportunities</p>
          </div>
        </div>
      </div>

      {/* Unified Search */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-lg">🔍</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Unified Search</h3>
            <p className="text-xs text-slate-700">Find any record across all modules instantly</p>
          </div>
        </div>
      </div>

      {/* Without Add-Ons */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-slate-600 text-lg">⚠</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Without Add-Ons</h3>
            <ul className="text-xs text-slate-700 space-y-0.5 mt-1">
              <li>• Contact must be entered separately in Trust and Settlement</li>
              <li>• Documents stored in each module separately</li>
              <li>• Time tracked per module, manual consolidation needed</li>
              <li>• No cross-module insights or relationship tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cost vs. Efficiency */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-amber-600 text-lg">💰</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Cost vs. Efficiency</h3>
            <div className="text-xs text-slate-700 space-y-1 mt-1">
              <p>Total add-on cost: $377/month</p>
              <p>Time saved per month: ~80 hours</p>
              <p className="font-semibold">$100/hour billing: $4,000 saved = 10.0x return</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
