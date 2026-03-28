import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2, Users, CreditCard, ChevronRight, Home,
    Plus, Mail, Trash2, Info, Save, X, Globe, Phone, ExternalLink
} from 'lucide-react'

export default function OrganizationSettings() {
    const navigate = useNavigate()
    const [isSaving, setIsSaving] = useState(false)
    const [savedBanner, setSavedBanner] = useState(false)
    const [orgData, setOrgData] = useState({
        name: 'Platinum Capital Partners',
        abn: '12 345 678 901',
        industry: 'Financial Services',
        size: '50-100 employees',
        website: 'https://platinumcapital.com.au',
        phone: '+61 3 9123 4567',
        address: '123 Collins Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000'
    })

    const [members, setMembers] = useState([
        { id: 1, name: 'Michael Chen', email: 'michael.chen@platinumcapital.com.au', role: 'Administrator', avatar: 'MC' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@platinumcapital.com.au', role: 'Member', avatar: 'SJ' },
        { id: 3, name: 'David Wilson', email: 'david.wilson@platinumcapital.com.au', role: 'Member', avatar: 'DW' }
    ])

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setSavedBanner(true)
            setTimeout(() => setSavedBanner(false), 3000)
        }, 800)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setOrgData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="space-y-8 max-w-7xl pb-20">
            {savedBanner && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" /> Organization settings saved successfully!
                </div>
            )}
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organization Settings</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">Platform administration and compliance management</p>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <Home className="w-3.5 h-3.5" />
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gray-900 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/settings')} className="hover:text-gray-900 transition-colors">Settings</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600">Organization</span>
            </nav>

            {/* Organization Details Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Organization Details</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Manage your organization information</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Organization Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={orgData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">ABN *</label>
                        <input
                            type="text"
                            name="abn"
                            value={orgData.abn}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Industry</label>
                        <select
                            name="industry"
                            value={orgData.industry}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        >
                            <option>Financial Services</option>
                            <option>Real Estate</option>
                            <option>Technology</option>
                            <option>Legal</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Company Size</label>
                        <select
                            name="size"
                            value={orgData.size}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        >
                            <option>1-10 employees</option>
                            <option>11-50 employees</option>
                            <option>50-100 employees</option>
                            <option>100+ employees</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Website</label>
                        <input
                            type="text"
                            name="website"
                            value={orgData.website}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={orgData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                        <input
                            type="text"
                            name="address"
                            value={orgData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={orgData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-1">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">State</label>
                            <select
                                name="state"
                                value={orgData.state}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                            >
                                <option>VIC</option>
                                <option>NSW</option>
                                <option>QLD</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Postcode</label>
                            <input
                                type="text"
                                name="postcode"
                                value={orgData.postcode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Team Members ({members.length})</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Manage who has access to your organization</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        <Plus className="w-3.5 h-3.5" />
                        Invite Member
                    </button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                                    {member.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                    <p className="text-xs text-gray-400 font-bold tracking-tight">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-50">
                                    <option>{member.role}</option>
                                    <option>Administrator</option>
                                    <option>Member</option>
                                    <option>Viewer</option>
                                </select>
                                {member.id !== 1 && (
                                    <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Role Glossary */}
                <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Team Member Roles:</p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-xs text-gray-600 font-bold uppercase tracking-tight">
                            <span className="text-indigo-600">• Administrator:</span> Full access to all settings and data
                        </li>
                        <li className="flex items-start gap-2 text-xs text-gray-600 font-bold uppercase tracking-tight">
                            <span className="text-indigo-600">• Member:</span> Can view and manage deals, but cannot change organization settings
                        </li>
                        <li className="flex items-start gap-2 text-xs text-gray-600 font-bold uppercase tracking-tight">
                            <span className="text-indigo-600">• Viewer:</span> Read-only access to organization data
                        </li>
                    </ul>
                </div>
            </div>

            {/* Billing Information Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Billing Information</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Subscription and payment details</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Subscription Plan */}
                    <div className="p-6 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900 tracking-tight">Professional Plan</p>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">A$299/month • Billed annually</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Next billing date: 1 March 2026</p>
                        </div>
                        <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm">
                            Manage Plan
                        </button>
                    </div>

                    {/* Payment Method */}
                    <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-white border border-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-400 italic">VISA</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 tracking-widest">•••• •••• •••• 4242</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Expires 12/2025</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Update
                        </button>
                    </div>

                    {/* Billing Alert */}
                    <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                            <Info className="w-4 h-4 shadow-sm" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Billing Contact</p>
                            <p className="text-xs text-amber-600 font-bold tracking-tight">All invoices will be sent to the organization administrator email.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-4 pt-4">
                <button
                    onClick={() => navigate('/admin/settings')}
                    className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 px-10 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isSaving ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
