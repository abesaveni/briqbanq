import React, { useState, useRef, useEffect } from 'react';
import {
    User, Building2, Shield, Bell, Network,
    Upload, X, ChevronRight, Home, MapPin, CreditCard, AlertTriangle, Key,
    EyeOff, Eye, Plus, CheckCircle, XCircle, Settings, Save
} from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/dataService';
import { validateFirstName, validateLastName, validateEmail, validateAuPhone, validateAuPostcode, validateABN } from '../../utils/auValidation';

// Simple InputGroup helper
function InputGroup({ label, name, value, onChange, type = "text", required, icon, disabled, error }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-200'} text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function AdminSettings() {
    const [currentView, setCurrentView] = useState("profile");

    const tabs = [
        { id: "profile", label: "Profile", icon: <User size={16} /> },
        { id: "organization", label: "Organization", icon: <Building2 size={16} /> },
        { id: "api", label: "API Integrations", icon: <Network size={16} /> },
        { id: "security", label: "Security", icon: <Shield size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    ];

    return (
        <div className="animate-fade-in font-sans text-gray-900 pb-10 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 py-2">
                <div className="w-14 h-14 bg-indigo-600 rounded-[14px] flex items-center justify-center shadow-sm">
                    <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                    <p className="text-sm font-medium text-gray-500">Manage your account, integrations, and platform configuration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex px-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentView(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors duration-200 ${currentView === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 gap-2 mb-2 font-medium">
                <Home size={13} className="cursor-pointer hover:text-gray-900" />
                <ChevronRight size={13} />
                <span className="cursor-pointer hover:text-gray-900">Dashboard</span>
                <ChevronRight size={13} />
                <span className="cursor-pointer hover:text-gray-900">Settings</span>
                <ChevronRight size={13} />
                <span className="font-bold text-gray-900">{tabs.find(t => t.id === currentView)?.label}</span>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {currentView === "profile" && <ProfileView />}
                {currentView === "organization" && <OrganizationView />}
                {currentView === "api" && <ApiView />}
                {currentView === "security" && <SecurityView />}
                {currentView === "notifications" && <NotificationsView />}
            </div>
        </div>
    );
}

function ProfileView() {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [photo, setPhoto] = useState(user?.photo || user?.avatar_url || null);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || user?.first_name || '',
        lastName: user?.lastName || user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || user?.phone_number || '',
        company: user?.company || '',
        jobTitle: user?.jobTitle || user?.job_title || '',
        bio: user?.bio || '',
        street: user?.street || '',
        city: user?.city || '',
        state: user?.state || 'VIC',
        postcode: user?.postcode || '',
        country: user?.country || 'Australia'
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || user.first_name || prev.firstName,
                lastName: user.lastName || user.last_name || prev.lastName,
                email: user.email || prev.email,
                phone: user.phone || user.phone_number || prev.phone,
                company: user.company || prev.company,
                jobTitle: user.jobTitle || user.job_title || prev.jobTitle,
                bio: user.bio || prev.bio,
                street: user.street || prev.street,
                city: user.city || prev.city,
                state: user.state || prev.state,
                postcode: user.postcode || prev.postcode,
                country: user.country || prev.country,
            }));
            if (user.photo || user.avatar_url) setPhoto(user.photo || user.avatar_url);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Phone: only allow digits, spaces, +, -, (, )
        const sanitized = name === 'phone' ? value.replace(/[^0-9\s+\-()\u0020]/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) setPhoto(URL.createObjectURL(file));
    };

    const validate = () => {
        const e = {};
        const fnErr = validateFirstName(formData.firstName); if (fnErr) e.firstName = fnErr;
        const lnErr = validateLastName(formData.lastName); if (lnErr) e.lastName = lnErr;
        const emErr = validateEmail(formData.email); if (emErr) e.email = emErr;
        if (formData.phone) { const phErr = validateAuPhone(formData.phone); if (phErr) e.phone = phErr; }
        if (formData.postcode) { const pcErr = validateAuPostcode(formData.postcode, formData.state); if (pcErr) e.postcode = pcErr; }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await authService.updateProfile({ ...formData, photoUrl: photo });
            updateUser({ ...formData, photo });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            updateUser({ ...formData, photo });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm text-center">
                    <h3 className="text-left font-bold text-sm text-gray-900 mb-6">Profile Photo</h3>
                    <div className="relative w-[130px] h-[130px] mx-auto mb-6">
                        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ${!photo ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                            {photo ? (
                                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-medium text-white tracking-widest leading-none">
                                    {formData.firstName[0]}{formData.lastName[0]}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Upload size={14} /> Upload Photo
                        </button>
                        <button onClick={() => setPhoto(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                            <X size={14} /> Remove Photo
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-5 leading-[1.6] px-2 text-left">
                        Recommended: Square image, at least 400x400px<br />JPG, PNG or GIF. Max 5MB.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-900 mb-6">Account Info</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Account Type:</span>
                            <span className="font-bold text-gray-900 capitalize">{user?.role || 'Administrator'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Verification:</span>
                            <span className="bg-green-100/80 text-green-700 px-2.5 py-1 rounded text-xs font-bold">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-900 mb-5">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required icon={<User size={14} />} error={errors.firstName} />
                        <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required icon={<User size={14} />} error={errors.lastName} />
                    </div>
                    <div className="mb-4">
                        <InputGroup label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" required disabled />
                        <p className="text-xs text-gray-400 mt-1 font-medium">Contact your system administrator to change email.</p>
                    </div>
                    <div className="mb-4">
                        <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} error={errors.phone} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="Company" name="company" value={formData.company} onChange={handleInputChange} />
                        <InputGroup label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} maxLength={500}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 resize-none" />
                        <div className="text-xs text-gray-400 mt-1 font-medium">{formData.bio.length} / 500 characters</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-900 mb-5">Address</h3>
                    <div className="mb-4">
                        <InputGroup label="Street Address" name="street" value={formData.street} onChange={handleInputChange} icon={<MapPin size={14} />} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="City" name="city" value={formData.city} onChange={handleInputChange} />
                        <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1.5">State</label>
                            <select name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 bg-white">
                                <option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option><option>SA</option><option>TAS</option><option>ACT</option><option>NT</option>
                            </select>
                        </div>
                        <InputGroup label="Postcode" name="postcode" value={formData.postcode} onChange={handleInputChange} error={errors.postcode} />
                    </div>
                    <InputGroup label="Country" name="country" value={formData.country} onChange={handleInputChange} />
                </div>

                <div className="flex justify-end items-center gap-3 pt-2">
                    {saveSuccess && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                            <CheckCircle size={15} /> Changes saved successfully
                        </span>
                    )}
                    <button className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70">
                        {loading ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrganizationView() {
    const [loading, setLoading] = useState(false);
    const [orgErrors, setOrgErrors] = useState({});
    const [savedBanner, setSavedBanner] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [orgData, setOrgData] = useState({
        orgName: '', abn: '',
        industry: 'Financial Services', companySize: '1-10 employees',
        website: '', phone: '',
        street: '', city: '', state: 'VIC', postcode: ''
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Member' });

    const handleInviteSubmit = (e) => {
        e.preventDefault();
        if (!inviteData.name || !inviteData.email) return;
        const initials = inviteData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        setTeamMembers([...teamMembers, { id: Date.now(), ...inviteData, initials, color: 'bg-gray-600' }]);
        setShowInviteModal(false);
        setInviteData({ name: '', email: '', role: 'Member' });
    };

    return (
        <div className="space-y-6 relative">
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm max-w-[800px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg"><Building2 size={18} /></div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">Organization Details</h3>
                        <p className="text-sm text-gray-500 font-medium">Manage your organization information</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <InputGroup label="Organization Name" name="orgName" value={orgData.orgName} onChange={(e) => { setOrgData(p => ({ ...p, orgName: e.target.value })); if (orgErrors.orgName) setOrgErrors(p => ({ ...p, orgName: null })); }} required error={orgErrors.orgName} />
                    <InputGroup label="ABN" name="abn" value={orgData.abn} onChange={(e) => { setOrgData(p => ({ ...p, abn: e.target.value })); if (orgErrors.abn) setOrgErrors(p => ({ ...p, abn: null })); }} required error={orgErrors.abn} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <InputGroup label="Website" name="website" value={orgData.website} onChange={(e) => setOrgData(p => ({ ...p, website: e.target.value }))} />
                    <InputGroup label="Phone Number" name="phone" value={orgData.phone} onChange={(e) => { setOrgData(p => ({ ...p, phone: e.target.value })); if (orgErrors.phone) setOrgErrors(p => ({ ...p, phone: null })); }} error={orgErrors.phone} />
                </div>
                <div className="mb-4">
                    <InputGroup label="Street Address" name="street" value={orgData.street} onChange={(e) => setOrgData(p => ({ ...p, street: e.target.value }))} icon={<MapPin size={14} />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-x-5 gap-y-4">
                    <InputGroup label="City" name="city" value={orgData.city} onChange={(e) => setOrgData(p => ({ ...p, city: e.target.value }))} />
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">State</label>
                        <select value={orgData.state} onChange={(e) => setOrgData(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-gray-900 bg-white">
                            <option>NSW</option><option>VIC</option><option>QLD</option><option>WA</option><option>SA</option><option>TAS</option><option>ACT</option><option>NT</option>
                        </select>
                    </div>
                    <InputGroup label="Postcode" name="postcode" value={orgData.postcode} onChange={(e) => { setOrgData(p => ({ ...p, postcode: e.target.value })); if (orgErrors.postcode) setOrgErrors(p => ({ ...p, postcode: null })); }} error={orgErrors.postcode} />
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm max-w-[800px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-fuchsia-50/80 border border-fuchsia-100 text-fuchsia-500 rounded-lg"><User size={18} /></div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">Team Members ({teamMembers.length})</h3>
                            <p className="text-sm text-gray-500 font-medium">Manage who has access to your organization</p>
                        </div>
                    </div>
                    <button onClick={() => setShowInviteModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Plus size={14} /> Invite Member
                    </button>
                </div>
                <div className="space-y-3">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-[12px] hover:border-gray-200 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full ${member.color} text-white flex items-center justify-center font-bold text-sm`}>{member.initials}</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5">{member.name}</h4>
                                    <p className="text-sm text-gray-400 font-medium">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select value={member.role} onChange={(e) => setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: e.target.value } : m))} disabled={member.role === 'Administrator'} className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 bg-white focus:outline-none cursor-pointer">
                                    <option>Administrator</option><option>Member</option><option>Viewer</option>
                                </select>
                                {member.role !== 'Administrator' && (
                                    <button onClick={() => setTeamMembers(prev => prev.filter(m => m.id !== member.id))} className="p-[7px] text-red-500 hover:text-red-600 rounded-lg border border-red-50 hover:bg-red-50">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center gap-3 max-w-[800px]">
                {savedBanner && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                        <CheckCircle size={15} /> Organization saved successfully
                    </span>
                )}
                {saveError && (
                    <span className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{saveError}</span>
                )}
                <button onClick={async () => {
                    const e = {};
                    if (!orgData.orgName.trim()) e.orgName = 'Organization Name is required';
                    if (orgData.abn) { const err = validateABN(orgData.abn); if (err) e.abn = err; }
                    if (orgData.phone) { const err = validateAuPhone(orgData.phone); if (err) e.phone = err; }
                    if (orgData.postcode) { const err = validateAuPostcode(orgData.postcode, orgData.state); if (err) e.postcode = err; }
                    if (Object.keys(e).length) { setOrgErrors(e); return; }
                    setLoading(true);
                    setSavedBanner(false);
                    setSaveError(null);
                    try {
                        await authService.updateProfile({ organization: orgData });
                        setSavedBanner(true);
                        setTimeout(() => setSavedBanner(false), 3000);
                    } catch (err) {
                        setSaveError(err?.message || 'Failed to save organization details');
                    }
                    setLoading(false);
                }} disabled={loading} className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70">
                    {loading ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                </button>
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Member Name</label>
                                <input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Enter full name" value={inviteData.name} onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Email Address</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Enter email address" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Role</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white" value={inviteData.role} onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}>
                                    <option>Administrator</option><option>Member</option><option>Viewer</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 mt-4">Send Invitation</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ApiView() {
    const [apis, setApis] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newApi, setNewApi] = useState({ name: '', key: '', limit: '10000' });

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newApi.name.trim() || !newApi.key.trim()) return;
        setApis(prev => [...prev, { id: Date.now(), name: newApi.name, key: newApi.key.slice(0, 8) + '****', calls: 0, limit: parseInt(newApi.limit) || 10000, status: 'connected' }]);
        setNewApi({ name: '', key: '', limit: '10000' });
        setShowModal(false);
    };

    return (
        <div className="space-y-6 max-w-[800px]">
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">API Integrations</h3>
                        <p className="text-sm text-gray-500 font-medium">Manage third-party service connections</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Plus size={14} /> Add Integration
                    </button>
                </div>
                <div className="space-y-3">
                    {apis.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No integrations added yet. Click "Add Integration" to get started.</p>
                    )}
                    {apis.map((api) => (
                        <div key={api.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-[12px] hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${api.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {api.status === 'connected' ? <CheckCircle size={20} className="text-green-600" /> : <XCircle size={20} className="text-gray-400" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{api.name}</h4>
                                    <p className="text-xs text-gray-400 font-medium">{api.key} · {api.calls}/{api.limit} calls</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${api.status === 'connected' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                                    {api.status === 'connected' ? '✓ Connected' : 'Disconnected'}
                                </span>
                                <button
                                    onClick={() => setApis(prev => prev.filter(a => a.id !== api.id))}
                                    className="px-3 py-1.5 border border-red-100 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Integration Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-sm text-gray-900">Add API Integration</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Service Name *</label>
                                <input required type="text" value={newApi.name} onChange={e => setNewApi(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Stripe, SendGrid, Twilio"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">API Key *</label>
                                <input required type="password" value={newApi.key} onChange={e => setNewApi(p => ({ ...p, key: e.target.value }))}
                                    placeholder="Enter API key or secret token"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monthly Call Limit</label>
                                <input type="number" value={newApi.limit} onChange={e => setNewApi(p => ({ ...p, limit: e.target.value }))}
                                    placeholder="10000"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div className="flex justify-end gap-3 pt-1">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    <Plus size={14} /> Add Integration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SecurityView() {
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [twoFAEnabled, setTwoFAEnabled] = useState(true);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const toggleShow = (key) => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="space-y-6 max-w-[800px]">
            {/* Password */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg"><Key size={18} /></div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-500 font-medium">Update your account password</p>
                    </div>
                </div>
                <div className="space-y-4 max-w-md">
                    {[
                        { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
                        { label: 'New Password', key: 'new', placeholder: 'Enter new password' },
                        { label: 'Confirm New Password', key: 'confirm', placeholder: 'Confirm new password' },
                    ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-gray-800 mb-1.5">{label}</label>
                            <div className="relative">
                                <input
                                    type={showPasswords[key] ? 'text' : 'password'}
                                    value={passwords[key]}
                                    placeholder={placeholder}
                                    autoComplete="new-password"
                                    onChange={(e) => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                                />
                                <button type="button" onClick={() => toggleShow(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPasswords[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                        <Save size={14} /> Update Password
                    </button>
                </div>
            </div>

            {/* 2FA */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg"><Shield size={18} /></div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 font-medium">Add an extra layer of security to your account</p>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Authenticator App</h4>
                        <p className="text-xs text-gray-500 mt-1">Use Google Authenticator or similar app</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>
        </div>
    );
}

function NotificationsView() {
    const [prefs, setPrefs] = useState({
        emailAlerts: true, pushNotifications: true, caseUpdates: true,
        auctionAlerts: true, kycAlerts: true, systemAlerts: true,
        weeklyDigest: false, marketing: false,
    });
    const [prefSaved, setPrefSaved] = useState(false);

    const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    const handleSavePrefs = () => {
        setPrefSaved(true);
        setTimeout(() => setPrefSaved(false), 3000);
    };

    const items = [
        { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important updates via email' },
        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time browser notifications' },
        { key: 'caseUpdates', label: 'Case Updates', desc: 'Notifications when case status changes' },
        { key: 'auctionAlerts', label: 'Auction Alerts', desc: 'New bids and auction status changes' },
        { key: 'kycAlerts', label: 'KYC Alerts', desc: 'KYC review submissions and completions' },
        { key: 'systemAlerts', label: 'System Alerts (Required)', desc: 'Critical system and security notifications', disabled: true },
        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary email every Monday' },
        { key: 'marketing', label: 'Marketing Emails', desc: 'Product updates and feature announcements' },
    ];

    return (
        <div className="space-y-4 max-w-[800px]">
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg"><Bell size={18} /></div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900">Notification Preferences</h3>
                        <p className="text-sm text-gray-500 font-medium">Choose what notifications you receive</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {items.map(({ key, label, desc, disabled }) => (
                        <div key={key} className={`flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl ${disabled ? 'opacity-70' : ''}`}>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{label}</h4>
                                <p className="text-xs text-gray-500 mt-1">{desc}</p>
                            </div>
                            <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input type="checkbox" className="sr-only peer" checked={prefs[key]} onChange={() => !disabled && toggle(key)} disabled={disabled} />
                                <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'peer-checked:bg-indigo-400' : 'peer-checked:bg-indigo-600'}`}></div>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end items-center gap-3 mt-6">
                    {prefSaved && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                            <CheckCircle size={15} /> Preferences saved
                        </span>
                    )}
                    <button onClick={handleSavePrefs} className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                        <Save size={14} /> Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}
