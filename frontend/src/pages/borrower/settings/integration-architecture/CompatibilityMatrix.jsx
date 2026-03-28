export default function CompatibilityMatrix({ matrix = {}, specializedModules = [] }) {
  const modules = matrix.modules || []
  const coreModules = matrix.coreModules || ['Grow CRM', 'Grow Documents', 'Grow Time', 'Grow HQ']

  const getCategory = (name) => {
    const found = specializedModules.find((m) => m.name === name)
    return found ? found.category : 'Module description'
  }

  if (modules.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Module Compatibility Matrix</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-sm font-medium text-slate-600 px-4 py-3">Specialized Module</th>
              {coreModules.map((core) => (
                <th key={core} className="text-center text-sm font-medium text-slate-600 px-4 py-3">
                  {core}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {modules.map((moduleName) => (
              <tr key={moduleName} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{moduleName}</p>
                    <p className="text-xs text-slate-500">{getCategory(moduleName)}</p>
                  </div>
                </td>
                {coreModules.map((core) => (
                  <td key={core} className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 text-sm">✓</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="text-slate-600">🔢</span>
          <span className="text-sm text-slate-600">10 Integrations Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-emerald-500">✅</span>
          <span className="text-sm text-slate-600">Passes Minimum Build</span>
        </div>
      </div>
    </div>
  )
}
