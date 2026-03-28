import { Plus, Eye, Download, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { contractService } from '../../api/dataService'
import { generateBrandedPDF } from '../../utils/pdfGenerator'

export default function Contracts() {
    const navigate = useNavigate()
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [downloadingId, setDownloadingId] = useState(null)
    const [form, setForm] = useState({ title: '', case_id: '', borrower_name: '', lender_name: '', contract_value: '' })

    useEffect(() => {
        contractService.getContracts()
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.items || res || [])
                setContracts(data)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const formatCurrency = (amount) => {
        if (!amount) return '—'
        return `$${Number(amount).toLocaleString()}`
    }

    const getStatusStyles = (status) => {
        if (status === 'Under Contract') return 'bg-indigo-50 text-indigo-700'
        return 'bg-green-50 text-green-700'
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            const res = await contractService.createContract({
                title: form.title,
                case_id: form.case_id || null,
                borrower_name: form.borrower_name,
                lender_name: form.lender_name,
                contract_value: parseFloat(form.contract_value) || 0,
                status: 'Under Contract',
            })
            if (res.success && res.data) {
                setContracts(prev => [res.data, ...prev])
            }
            setShowCreateModal(false)
            setForm({ title: '', case_id: '', borrower_name: '', lender_name: '', contract_value: '' })
        } catch { /* ignore */ } finally {
            setCreating(false)
        }
    }

    const handleDownload = async (contract) => {
        setDownloadingId(contract.id)
        try {
            await generateBrandedPDF({
                title: `Contract — ${contract.contract_number || contract.id}`,
                role: 'Admin',
                sections: [
                    {
                        heading: 'Contract Details',
                        head: ['Field', 'Value'],
                        rows: [
                            ['Contract ID', contract.contract_number || contract.id || '—'],
                            ['Property', contract.property_address || contract.property || '—'],
                            ['Borrower', contract.borrower_name || contract.party || '—'],
                            ['Lender', contract.lender_name || contract.lender || '—'],
                            ['Contract Value', formatCurrency(contract.contract_value || contract.value)],
                            ['Status', contract.status || '—'],
                            ['Created', contract.created_at ? new Date(contract.created_at).toLocaleDateString('en-AU') : (contract.created || '—')],
                        ],
                    },
                ],
                fileName: `contract-${contract.contract_number || contract.id || 'export'}.pdf`,
            })
        } catch { /* ignore */ } finally {
            setDownloadingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
                    <p className="text-sm text-gray-500 mt-1">Platform administration and compliance management</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded flex items-center gap-1"
                >
                    <Plus className="w-4 h-4 flex-shrink-0" /> Create New Contract
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Contracts</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Property</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Contract ID</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Parties</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Contract Value</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Created Date</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                                <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading contracts...</td></tr>
                            ) : contracts.length === 0 ? (
                                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No contracts found</td></tr>
                            ) : contracts.map((contract) => (
                                <tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-900 font-medium">{contract.property_address || contract.property || contract.title || '—'}</p>
                                        <p className="text-xs text-gray-500">{contract.property_suburb || contract.suburb || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{contract.contract_number || contract.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {contract.borrower_name || contract.party || '—'} / {contract.lender_name || contract.lender || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {formatCurrency(contract.contract_value || contract.value)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {contract.created_at ? new Date(contract.created_at).toLocaleDateString('en-AU') : (contract.created || '—')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(contract.status)}`}>
                                            {contract.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-sm transition-colors"
                                            >
                                                <Eye className="w-4 h-4 flex-shrink-0" /> View
                                            </button>
                                            <button
                                                onClick={() => handleDownload(contract)}
                                                disabled={downloadingId === contract.id}
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Download PDF"
                                            >
                                                {downloadingId === contract.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Download className="w-4 h-4 flex-shrink-0" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Contract Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Create New Contract</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {[
                                { label: 'Contract Title', key: 'title', required: true, placeholder: 'e.g. Settlement Agreement' },
                                { label: 'Case ID (optional)', key: 'case_id', placeholder: 'Link to an existing case' },
                                { label: 'Borrower Name', key: 'borrower_name', required: true, placeholder: 'Borrower full name' },
                                { label: 'Lender Name', key: 'lender_name', required: true, placeholder: 'Lender entity name' },
                                { label: 'Contract Value (A$)', key: 'contract_value', type: 'number', placeholder: '0' },
                            ].map(({ label, key, required, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        {label}{required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={type || 'text'}
                                        value={form[key]}
                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                        required={required}
                                        placeholder={placeholder}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {creating ? 'Creating...' : 'Create Contract'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
