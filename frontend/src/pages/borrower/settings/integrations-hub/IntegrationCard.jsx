/**
 * Single integration card. Status, type, usedBy, cost and actions driven by props.
 * Handlers are placeholders for backend (connect, configure, manage, etc.).
 */
export default function IntegrationCard({
  integration,
  onConnect,
  onConfigure,
  ...rest
}) {
  void rest // onManage, onDisconnect reserved for future use
  const {
    name,
    description,
    icon,
    status,
    isRequired,
    type,
    usedBy = [],
    cost,
  } = integration

  const isConnected = status === 'connected' || status === 'required' || (status === 'pending' && isRequired)
  const isRequiredBadge = isRequired === true
  const showConnect = status === 'not_connected' || status === 'error'
  const showConfigure = isConnected || status === 'pending'

  const statusBadgeClass = {
    connected: 'bg-emerald-600 text-white',
    not_connected: 'bg-slate-200 text-slate-700',
    required: 'bg-emerald-600 text-white',
    pending: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
  }[status] || 'bg-slate-200 text-slate-700'

  const typeBadgeColors = {
    Payment: 'bg-blue-100 text-blue-800',
    Accounting: 'bg-purple-100 text-purple-800',
    Banking: 'bg-indigo-100 text-indigo-800',
    Communication: 'bg-cyan-100 text-cyan-800',
    Document: 'bg-amber-100 text-amber-800',
    Storage: 'bg-blue-100 text-blue-800',
    Identity: 'bg-red-100 text-red-800',
    Credit: 'bg-amber-100 text-amber-800',
    Property: 'bg-pink-100 text-pink-800',
    Registry: 'bg-slate-100 text-slate-700',
    Auth: 'bg-purple-100 text-purple-800',
  }
  const typeClass = typeBadgeColors[type] || 'bg-slate-100 text-slate-700'

  return (
    <div
      className={`bg-white rounded-lg border p-5 flex flex-col h-full min-w-0 overflow-hidden ${
        isConnected ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
          {icon || '🔌'}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isConnected && (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass}`}>
              Connected
            </span>
          )}
          {!isConnected && status !== 'pending' && status !== 'error' && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
              Not Connected
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              Pending
            </span>
          )}
          {status === 'error' && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Error
            </span>
          )}
          {isRequiredBadge && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-500 text-white">
              Required
            </span>
          )}
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1 truncate" title={name}>{name}</h3>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2 break-words">{description}</p>

      <div className="flex flex-wrap gap-1.5 mb-2 min-w-0">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeClass}`}>
          {type}
        </span>
        {usedBy.map((u) => (
          <span
            key={u}
            className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800"
          >
            {u}
          </span>
        ))}
      </div>

      {cost && (
        <p className="text-xs text-slate-500 mb-3 break-words line-clamp-2">{cost}</p>
      )}

      <div className="mt-auto pt-3 flex flex-wrap gap-2">
        {showConnect && (
          <button
            type="button"
            onClick={() => onConnect?.(integration)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            <span>+</span>
            <span>Connect</span>
          </button>
        )}
        {showConfigure && (
          <button
            type="button"
            onClick={() => onConfigure?.(integration)}
            className="inline-flex items-center gap-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50"
          >
            <span>⚙</span>
            <span>Configure</span>
          </button>
        )}
      </div>
    </div>
  )
}
