import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, X, Eye, AlertCircle } from "lucide-react";
import { contractService } from "../../api/dataService";
import { useAuth } from "../../context/AuthContext";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import { useNotifications } from "../../context/NotificationContext";
import GlobalDatePicker from "../../components/common/GlobalDatePicker";

// Helper Components (Inline for now as they are missing in the project)
const FormInput = ({ label, name, value, onChange, type = "text", required, placeholder, error, min, step }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      step={step}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${error ? 'border-red-500' : 'border-slate-300'}`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const FormSelect = ({ label, value, onChange, options, required, error }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white ${error ? 'border-red-500' : 'border-slate-300'}`}
    >
      {(options || []).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const FALLBACK_CONTRACTS = []; // As fallback

function normalizeContract(c, i) {
  return {
    id: c.id ?? c.contract_id ?? `CNT-${String(i + 1).padStart(3, '0')}`,
    propertyImage: c.propertyImage ?? c.image ?? c.property_image ?? c.property_image_url ?? '',
    propertyName: c.property_name ?? c.propertyName ?? c.property ?? '—',
    location: c.location ?? c.property_location ?? '',
    party: c.party_name ?? c.party ?? c.borrower ?? c.borrower_name ?? '—',
    lender: c.lender_name ?? c.lender ?? 'Brickbanq',
    contractValue: Number(c.value || c.contractValue || c.contract_value || c.loanAmount) || 0,
    createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : (c.createdDate ?? c.created_date ?? new Date().toLocaleDateString()),
    status: c.status ?? 'Draft'
  }
}

function getContractList(res) {
  const d = res?.data?.data !== undefined ? res.data.data : res?.data || res
  if (Array.isArray(d)) return d
  if (d?.contracts) return d.contracts
  if (d?.items) return d.items
  return []
}

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Under Contract', label: 'Under Contract' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
]

