export default function PlatformArchitecture() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">📐</span>
        <h2 className="text-lg font-semibold text-slate-900">Platform Architecture Model</h2>
      </div>

      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Integration Philosophy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Shared Services</h4>
            <p className="text-xs text-slate-600">
              Core modules provide shared functionality that all specialized modules can leverage.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Opt-in Model</h4>
            <p className="text-xs text-slate-600">
              Operators only pay for what they need. Add-ons enhance capabilities without forcing adoption.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Data Unification</h4>
            <p className="text-xs text-slate-600">
              When enabled, core modules unify data across specialized modules for enterprise insights.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Without Core Add-Ons</h4>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>• Each module has isolated contacts, documents, and time tracking</li>
            <li>• Module-specific data silos with basic functionality</li>
            <li>• Manual cross-module workflows and data entry</li>
          </ul>
        </div>

        <div className="bg-white border-2 border-emerald-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">With Core Add-Ons Enabled</h4>
          <ul className="space-y-1 text-xs text-slate-600">
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Unified contact database accessible from every module</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Enterprise document repository with smart search</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Organization-wide time tracking and automated billing</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Centralized management console for all modules</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
