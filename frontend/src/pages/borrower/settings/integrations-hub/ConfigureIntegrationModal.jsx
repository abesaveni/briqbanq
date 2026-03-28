import { useState, useEffect } from 'react'

/**
 * Modal for configuring a connected integration. Matches design exactly.
 * All data driven by integration prop; handlers are placeholders for backend.
 */
export default function ConfigureIntegrationModal({
  integration,
  isOpen,
  onClose,
  onSave,
  onTestConnection,
  onDisconnect,
}) {
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [environment, setEnvironment] = useState('')
  const [lastVerified, setLastVerified] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const config = integration?.config || {}
  const apiKeyMasked = config.apiKeyMasked ?? '************'
  const defaultWebhook = config.webhookUrl ?? 'https://api.growplatform.com/webhooks/sendgrid'
  const defaultEnv = config.environment ?? 'Production'
  const defaultLastVerified = config.lastVerified ?? '2 hours ago'

  useEffect(() => {
    if (isOpen && integration) {
      setWebhookUrl(config.webhookUrl ?? defaultWebhook)
      setEnvironment(config.environment ?? defaultEnv)
      setLastVerified(config.lastVerified ?? defaultLastVerified)
      setApiKeyVisible(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when modal opens or integration id/config fields change
  }, [isOpen, integration?.id, defaultWebhook, defaultEnv, defaultLastVerified, config.webhookUrl, config.environment, config.lastVerified])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !integration) return null

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(integration, { webhookUrl, environment })
      onClose()
    } catch (err) {
      console.error('Save failed', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      await onTestConnection?.(integration)
      setLastVerified('Just now')
    } finally {
      setIsTesting(false)
    }
  }

  const handleDisconnectClick = () => {
    if (window.confirm(`Disconnect ${integration.name}?`)) {
      onDisconnect?.(integration)
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  const features = integration.features || [
    'Transactional emails',
    'Delivery tracking',
    'Email templates',
    'Bounce management',
  ]

  const setupRequirements = integration.configSetupRequirements || [
    'API Key',
    'Sender authentication',
    'Domain verification',
  ]

  const usedByModules = integration.usedBy || ['All']
  const environmentOptions = integration.environmentOptions || ['Production', 'Staging', 'Sandbox']
  const pricingText = integration.cost || 'Free tier: 100 emails/day, Paid: from $19.95/mo'

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="configure-modal-title"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                {integration.icon || '✉️'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="configure-modal-title" className="text-xl font-bold text-slate-900 mb-1">
                  {integration.name}
                </h2>
                <p className="text-sm text-slate-600">{integration.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-2">
                <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-emerald-600 text-white whitespace-nowrap">
                  Connected
                </span>
                {integration.isRequired && (
                  <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-amber-500 text-white whitespace-nowrap">
                    Required
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Features */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600 text-lg">⚡</span>
                <h3 className="text-base font-semibold text-slate-900">Features</h3>
              </div>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Setup Requirements */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-600 text-lg">⚠</span>
                <h3 className="text-base font-semibold text-slate-900">Setup Requirements</h3>
              </div>
              <div className="space-y-2">
                {setupRequirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      i
                    </span>
                    <span className="text-sm font-medium text-slate-900">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Used By Modules */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-600 text-lg">🧩</span>
                <h3 className="text-base font-semibold text-slate-900">Used By Modules</h3>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-blue-50 text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-100"
              >
                {usedByModules.length === 1 && usedByModules[0] === 'All' ? 'All Modules' : usedByModules.join(', ')}
              </button>
            </div>

            {/* Configuration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-600 text-lg">⚙</span>
                <h3 className="text-base font-semibold text-slate-900">Configuration</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <span>✓</span>
                    Integration Active
                  </span>
                  <span className="text-sm text-slate-500">Last verified: {lastVerified}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={apiKeyVisible ? 'text' : 'password'}
                      value={apiKeyMasked}
                      readOnly
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible((v) => !v)}
                      className="p-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                      aria-label={apiKeyVisible ? 'Hide' : 'Show'}
                    >
                      {apiKeyVisible ? (
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(apiKeyMasked)}
                      className="p-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                      aria-label="Copy"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookUrl)}
                      className="p-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                      aria-label="Copy"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {environmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 text-lg">$</span>
                <h3 className="text-base font-semibold text-slate-900">Pricing</h3>
              </div>
              <p className="text-sm text-slate-700">{pricingText}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
