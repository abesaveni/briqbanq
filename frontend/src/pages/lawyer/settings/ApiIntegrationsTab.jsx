import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { integrationService } from '../../../api/dataService'

export default function ApiIntegrationsTab() {
  const [integrations, setIntegrations] = useState([])
  const [testing, setTesting] = useState(null)

  useEffect(() => {
    integrationService.getIntegrations()
      .then((res) => { const d = res.data || res; if (Array.isArray(d)) setIntegrations(d) })
      .catch(() => {})
  }, [])

  const handleTestConnection = (id) => {
    setTesting(id)
    setTimeout(() => setTesting(null), 1500)
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">API Integrations</span>
      </nav>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">API Integrations</h3>
        <p className="text-sm text-slate-500 mt-1">Manage third-party API connections for KYC, property data, payments, and compliance.</p>
      </div>

      <div className="space-y-6">
        {integrations.map((int) => (
          <div key={int.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{int.name}</h4>
                <p className="text-sm text-slate-500 mt-0.5">{int.description}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                int.status === 'Connected' ? 'bg-green-100 text-green-800' : int.status === 'Error' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {int.status === 'Connected' && '✓'}
                {int.status === 'Error' && '!'}
                {int.status === 'Disconnected' && '✕'}
                {int.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {int.fields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{field}</label>
                  <input
                    type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('password') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                    placeholder={`Enter ${field}`}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {int.lastTested && (
                <p className="text-sm text-slate-500">
                  Last tested: {int.lastTested}
                  {int.status === 'Connected' && <span className="text-green-600 ml-1">✓</span>}
                  {int.status === 'Error' && <span className="text-red-600 ml-1">!</span>}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleTestConnection(int.id)}
                disabled={testing === int.id}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {testing === int.id ? 'Testing...' : 'Test Connection'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
        <p className="text-4xl text-slate-400 mb-2">+</p>
        <h4 className="text-lg font-semibold text-slate-900">Need Another Integration?</h4>
        <p className="text-sm text-slate-500 mt-1">Contact support to add custom API integrations</p>
        <a href="mailto:admin@brickbanq.com?subject=API%20Integration%20Request" className="mt-4 text-indigo-600 text-sm font-medium hover:underline inline-block">
          Request Integration
        </a>
      </div>
    </div>
  )
}
