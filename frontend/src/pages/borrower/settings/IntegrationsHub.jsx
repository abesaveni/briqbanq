import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import IntegrationMetrics from './integrations-hub/IntegrationMetrics'
import IntegrationCategoryFilters from './integrations-hub/IntegrationCategoryFilters'
import IntegrationCard from './integrations-hub/IntegrationCard'
import IntegrationCardSkeleton from './integrations-hub/IntegrationCardSkeleton'
import ConnectIntegrationModal from './integrations-hub/ConnectIntegrationModal'
import ConfigureIntegrationModal from './integrations-hub/ConfigureIntegrationModal'

/** Map category id to integration type for filtering */
const CATEGORY_TO_TYPE = {
  payments: 'Payment',
  accounting: 'Accounting',
  banking: 'Banking',
  communications: 'Communication',
  documents: 'Document',
  storage: 'Storage',
  identity: 'Identity',
  credit: 'Credit',
  property: 'Property',
  registries: 'Registry',
  authentication: 'Auth',
  notifications: 'Notifications',
  analytics: 'Analytics',
  support: 'Support',
}

function filterIntegrationsByCategory(integrations, categoryId) {
  if (!categoryId || categoryId === 'all') return integrations
  const type = CATEGORY_TO_TYPE[categoryId]
  if (!type) return integrations
  return integrations.filter((i) => i.type === type)
}

export default function IntegrationsHub() {
  const [integrations, setIntegrations] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [modalIntegration, setModalIntegration] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [configureModalIntegration, setConfigureModalIntegration] = useState(null)
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => { setLoading(true); setError(null) }, 0)
    Promise.resolve({
      integrations: [],
      metrics: null,
      categories: [],
    })
      .then((data) => {
        if (cancelled) return
        setIntegrations(data.integrations || [])
        setMetrics(data.metrics || null)
        setCategories(data.categories || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load integrations')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { clearTimeout(t); cancelled = true }
  }, [])

  const filteredIntegrations = filterIntegrationsByCategory(integrations, selectedCategoryId)

  // Placeholder handlers – attach backend later
  const handleConnect = (integration) => {
    setModalIntegration(integration)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setModalIntegration(null)
  }

  const handleModalConnect = async (integration) => {
    // Backend: POST /api/borrower/settings/integrations/:id/connect
    // await integrationApi.connectIntegration(integration.id, formData)
    if (integration?.id) {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, status: 'connected' } : i))
      )
    }
    // Modal calls onClose() after onConnect
  }
  const handleConfigure = (integration) => {
    setConfigureModalIntegration(integration)
    setIsConfigureModalOpen(true)
  }

  const handleConfigureModalClose = () => {
    setIsConfigureModalOpen(false)
    setConfigureModalIntegration(null)
  }

  const handleConfigureSave = async (integration, config) => {
    // Backend: PATCH /api/borrower/settings/integrations/:id/config
    void integration
    void config
    handleConfigureModalClose()
  }

  const handleConfigureTestConnection = async () => {
    // Backend: POST /api/borrower/settings/integrations/:id/test
    // Modal updates "Last verified" via its own state
  }

  const handleConfigureDisconnect = (integration) => {
    // Backend: POST /api/borrower/settings/integrations/:id/disconnect
    if (integration?.id) {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, status: 'not_connected' } : i))
      )
    }
    handleConfigureModalClose()
  }

  const handleManage = (integration) => {
    setConfigureModalIntegration(integration)
    setIsConfigureModalOpen(true)
  }

  const handleDisconnect = (integration) => {
    if (integration?.id) {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, status: 'not_connected' } : i))
      )
    }
  }

  const handleAddCustomIntegration = () => {
    const newId = `custom-${Date.now()}`
    setIntegrations((prev) => [
      ...prev,
      {
        id: newId,
        name: 'Custom Integration',
        description: 'Custom integration – configure to connect',
        icon: '🔌',
        status: 'not_connected',
        type: 'Other',
        usedBy: ['All'],
      },
    ])
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    Promise.resolve({ integrations: [], metrics: null, categories: [] })
      .then((data) => {
        setIntegrations(data.integrations || [])
        setMetrics(data.metrics || null)
        setCategories(data.categories || [])
      })
      .catch((err) => setError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  if (loading && !integrations.length) {
    return (
      <div className="space-y-6 max-w-full min-w-0">
        <Link to="/borrower/settings" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <span>←</span>
          <span>Back to Grow HQ</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Platform Integrations</h2>
          <p className="text-sm text-slate-600 mb-4">Manage all third-party integrations and API connections.</p>
        </div>
        <IntegrationMetrics metrics={null} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="min-w-0">
              <IntegrationCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-full min-w-0">
        <Link to="/borrower/settings" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <span>←</span>
          <span>Back to Grow HQ</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full min-w-0">
      <Link
        to="/borrower/settings"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <span>←</span>
        <span>Back to Grow HQ</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations Hub</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Platform Integrations</h2>
          <p className="text-sm text-slate-600 mt-0.5">Manage all third-party integrations and API connections.</p>
        </div>
        <button
          type="button"
          onClick={handleAddCustomIntegration}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded whitespace-nowrap"
        >
          <span>+</span>
          <span>Add Custom Integration</span>
        </button>
      </div>

      <IntegrationMetrics metrics={metrics} />

      <IntegrationCategoryFilters
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {filteredIntegrations.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔗</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No integrations in this category</h3>
          <p className="text-sm text-slate-600 mb-4">
            Select &quot;All Integrations&quot; or another category to see available integrations.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            View all
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
          {filteredIntegrations.map((integration) => (
            <div key={integration.id} className="min-w-0">
              <IntegrationCard
                integration={integration}
                onConnect={handleConnect}
                onConfigure={handleConfigure}
                onManage={handleManage}
                onDisconnect={handleDisconnect}
              />
            </div>
          ))}
        </div>
      )}

      {/* Connect Integration Modal */}
      <ConnectIntegrationModal
        integration={modalIntegration}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConnect={handleModalConnect}
      />

      {/* Configure Integration Modal */}
      <ConfigureIntegrationModal
        integration={configureModalIntegration}
        isOpen={isConfigureModalOpen}
        onClose={handleConfigureModalClose}
        onSave={handleConfigureSave}
        onTestConnection={handleConfigureTestConnection}
        onDisconnect={handleConfigureDisconnect}
      />
    </div>
  )
}
