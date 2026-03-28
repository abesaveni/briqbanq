export default function TechnicalImplementation() {
  const dbOptions = [
    'contacts_unified - Single source of truth for all contacts',
    'documents_global - Shared document repository',
    'time_entries_global - Cross-module time tracking',
    'organization_config - Centralized settings',
  ]

  return (
    <div
      className="border border-blue-200 rounded-lg p-6 mb-8"
      style={{ backgroundColor: '#EFF6FF' }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🔧</span>
        <h2 className="text-lg font-semibold text-slate-900">Technical Implementation</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-3">Shared Database Layer</h3>

          <div className="space-y-2 mb-4">
            {dbOptions.map((label, i) => (
              <label key={i} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-slate-300" defaultChecked readOnly />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Module-Specific Tables</p>
            <p className="text-sm text-slate-600">
              Each specialized module has its own tables (cases, trusts, settlements, etc.), but linked to
              centralized shared tables via foreign keys.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-emerald-500">✅</span>
              <h3 className="text-base font-semibold text-slate-900">API & Service Integration</h3>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Microservice Architecture</li>
              <li>• CRM Service API - Responsive endpoints</li>
              <li>• Document Service API - Independent storage</li>
              <li>• Time Service API - Standalone endpoints</li>
              <li>• Admin Service API - Independent endpoints</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span>🏁</span>
              <h3 className="text-base font-semibold text-slate-900">Feature Flag System</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Grow includes has feature-flagged implementation. UI components detect modules and drive
              CRM/Document/Time features
            </p>
            <div className="bg-white rounded border border-slate-200 p-3 mt-2">
              <code className="text-xs text-slate-700 block">
                <div>if (modules.includes(&apos;grow-crm&apos;)) {'{'}</div>
                <div className="ml-4">// CRM UI things available</div>
                <div>{'}'}</div>
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
