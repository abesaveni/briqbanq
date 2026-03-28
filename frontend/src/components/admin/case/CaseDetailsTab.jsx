// src/components/admin/case/CaseDetailsTab.jsx
import { useState } from 'react'
import { useCaseContext } from '../../../context/CaseContext'

export default function CaseDetailsTab({ onChange }) {
    const { caseData } = useCaseContext()

    const [form, setForm] = useState({
        borrowerName: caseData?.borrower?.name || '',
        lenderName: caseData?.lender?.name || '',
        outstandingDebt: caseData?.loan?.outstandingDebt || '',
        interestRate: caseData?.loan?.interestRate || '',
        defaultRate: caseData?.loan?.defaultRate || '',
        daysInDefault: caseData?.loan?.daysInDefault || '',
        address: caseData?.property?.address || '',
        suburb: caseData?.property?.suburb || '',
        postcode: caseData?.property?.postcode || '',
        bedrooms: caseData?.property?.bedrooms || '',
        bathrooms: caseData?.property?.bathrooms || '',
        kitchens: caseData?.property?.kitchens || '',
        valuationAmount: caseData?.valuation?.amount || '',
        valuationDate: caseData?.valuation?.date || '',
        valuerName: caseData?.valuation?.valuer || '',
    })

    const update = (field, value) => {
        const next = { ...form, [field]: value }
        setForm(next)
        onChange?.(next)
    }

    if (!caseData) return null

    const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
    const labelCls = "block text-xs font-medium text-gray-500 mb-1"

    return (
        <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Case Number</label>
                        <input type="text" value={caseData.id} disabled
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Borrower Name</label>
                        <input type="text" value={form.borrowerName} onChange={e => update('borrowerName', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Lender Name</label>
                        <input type="text" value={form.lenderName} onChange={e => update('lenderName', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </div>

            {/* Section 2: Loan Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Loan Details</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className={labelCls}>Outstanding Debt</label>
                        <input type="number" value={form.outstandingDebt} onChange={e => update('outstandingDebt', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Interest Rate (%)</label>
                        <input type="number" step="0.01" value={form.interestRate} onChange={e => update('interestRate', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Default Rate (%)</label>
                        <input type="number" step="0.01" value={form.defaultRate} onChange={e => update('defaultRate', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Days in Default</label>
                        <input type="number" value={form.daysInDefault} onChange={e => update('daysInDefault', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </div>

            {/* Section 3: Property Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}>Address</label>
                        <input type="text" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Suburb</label>
                            <input type="text" value={form.suburb} onChange={e => update('suburb', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Postcode</label>
                            <input type="text" value={form.postcode} onChange={e => update('postcode', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Bedrooms</label>
                            <input type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Bathrooms</label>
                            <input type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Kitchens</label>
                            <input type="number" value={form.kitchens} onChange={e => update('kitchens', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Valuation */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Valuation Amount</label>
                        <input type="number" value={form.valuationAmount} onChange={e => update('valuationAmount', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Valuation Date</label>
                        <input type="text" value={form.valuationDate} onChange={e => update('valuationDate', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Valuer Name</label>
                        <input type="text" value={form.valuerName} onChange={e => update('valuerName', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </div>
        </div>
    )
}
