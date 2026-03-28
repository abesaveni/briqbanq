import { useState, useEffect } from 'react'
import { Breadcrumb, Toggle, FormInput, FormSelect } from './SettingsComponents'
import { moduleSettingsService } from '../services'

const MODULES = [
  { id: 'brickbanq', name: 'Brickbanq', version: '4.1', env: 'production', active: true },
  { id: 'grow', name: 'Grow Accounting', version: '1.8.5', env: 'production', active: true },
  { id: 'pfa', name: 'PFA', version: '3.1.3', env: 'development', active: false },
]
const ENV_OPTIONS = [{ value: 'Production', label: 'Production' }, { value: 'Staging', label: 'Staging' }, { value: 'Development', label: 'Development' }]

const defaultConfig = {
  moduleName: 'Brickbanq',
  version: '4.1',
  environment: 'Production',
  apiEndpoint: 'https://api.brickbanq.com/v2',
  databaseConnection: 'brickbanq-prod-db-west',
  maxUsers: 1000,
  moduleEnabled: true,
}
const defaultFeatures = { deals: true, auctions: true, contracts: true, escrow: true, kyc: true }

export default function ModuleSettings() {
  const [selectedModuleId, setSelectedModuleId] = useState('brickbanq')
  const [config, setConfig] = useState(defaultConfig)
  const [features, setFeatures] = useState(defaultFeatures)
  const [, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    moduleSettingsService.getModuleSettings()
      .then((settings) => {
        if (cancelled) return
        if (settings?.config) setConfig({ ...defaultConfig, ...settings.config })
        if (settings?.features) setFeatures({ ...defaultFeatures, ...settings.features })
      })
      .catch(() => {
        // Service handles fallback
      })
    return () => { cancelled = true }
  }, [])

  const toggleFeature = (key) => {
    setFeatures((f) => ({ ...f, [key]: !f[key] }))
    setIsDirty(true)
  }

  const handleConfigChange = (field, value) => {
    setConfig((c) => ({ ...c, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await moduleSettingsService.updateModuleSettings({ config, features })
      setIsDirty(false)
    } catch {
      // Service handles offline case
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setConfig((c) => ({ ...c, ...defaultConfig, apiEndpoint: defaultConfig.apiEndpoint, databaseConnection: defaultConfig.databaseConnection, maxUsers: defaultConfig.maxUsers }))
    setFeatures({ ...defaultFeatures })
    try {
      await moduleSettingsService.updateModuleSettings({ config: defaultConfig, features: defaultFeatures })
    } catch {
      // Service handles offline case
    }
    setIsDirty(false)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '🏠', link: '/borrower/dashboard' }, { label: 'Dashboard', link: '/borrower/dashboard' }, { label: 'Settings', link: '/borrower/settings' }, { label: 'Module Settings' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Module Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
        </div>
        <button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded">+ Create Settings</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setSelectedModuleId(m.id); setConfig({ ...config, moduleName: m.name, version: m.version, moduleEnabled: m.active }) }}
            className={`bg-white rounded-lg border p-6 text-left transition-colors ${selectedModuleId === m.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">📦</span>
              <span className={`w-2 h-2 rounded-full ${m.active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={m.active ? 'Active' : 'Inactive'} />
            </div>
            <p className="font-semibold text-slate-900 mt-2">{m.name}</p>
            <p className="text-sm text-slate-500">Version {m.version}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${m.env === 'production' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{m.env}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">General Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">Module Status</p>
                  <p className="text-sm text-slate-500">Module is currently {config.moduleEnabled ? 'active' : 'inactive'}</p>
                </div>
                <button type="button" onClick={() => handleConfigChange('moduleEnabled', !config.moduleEnabled)} className="border border-red-500 text-red-600 text-sm font-medium px-4 py-2 rounded hover:bg-red-50">
                  {config.moduleEnabled ? 'Disable Module' : 'Enable Module'}
                </button>
              </div>
              <FormInput label="Module name" value={config.moduleName} readOnly className="bg-slate-50" />
              <FormInput label="Version" value={config.version} readOnly className="bg-slate-50" />
              <FormSelect label="Environment" value={config.environment} onChange={(v) => handleConfigChange('environment', v)} options={ENV_OPTIONS} />
              <FormInput label="API Endpoint" value={config.apiEndpoint} onChange={(e) => handleConfigChange('apiEndpoint', e.target.value)} />
              <FormInput label="Database Connection" value={config.databaseConnection} onChange={(e) => handleConfigChange('databaseConnection', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Users</label>
                <input type="range" min="100" max="10000" step="100" value={config.maxUsers} onChange={(e) => handleConfigChange('maxUsers', Number(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-500 mt-1">{config.maxUsers}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50">Save Changes</button>
              <button type="button" onClick={handleReset} className="border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50">Reset to Defaults</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Features</h3>
          <div className="space-y-0">
            <Toggle label="Deals" enabled={features.deals} onChange={() => toggleFeature('deals')} />
            <Toggle label="Auctions" enabled={features.auctions} onChange={() => toggleFeature('auctions')} />
            <Toggle label="Contracts" enabled={features.contracts} onChange={() => toggleFeature('contracts')} />
            <Toggle label="Escrow" enabled={features.escrow} onChange={() => toggleFeature('escrow')} />
            <Toggle label="KYC" enabled={features.kyc} onChange={() => toggleFeature('kyc')} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">System-Wide Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '📧', title: 'Email', desc: 'Configure SMTP and email templates', action: 'Configure' },
            { icon: '🔔', title: 'Notifications', desc: 'Manage notification settings', action: 'Configure' },
            { icon: '🔒', title: 'Security', desc: 'Security and authentication', action: 'Configure' },
            { icon: '💾', title: 'Backups', desc: 'Automated backup schedule', action: 'Configure' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-lg border border-slate-200 p-6">
              <span className="text-2xl">{item.icon}</span>
              <h4 className="font-semibold text-slate-900 mt-2">{item.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
              <button type="button" className="mt-4 border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50">{item.action}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
