import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formService } from '../../../api/dataService'

export default function FormCustomizationTab() {
  const [forms, setForms] = useState([])

  useEffect(() => {
    formService.getForms()
      .then((res) => { const d = res.data || res; if (Array.isArray(d)) setForms(d) })
      .catch(() => {})
  }, [])
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id || null)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('Text')

  const selectedForm = forms.find((f) => f.id === selectedFormId) || forms[0]

  const handleAddField = () => {
    if (!newFieldLabel.trim() || !selectedFormId) return
    setForms((prev) =>
      prev.map((f) =>
        f.id === selectedFormId
          ? {
              ...f,
              fields: [...(f.fields || []), { id: `f-${Date.now()}`, label: newFieldLabel, type: newFieldType, required: false }],
              fieldCount: (f.fields?.length || 0) + 1,
            }
          : f
      )
    )
    setNewFieldLabel('')
    setNewFieldType('Text')
  }

  const handleRemoveField = (formId, fieldId) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId ? { ...f, fields: (f.fields || []).filter((x) => x.id !== fieldId), fieldCount: Math.max(0, (f.fieldCount || 0) - 1) } : f
      )
    )
  }

  const handleToggleRequired = (formId, fieldId) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, fields: (f.fields || []).map((x) => (x.id === fieldId ? { ...x, required: !x.required } : x)) }
          : f
      )
    )
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/lawyer/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/lawyer/settings" className="hover:text-slate-700">Settings</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-900">Form Customization</span>
      </nav>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">Form Customization</h3>
        <p className="text-sm text-slate-500 mt-1">Add custom fields to forms across the Brickbanq platform</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Forms</h4>
            <ul className="space-y-1">
              {forms.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFormId(f.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                      selectedFormId === f.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f.name}
                    <span className="text-slate-500">{f.fieldCount} custom fields</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6">
            {selectedForm && (
              <>
                <h4 className="text-lg font-semibold text-slate-900">{selectedForm.name}</h4>
                {selectedForm.description && <p className="text-sm text-slate-500 mt-1">{selectedForm.description}</p>}
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-slate-900 mb-3">Custom Fields</h5>
                  <ul className="space-y-3">
                    {(selectedForm.fields || []).map((field) => (
                      <li key={field.id} className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-md">
                        <div>
                          <p className="font-medium text-slate-900">{field.label}</p>
                          <p className="text-xs text-slate-500">Type: {field.type}</p>
                          {field.required && <span className="inline-block mt-1 text-xs text-red-600">Required</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleRequired(selectedForm.id, field.id)}
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            {field.required ? 'Make Optional' : 'Make Required'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(selectedForm.id, field.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                            aria-label="Remove field"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 p-4 border border-dashed border-slate-200 rounded-lg">
                  <p className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-4">
                    <span>+</span> Add New Custom Field
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Field Label *</label>
                      <input
                        type="text"
                        placeholder="e.g., Property Manager Contact"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Field Type *</label>
                      <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
                        <option>Text</option>
                        <option>Number</option>
                        <option>Currency</option>
                        <option>Date</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                    >
                      + Add Field to Form
                    </button>
                    <button type="button" onClick={() => { setNewFieldLabel(''); setNewFieldType('Text'); }} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200">
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