export default function InvestorContracts() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user: authUser } = useAuth();
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [formData, setFormData] = useState({
    propertyAddress: '',
    party: '',
    lender: '',
    contractValue: '',
    status: 'Draft',
    date: new Date().toISOString().split('T')[0]
  })
  const [propertyPhotos, setPropertyPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    const load = async () => {
      try {
        // Using existing contractService
        const res = await contractService.getContracts()
        if (cancelled) return
        if (!res.success) {
          throw new Error(res.error || "Failed to fetch contracts");
        }
        const data = res.data;
        const list = getContractList(data) || []
        const normalized = list.length > 0 ? list.map(normalizeContract) : FALLBACK_CONTRACTS.map((c, i) => normalizeContract(c, i))
        setContracts(normalized)
      } catch (e) {
        if (!cancelled) {
          setContracts(FALLBACK_CONTRACTS.map((c, i) => normalizeContract(c, i)))
          const isNetworkError = e?.code === 'ERR_NETWORK' || e?.message === 'Network Error'
          if (!isNetworkError) setError(e?.message || 'Failed to load contracts')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleView = (contract) => setViewingContract(contract)

  const handleDownload = async (contract) => {
    setDownloadingId(contract.id)
    try {
      // Using existing logic or fallback since downloadContract endpoint might not exist on contractService yet
      // Assuming contract has a pdf url or generating a dummy one
      if (contract.pdf) {
        const link = document.createElement("a");
        link.href = contract.pdf;
        link.download = `${contract.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback text generation
        const content = `Contract: ${contract.id}\nProperty: ${contract.propertyName}\nLocation: ${contract.location}\nParties: ${contract.party}, ${contract.lender}\nValue: ${formatCurrency(contract.contractValue)}\nStatus: ${contract.status}\nCreated: ${contract.createdDate}`
        const blob = new Blob([content], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contract-${contract.id}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloadingId(null)
    }
  }

  const closeViewModal = () => setViewingContract(null)

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setFormData({
      propertyAddress: '',
      party: '',
      lender: '',
      contractValue: '',
      status: 'Draft',
      date: new Date().toISOString().split('T')[0]
    })
    setPropertyPhotos([])
    setPhotoPreviews([])
    setFormErrors({})
  }

  const handleInputChange = (field, value) => {
    // Party and Lender fields: only letters, spaces, hyphens, and apostrophes
    if (field === 'party' || field === 'lender') {
      value = value.replace(/[^a-zA-Z\s\-']/g, '')
    }
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPhotos = [...propertyPhotos, ...files]
    setPropertyPhotos(newPhotos)

    // Create previews
    const newPreviews = []
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target.result)
        if (newPreviews.length === files.length) {
          setPhotoPreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index) => {
    setPropertyPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.propertyAddress.trim()) errors.propertyAddress = 'Property address is required'
    if (!formData.party.trim()) errors.party = 'Party is required'
    if (!formData.lender.trim()) errors.lender = 'Lender is required'
    if (!formData.contractValue || Number(formData.contractValue) <= 0) {
      errors.contractValue = 'Contract value must be greater than 0'
    }
    if (!formData.date) errors.date = 'Date is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await contractService.getContracts();
      if (res.success) {
        const list = getContractList(res.data) || [];
        const normalized = list.length > 0 ? list.map(normalizeContract) : FALLBACK_CONTRACTS.map((c, i) => normalizeContract(c, i));
        setContracts(normalized);
      }
    } catch (err) {
      console.error("Failed to re-fetch contracts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const currentUserId = authUser?.id || authUser?.user_id
      const payload = {
        title: formData.propertyAddress.split(',')[0] || formData.propertyAddress,
        contract_type: 'MortgageResolution',
        property_name: formData.propertyAddress,
        party_name: formData.party,
        lender_name: formData.lender,
        value: Number(formData.contractValue),
        signer_ids: currentUserId ? [currentUserId] : []
      }

      const res = await contractService.createContract(payload);
      
      if (!res.success) {
        throw new Error(res.error || "Failed to create contract");
      }

      // Re-fetch to get real persisted data including backend ID
      await fetchContracts();

      // Trigger notification
      addNotification({
        type: 'contract',
        title: 'New Contract Created',
        message: `A new contract for ${payload.title} has been successfully created.`,
      });

      closeCreateModal()
    } catch (err) {
      setFormErrors({ submit: err?.message || 'Failed to create contract' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <LoadingState />;
  // if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Legal Contracts</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed">Securely manage mortgage resolution agreements and digital signatures</p>
          {error && <p className="text-sm text-amber-600 mt-2 font-bold flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
        </div>
        <button
          type="button"
          disabled
          title="Contracts are generated automatically when an auction is won"
          className="bg-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl inline-flex items-center gap-2 cursor-not-allowed opacity-60"
        >
          <Plus size={18} />
          <span>New Contract</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Contracts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Property</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Contract ID</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Parties</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Contract Value</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Created Date</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Status</th>
                <th className="text-left text-sm font-medium text-slate-600 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!contracts || contracts.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    No contracts yet. Contracts appear here when a bid is accepted on My Case.
                  </td>
                </tr>
              ) : (
                (contracts || []).map((contract) => (
                  <tr key={contract.id} className="border-b border-gray-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {contract.propertyImage ? (
                          <img src={contract.propertyImage} alt={contract.propertyName} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-slate-200 flex items-center justify-center text-slate-400 text-xs">—</div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{contract.propertyName}</p>
                          <p className="text-xs text-slate-500">{contract.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-slate-900">{contract.id}</span></td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-slate-900">{contract.party}</p>
                        <p className="text-xs text-slate-500">{contract.lender}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(contract.contractValue)}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-slate-600">{contract.createdDate}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded ${contract.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : contract.status === 'Cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button type="button" onClick={() => handleView(contract)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium" title="View Details">
                          View
                        </button>
                        <button type="button" onClick={() => handleDownload(contract)} disabled={downloadingId === contract.id} className="text-slate-600 hover:text-slate-700 disabled:opacity-50" title="Download">
                          <Download size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={closeViewModal}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Contract Details</h3>
              <button type="button" onClick={closeViewModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Contract ID</span><span className="font-medium text-slate-900">{viewingContract.id}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Property</span><span className="font-medium text-slate-900 text-right">{viewingContract.propertyName}, {viewingContract.location}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Party</span><span className="font-medium text-slate-900">{viewingContract.party}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Lender</span><span className="font-medium text-slate-900">{viewingContract.lender}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Contract Value</span><span className="font-medium text-slate-900">{formatCurrency(viewingContract.contractValue)}</span></div>
              <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">Created</span><span className="font-medium text-slate-900">{viewingContract.createdDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-medium text-slate-900">{viewingContract.status}</span></div>
            </div>
            <div className="mt-6 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => handleDownload(viewingContract)} className="border border-slate-300 bg-white text-slate-700 text-sm px-4 py-2 rounded hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Download size={16} /> Download
              </button>
              <button type="button" onClick={closeViewModal} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-fade-in" onClick={closeCreateModal}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Create New Contract</h3>
              <button type="button" onClick={closeCreateModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormInput
                    label="Property Address"
                    required
                    value={formData.propertyAddress}
                    onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                    placeholder="e.g., 45 Victoria Street, Potts Point, NSW 2011"
                    error={formErrors.propertyAddress}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Property Photos
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 transition-colors hover:border-indigo-400">
                    <div className="flex flex-col items-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center space-x-2 mb-3 transition-colors"
                      >
                        <span>📷</span>
                        <span>Upload Photos</span>
                      </label>
                      <p className="text-xs text-slate-500">JPG, PNG up to 10MB each</p>
                    </div>
                    {photoPreviews.length > 0 && (
                      <div className="flex gap-2 flex-wrap pb-4">
                        {(photoPreviews || []).map((preview, index) => (
                          <div key={index} className="relative w-20 h-20 rounded shadow-sm border border-gray-200 overflow-hidden group">
                            <img
                              src={preview}
                              alt={`Property ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FormInput
                  label="Party"
                  required
                  value={formData.party}
                  onChange={(e) => handleInputChange('party', e.target.value)}
                  placeholder="e.g., Sarah Mitchell"
                  error={formErrors.party}
                />

                <FormInput
                  label="Lender"
                  required
                  value={formData.lender}
                  onChange={(e) => handleInputChange('lender', e.target.value)}
                  placeholder="e.g., Commonwealth Bank"
                  error={formErrors.lender}
                />

                <FormInput
                  label="Contract Value"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.contractValue}
                  onChange={(e) => handleInputChange('contractValue', e.target.value)}
                  placeholder="e.g., 1250000"
                  error={formErrors.contractValue}
                />

                <FormSelect
                  label="Status"
                  required
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  options={STATUS_OPTIONS}
                  error={formErrors.status}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <GlobalDatePicker
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                  {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                </div>
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="border border-slate-300 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Create Contract</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
