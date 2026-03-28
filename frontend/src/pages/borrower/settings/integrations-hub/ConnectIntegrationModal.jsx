import { useState, useEffect } from 'react'

/**
 * Modal for connecting an integration. Matches design exactly.
 * All data driven by integration prop; handlers are placeholders for backend.
 */
export default function ConnectIntegrationModal({ integration, isOpen, onClose, onConnect }) {
  const [formData, setFormData] = useState({ apiKey: '', apiSecret: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({ apiKey: '', apiSecret: '' })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, integration?.id])

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.apiKey?.trim()) {
      newErrors.apiKey = 'API Key is required'
    }
    if (!formData.apiSecret?.trim()) {
      newErrors.apiSecret = 'API Secret is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await onConnect?.(integration, formData)
      onClose()
    } catch (err) {
      console.error('Connect failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Mock features - backend can provide per integration
  const features = integration.features || [
    'SMS notifications',
    'Australian numbers',
    'Delivery reports',
  ]

  // Mock setup requirements - backend can provide per integration
  const setupRequirements = integration.setupRequirements || ['API Key', 'API Secret']

  // Mock setup instructions - backend can provide per integration
  const setupInstructions = integration.setupInstructions || [
    'Create an account with MessageMedia',
    'Obtain your API credentials from their dashboard',
    'Enter the credentials below',
    'Test the connection to verify',
  ]

  const usedByModules = integration.usedBy || ['All']

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                {integration.icon || '🔌'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="modal-title" className="text-xl font-bold text-slate-900 mb-1">{integration.name}</h2>
                <p className="text-sm text-slate-600">{integration.description}</p>
              </div>
              <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700 whitespace-nowrap ml-4 flex-shrink-0">
                Not Connected
              </span>
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

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Features Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h3 className="text-base font-semibold text-slate-900">Features</h3>
              </div>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Setup Requirements Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙</span>
                <h3 className="text-base font-semibold text-slate-900">Setup Requirements</h3>
              </div>
              <div className="space-y-2">
                {setupRequirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <span className="text-amber-600 flex-shrink-0">⚠</span>
                    <span className="text-sm font-medium text-slate-900">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Used By Modules Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🧩</span>
                <h3 className="text-base font-semibold text-slate-900">Used By Modules</h3>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-blue-50 text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                {usedByModules.length === 1 && usedByModules[0] === 'All'
                  ? 'All Modules'
                  : usedByModules.join(', ')}
              </button>
            </div>

            {/* Connect Integration Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">+</span>
                <h3 className="text-base font-semibold text-slate-900">Connect Integration</h3>
              </div>

              {/* Setup Instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 mb-2">Setup Instructions</p>
                    <ol className="space-y-1.5 text-sm text-slate-700">
                      {setupInstructions.map((instruction, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="flex-shrink-0">{i + 1}.</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {setupRequirements.map((req, i) => {
                  const fieldKey = req.toLowerCase().replace(/\s+/g, '')
                  const isApiKey = fieldKey.includes('key')
                  const isApiSecret = fieldKey.includes('secret')
                  const fieldName = isApiKey ? 'apiKey' : isApiSecret ? 'apiSecret' : fieldKey
                  const value = formData[fieldName] || ''
                  const error = errors[fieldName]

                  return (
                    <div key={i}>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {req}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type={isApiSecret ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => handleChange(fieldName, e.target.value)}
                        placeholder={`Enter ${req.toLowerCase()}`}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          error ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span>⚡</span>
              <span>Connect {integration.name}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
