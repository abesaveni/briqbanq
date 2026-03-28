import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Mail, Phone, Building2, Briefcase, MapPin,
    ChevronRight, Home, Upload, Trash2, ShieldCheck,
    Save, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
    validateFirstName, validateLastName, validateEmail,
    validateAuPhone, validateAuPostcode, validateSuburb,
} from '../../utils/auValidation'

export default function ProfileSettings() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [errors, setErrors] = useState({})
    const [profileData, setProfileData] = useState({
        firstName: user?.first_name || user?.firstName || '',
        lastName: user?.last_name || user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        company: '',
        jobTitle: '',
        bio: '',
        address: '',
        city: '',
        state: 'VIC',
        postcode: '',
        country: 'Australia'
    })

    const validate = () => {
        const e = {}
        const fnErr = validateFirstName(profileData.firstName); if (fnErr) e.firstName = fnErr
        const lnErr = validateLastName(profileData.lastName); if (lnErr) e.lastName = lnErr
        const emErr = validateEmail(profileData.email); if (emErr) e.email = emErr
        if (profileData.phone) { const phErr = validateAuPhone(profileData.phone); if (phErr) e.phone = phErr }
        if (profileData.postcode) { const pcErr = validateAuPostcode(profileData.postcode, profileData.state); if (pcErr) e.postcode = pcErr }
        if (profileData.city) { const cityErr = validateSuburb(profileData.city); if (cityErr) e.city = cityErr }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = () => {
        if (!validate()) return
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }, 800)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
    }

    return (
        <div className="space-y-8 max-w-7xl pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
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
                <span className="text-indigo-600">Profile</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Profile Photo Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-8">Profile Photo</h3>
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-semibold mb-8 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                                DW
                            </div>
                            <div className="w-full space-y-3">
                                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm">
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload Photo
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-red-500 hover:text-red-600 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                    Remove Photo
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 font-medium text-center mt-8 leading-relaxed">
                                Recommended: Square image, at least 400x400px<br />
                                JPG, PNG or GIF. Max 5MB.
                            </p>
                        </div>
                    </div>

                    {/* Account Info Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-6">Account Info</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Member Since:</span>
                                <span className="text-sm font-semibold text-gray-900">Jan 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Account Type:</span>
                                <span className="text-sm font-semibold text-gray-900">Premium Investor</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Verification:</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold uppercase tracking-widest rounded-md border border-emerald-100">Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-8">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">First Name *</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Last Name *</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Company</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-4 invisible" />
                                    <input
                                        type="text"
                                        name="company"
                                        value={profileData.company}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Job Title</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-4 invisible" />
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={profileData.jobTitle}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={profileData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                                />
                                <div className="flex justify-between mt-1">
                                    <p className="text-xs text-gray-400 font-medium">{profileData.bio.length} / 500 characters</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-8">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-12 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={profileData.address}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-5 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={profileData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">State</label>
                                <select
                                    name="state"
                                    value={profileData.state}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                >
                                    <option value="VIC">VIC</option>
                                    <option value="NSW">NSW</option>
                                    <option value="QLD">QLD</option>
                                    <option value="WA">WA</option>
                                    <option value="SA">SA</option>
                                    <option value="TAS">TAS</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Postcode</label>
                                <input
                                    type="text"
                                    name="postcode"
                                    value={profileData.postcode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                />
                            </div>
                            <div className="md:col-span-12 space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={profileData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                />
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
                        {saved && <span className="text-xs text-green-600 font-semibold uppercase tracking-widest self-center">Saved!</span>}
                        {Object.keys(errors).length > 0 && <span className="text-xs text-red-600 font-semibold self-center">Fix errors above</span>}
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
            </div>
        </div>
    )
}
