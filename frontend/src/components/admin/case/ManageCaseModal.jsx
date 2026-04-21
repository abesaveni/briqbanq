// src/components/admin/case/ManageCaseModal.jsx
import { useState } from 'react'
import { X, FileText, Image as ImageIcon, Sparkles, Download, Loader2, CheckCircle2, AlertCircle, StickyNote } from 'lucide-react'
import { useCaseContext } from '../../../context/CaseContext'
import { casesService } from '../../../api/dataService'
import CaseDetailsTab from './CaseDetailsTab'
import PropertyImagesTab from './PropertyImagesTab'
import AIContentTab from './AIContentTab'
import DocumentsTab from './DocumentsTab'
import InternalNotesTab from './InternalNotesTab'

export default function ManageCaseModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('case-details')
    const [formData, setFormData] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
    const { caseData, updateCase } = useCaseContext()

    if (!isOpen) return null

    const tabs = [
        { label: 'Case Details', icon: FileText, id: 'case-details' },
        { label: 'Property Images', icon: ImageIcon, id: 'property-images' },
        { label: 'AI Content', icon: Sparkles, id: 'ai-content' },
        { label: 'Documents', icon: Download, id: 'documents' },
        { label: 'Internal Notes', icon: StickyNote, id: 'internal-notes' },
    ]

    const handleSave = async () => {
        if (!caseData?._id) { onClose(); return }
        setSaving(true)
        setSaveStatus(null)

        const f = formData || {}
        const payload = {}

        const addr = f.address ?? caseData.property.address
        if (addr) payload.property_address = addr
        const propType = f.propertyType ?? caseData.property.type
        if (propType) payload.property_type = propType
        const estVal = parseFloat(f.valuationAmount ?? caseData.valuation.amount)
        if (estVal > 0) payload.estimated_value = estVal
        const debt = parseFloat(f.outstandingDebt ?? caseData.loan.outstandingDebt)
        if (debt > 0) payload.outstanding_debt = debt
        const rate = parseFloat(f.interestRate ?? caseData.loan.interestRate)
        if (!isNaN(rate)) payload.interest_rate = rate
        const defRate = parseFloat(f.defaultRate ?? caseData.loan.defaultRate)
        if (!isNaN(defRate)) payload.default_rate = defRate
        const daysDefault = parseInt(f.daysInDefault ?? caseData.loan.daysInDefault)
        if (!isNaN(daysDefault)) payload.days_in_default = daysDefault

        const suburb = f.suburb ?? caseData.property.suburb
        if (suburb) payload.suburb = suburb
        const postcode = f.postcode ?? caseData.property.postcode
        if (postcode) payload.postcode = postcode
        const beds = parseInt(f.bedrooms ?? caseData.property.bedrooms)
        if (!isNaN(beds)) payload.bedrooms = beds
        const baths = parseInt(f.bathrooms ?? caseData.property.bathrooms)
        if (!isNaN(baths)) payload.bathrooms = baths
        const kitchens = parseInt(f.kitchens ?? caseData.property.kitchens)
        if (!isNaN(kitchens)) payload.kitchens = kitchens
        const valuerName = f.valuerName ?? caseData.valuation.valuer
        if (valuerName) payload.valuer_name = valuerName

        const res = await casesService.adminUpdateCase(caseData._id, payload)
        setSaving(false)
        if (res.success) {
            updateCase({
                loan: { ...caseData.loan, outstandingDebt: payload.outstanding_debt ?? caseData.loan.outstandingDebt, interestRate: payload.interest_rate ?? caseData.loan.interestRate, defaultRate: payload.default_rate ?? caseData.loan.defaultRate, daysInDefault: payload.days_in_default ?? caseData.loan.daysInDefault },
                property: { ...caseData.property, address: payload.property_address ?? caseData.property.address, suburb: payload.suburb ?? caseData.property.suburb, postcode: payload.postcode ?? caseData.property.postcode, bedrooms: payload.bedrooms ?? caseData.property.bedrooms, bathrooms: payload.bathrooms ?? caseData.property.bathrooms, kitchens: payload.kitchens ?? caseData.property.kitchens },
                valuation: { ...caseData.valuation, amount: payload.estimated_value ?? caseData.valuation.amount, valuer: payload.valuer_name ?? caseData.valuation.valuer },
            })
            setSaveStatus('success')
            setTimeout(() => onClose(), 1200)
        } else {
            setSaveStatus('error')
        }
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'case-details': return <CaseDetailsTab onChange={setFormData} />
            case 'property-images': return <PropertyImagesTab />
            case 'ai-content': return <AIContentTab />
            case 'documents': return <DocumentsTab />
            case 'internal-notes': return <InternalNotesTab />
            default: return <CaseDetailsTab onChange={setFormData} />
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200">

                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Manage Case · {caseData?.id || '—'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {caseData?.property?.address || 'Property address'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 bg-white">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4 flex-shrink-0" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {renderTabContent()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
                    <div className="h-5">
                        {saveStatus === 'success' && (
                            <span className="flex items-center gap-1.5 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" /> Saved successfully
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="flex items-center gap-1.5 text-sm text-red-500">
                                <AlertCircle className="w-4 h-4" /> Failed to save — please try again
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-60"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
