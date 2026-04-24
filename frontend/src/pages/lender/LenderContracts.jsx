import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { generateBrandedPDF } from "../../utils/pdfGenerator";
import { useNavigate } from "react-router-dom";
import { Plus, Download, X, Eye } from "lucide-react";
import { contractService, activityService } from "../../api/dataService";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import { useNotifications } from "../../context/NotificationContext";

// ... (rest of the helper components)
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
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const DetailRow = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
        <span className="text-slate-500 text-xs font-medium">{label}</span>
        <span className={`text-xs font-semibold text-right max-w-[65%] ${highlight || 'text-slate-900'}`}>{value}</span>
    </div>
);

const FALLBACK_CONTRACTS = []; // As fallback

const CONTRACT_STATUS_LABEL = {
    DRAFT: 'Draft', PENDING_SIGNATURES: 'Pending Signatures',
    PARTIALLY_SIGNED: 'Partially Signed', FULLY_SIGNED: 'Fully Signed',
    EXECUTED: 'Completed', CANCELLED: 'Cancelled',
}

function normalizeContract(c, i) {
    const rawStatus = c.status ?? 'DRAFT'
    const createdRaw = c.createdDate ?? c.created_date ?? c.created_at
    return {
        id: c.id ?? c.contract_id ?? `CNT-${String(i + 1).padStart(3, '0')}`,
        propertyImage: c.propertyImage ?? c.image ?? c.property_image ?? c.property_image_url ?? '',
        propertyName: c.propertyName ?? c.property ?? c.property_name ?? '—',
        location: c.location ?? c.property_location ?? '',
        party: c.party ?? c.party_name ?? c.borrower ?? c.borrower_name ?? '—',
        lender: c.lender ?? c.lender_name ?? 'Brickbanq',
        contractValue: Number(c.contractValue || c.contract_value || c.loanAmount || c.value) || 0,
        createdDate: createdRaw
            ? new Date(createdRaw).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString(),
        status: CONTRACT_STATUS_LABEL[rawStatus] || rawStatus,
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

export default function LenderContracts() {
    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
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
                const list = getContractList(res)
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
            await generateBrandedPDF({
                title: `Contract — ${contract.propertyName}`,
                subtitle: contract.location || '',
                imageUrl: contract.propertyImage || null,
                fileName: `contract-${contract.id}.pdf`,
                infoItems: [
                    { label: 'Asset ID', value: contract.id },
                    { label: 'Property', value: contract.propertyName },
                    { label: 'Location', value: contract.location || '—' },
                    { label: 'Borrower', value: contract.party },
                    { label: 'Lender', value: contract.lender },
                    { label: 'Contract Value', value: formatCurrency(contract.contractValue) },
                    { label: 'Date Initiated', value: contract.createdDate },
                    { label: 'Processing Status', value: contract.status },
                ],
                sections: [
                    {
                        heading: 'Contract Summary',
                        head: ['Field', 'Value'],
                        rows: [
                            ['Asset ID', contract.id],
                            ['Property', contract.propertyName],
                            ['Location', contract.location || '—'],
                            ['Borrower / Party', contract.party],
                            ['Lender', contract.lender],
                            ['Contract Value', formatCurrency(contract.contractValue)],
                            ['Date Initiated', contract.createdDate],
                            ['Processing Status', contract.status],
                        ],
                    },
                ],
            })
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            const propertyName = formData.propertyAddress.split(',')[0]?.trim() || formData.propertyAddress
            const res = await contractService.createContract({
                title: `Contract — ${propertyName}`,
                contract_type: 'Mortgage',
                property_name: formData.propertyAddress,
                party_name: formData.party,
                lender_name: formData.lender,
                value: Number(formData.contractValue),
                signer_ids: [],
            })

            if (!res.success) {
                setFormErrors({ submit: res.error || 'Failed to create contract' })
                return
            }

            // Normalise the saved record for the list
            const saved = res.data
            const newContract = normalizeContract({
                ...saved,
                propertyName: saved.property_name || propertyName,
                location: formData.propertyAddress.split(',').slice(1).join(',').trim() || '',
                propertyImage: photoPreviews[0] || '',
                party: saved.party_name || formData.party,
                lender: saved.lender_name || formData.lender,
                contractValue: Number(saved.value || formData.contractValue),
                createdDate: new Date(saved.created_at || formData.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: saved.status || formData.status,
            }, contracts.length)

            setContracts(prev => [newContract, ...prev])

            addNotification({
                type: 'contract',
                title: 'New Contract Created',
                message: `Contract for ${propertyName} has been saved and submitted for admin approval.`,
            })

            activityService.logActivity({
                type: 'contract',
                action: 'Contract Created',
                property: propertyName,
                party: formData.party,
                value: Number(formData.contractValue),
                id: saved.id,
                time: 'Just now',
            })

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
        <div className="space-y-4 pb-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">My Contracts</h1>
                    <p className="text-slate-500 text-sm">Manage your mortgage resolution cases and signature status</p>
                    {error && <p className="text-xs text-amber-600 mt-1">{error}</p>}
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100/50"
                >
                    <Plus size={16} />
                    <span>Create New Contract</span>
                </button>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50">
                    <h3 className="text-slate-900 font-semibold text-base leading-none">Contracts Pipeline</h3>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                                <th className="px-5 py-4 font-semibold">Property</th>
                                <th className="px-3 py-4 font-semibold">Asset ID</th>
                                <th className="px-3 py-4 font-semibold">Borrower / Lender</th>
                                <th className="px-3 py-4 text-center font-semibold">Value</th>
                                <th className="px-3 py-4 font-semibold">Date</th>
                                <th className="px-3 py-4 text-center font-semibold">Status</th>
                                <th className="pl-3 pr-5 py-4 text-right font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-[11px] font-bold text-slate-400">
                                        No contracts yet.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-100">
                                                    {contract.propertyImage ? (
                                                        <img src={contract.propertyImage} alt={contract.propertyName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 text-[10px]">🏠</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-semibold text-sm leading-tight truncate">{contract.propertyName}</p>
                                                    <p className="text-slate-400 text-xs font-medium mt-0.5 truncate max-w-[150px]">{contract.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span className="text-indigo-600 font-semibold text-xs uppercase tracking-tight">{contract.id}</span>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div>
                                                <p className="text-slate-900 font-semibold text-sm truncate max-w-[120px]">{contract.party}</p>
                                                <p className="text-slate-400 text-xs font-medium mt-0.5 truncate max-w-[120px]">{contract.lender}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center whitespace-nowrap">
                                            <span className="text-slate-900 font-semibold text-sm">{formatCurrency(contract.contractValue)}</span>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <span className="text-slate-500 text-xs font-medium">{contract.createdDate}</span>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-tight ${contract.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                contract.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                    'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="pl-3 pr-5 py-4 text-right">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <button type="button" onClick={() => handleView(contract)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95">
                                                    <Eye size={16} />
                                                </button>
                                                <button type="button" onClick={() => handleDownload(contract)} disabled={downloadingId === contract.id} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all active:scale-95 disabled:opacity-50">
                                                    <Download size={16} />
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeViewModal}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-slate-900 font-semibold text-lg tracking-tight">Contract Overview</h3>
                            <button type="button" onClick={closeViewModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-0.5">
                            <DetailRow label="Asset ID" value={viewingContract.id} />
                            <DetailRow label="Property" value={viewingContract.propertyName} />
                            <DetailRow label="Location" value={viewingContract.location} />
                            <DetailRow label="Borrower" value={viewingContract.party} />
                            <DetailRow label="Lender" value={viewingContract.lender} />
                            <DetailRow label="Contract value" value={formatCurrency(viewingContract.contractValue)} />
                            <DetailRow label="Date initiated" value={viewingContract.createdDate} />
                            <DetailRow label="Processing status" value={viewingContract.status} highlight={viewingContract.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'} />
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <button type="button" onClick={() => handleDownload(viewingContract)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95">
                                <Download size={14} /> Download PDF Document
                            </button>
                            <button type="button" onClick={closeViewModal} className="w-full py-2.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all active:scale-95">Close Preview</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/40 overflow-y-auto" onClick={closeCreateModal}>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 my-8" onClick={(e) => e.stopPropagation()}>
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
                                            <div className="mt-4 grid grid-cols-3 gap-3">
                                                {photoPreviews.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={preview}
                                                            alt={`Property ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded border border-slate-200"
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
                                    <FormInput
                                        label="Date"
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        error={formErrors.date}
                                    />
                                </div>
                            </div>

                            {formErrors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-sm text-red-600">{formErrors.submit}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
                </div>,
                document.body
            )}
        </div>
    )
}
