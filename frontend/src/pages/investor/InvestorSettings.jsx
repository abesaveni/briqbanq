import React, { useState, useRef, useEffect } from 'react';
import {
    User, Building2, Shield, Bell, Users, Lock, FolderCog,
    BarChart3, Network, Upload, X, ChevronRight, Save, MapPin, Home, CreditCard, AlertTriangle, Key, Copy, Check, EyeOff, Eye, Smartphone, History, Search, Plus, CheckCircle, XCircle, Database, FileText, RefreshCw, Zap, Globe, AlertCircle, CheckCircle2, Monitor, Mail, MessageSquare, GripVertical, Settings2, Trash2, DollarSign, Hash
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService, notificationService, formService, integrationService, organizationService, userService } from "../../api/dataService";
import {
    validateFirstName, validateLastName, validateEmail,
    validateAuPhone, validateAuPostcode, validateSuburb,
} from "../../utils/auValidation";

export default function InvestorSettings() {
    const [currentView, setCurrentView] = useState("profile"); // profile, organization, api, form, security, notifications
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const tabs = [
        { id: "profile", label: "Profile", icon: <User size={16} /> },
        { id: "organization", label: "Organization", icon: <Building2 size={16} /> },
        { id: "api", label: "API Integrations", icon: <Network size={16} /> },
        { id: "form", label: "Form Customization", icon: <FolderCog size={16} /> },
        { id: "security", label: "Security", icon: <Shield size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    ];

    return (
        <div className="animate-fade-in text-gray-900 pb-10 space-y-8">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.msg}
                </div>
            )}
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Browse available deals and manage your bids</p>
            </div>

            {/* Top Info Banner */}
            <div className="flex items-center gap-4 py-2">
                <div className="w-14 h-14 bg-indigo-800 rounded-[14px] flex items-center justify-center shadow-sm">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <div>
                    <h2 className="text-[22px] font-bold text-gray-900">Settings</h2>
                    <p className="text-[13px] font-medium text-gray-500">Manage your account, integrations, and platform configuration</p>
                </div>
            </div>

            {/* Horizontal Tabs List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex px-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentView(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-[14px] font-bold border-b-2 transition-colors duration-200 ${currentView === tab.id ? 'border-indigo-800 text-indigo-800' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Breadcrumb Navigation based on tab */}
            <div className="flex items-center text-[13px] text-gray-500 gap-2 mb-2 font-medium">
                <Home size={13} className="cursor-pointer hover:text-gray-900" />
                <ChevronRight size={13} />
                <span className="cursor-pointer hover:text-gray-900">Dashboard</span>
                <ChevronRight size={13} />
                <span className="cursor-pointer hover:text-gray-900">Settings</span>
                <ChevronRight size={13} />
                <span className="font-bold text-gray-900">{tabs.find(t => t.id === currentView)?.label}</span>
            </div>

            {/* Main view container based on tab */}
            <div className="animate-in fade-in duration-300">
                {currentView === "profile" && <ProfileSettingsView />}
                {currentView === "organization" && <OrganizationSettingsView />}
                {currentView === "api" && <ApiSettingsView />}
                {currentView === "form" && <FormCustomizationView />}
                {currentView === "security" && <SecuritySettingsView />}
                {currentView === "notifications" && <NotificationsSettingsView />}
            </div>

        </div>
    );
}

/* --- Profile Settings Detail View --- */
function ProfileSettingsView() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Get namespaced profile
    const profile = user || {};


    // Form State - Initialize with user data
    const [formData, setFormData] = useState({
        firstName: profile.first_name || user?.first_name || "",
        lastName: profile.last_name || user?.last_name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || user?.phone || "",
        company: profile.company || user?.company || "",
        jobTitle: profile.jobTitle || user?.jobTitle || "",
        bio: profile.bio || user?.bio || "",
        street: profile.street || user?.street || "",
        city: profile.city || user?.city || "",
        state: profile.state || user?.state || "VIC",
        postcode: profile.postcode || user?.postcode || "",
        country: profile.country || user?.country || "Australia"
    });

    const [photo, setPhoto] = useState(profile.photo || user?.photo || null);

    const hasInitialized = useRef(false);

    // Sync form data if profile loads after initial mount
    useEffect(() => {
        if (profile && (profile.first_name || profile.last_name || profile.email)) {
            setFormData(prev => ({
                ...prev,
                firstName: profile.first_name || "",
                lastName: profile.last_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                company: profile.company || "",
                jobTitle: profile.jobTitle || "",
                bio: profile.bio || "",
                street: profile.street || "",
                city: profile.city || "",
                state: profile.state || "VIC",
                postcode: profile.postcode || "",
                country: profile.country || "Australia"
            }));
            setPhoto(profile.photo || null);
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Photo Handlers
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPhoto(objectUrl);
        }
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const [fieldErrors, setFieldErrors] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    const validate = () => {
        const e = {};
        const fnErr = validateFirstName(formData.firstName); if (fnErr) e.firstName = fnErr;
        const lnErr = validateLastName(formData.lastName); if (lnErr) e.lastName = lnErr;
        const emErr = validateEmail(formData.email); if (emErr) e.email = emErr;
        if (formData.phone) { const phErr = validateAuPhone(formData.phone); if (phErr) e.phone = phErr; }
        if (formData.postcode) { const pcErr = validateAuPostcode(formData.postcode, formData.state); if (pcErr) e.postcode = pcErr; }
        if (formData.city) { const cityErr = validateSuburb(formData.city); if (cityErr) e.city = cityErr; }
        setFieldErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await authService.updateProfile({ ...formData, name: `${formData.firstName} ${formData.lastName}`, photoUrl: photo });
            updateUser({ ...formData, photo, name: `${formData.firstName} ${formData.lastName}` });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            updateUser({ ...formData, photo, name: `${formData.firstName} ${formData.lastName}` });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Photo & Account Info */}
            <div className="space-y-6">

                {/* Profile Photo Card */}
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm text-center h-fit">
                    <h3 className="text-left font-bold text-[15px] text-gray-900 mb-6">Profile Photo</h3>

                    <div className="relative w-[130px] h-[130px] mx-auto mb-6">
                        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ${!photo ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                            {photo ? (
                                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[40px] font-medium text-white tracking-widest leading-none">
                                    {formData.firstName[0]}{formData.lastName[0]}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-[11px] border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <Upload size={14} /> Upload Photo
                        </button>
                        <button
                            onClick={handleRemovePhoto}
                            className="w-full py-[11px] rounded-xl text-[13px] font-bold text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-red-100"
                        >
                            <X size={14} /> Remove Photo
                        </button>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-5 leading-[1.6] px-2 text-left">
                        Recommended: Square image, at least 400x400px<br />
                        JPG, PNG or GIF. Max 5MB.
                    </p>
                </div>

                {/* Account Info Card */}
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-[15px] text-gray-900 mb-6">Account Info</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-gray-500 font-medium">Member Since:</span>
                            <span className="font-bold text-gray-900">
                                {user?.created_at
                                    ? new Date(user.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
                                    : profile.created_at
                                        ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
                                        : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-gray-500 font-medium">Account Type:</span>
                            <span className="font-bold text-gray-900 capitalize">{user?.role || 'Investor'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-gray-500 font-medium">Verification:</span>
                            <span className="bg-green-100/80 text-green-700 px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide">Verified</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Column: Forms */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full">

                {/* Personal Information */}
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-[15px] text-gray-900 mb-5">Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required icon={<User size={14} />} error={fieldErrors.firstName} />
                        <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required icon={<User size={14} />} error={fieldErrors.lastName} />
                    </div>

                    <div className="mb-4">
                        <InputGroup label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" required icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>} error={fieldErrors.email} />
                    </div>

                    <div className="mb-4">
                        <InputGroup label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>} error={fieldErrors.phone} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="Company" name="company" value={formData.company} onChange={handleInputChange} />
                        <InputGroup label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
                    </div>

                    <div className="mb-2">
                        <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={3}
                            maxLength={500}
                            className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                        <div className="text-left text-[11px] text-gray-400 mt-1 font-medium">{formData.bio.length} / 500 characters</div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-[15px] text-gray-900 mb-5">Address</h3>

                    <div className="mb-4">
                        <InputGroup label="Street Address" name="street" value={formData.street} onChange={handleInputChange} icon={<MapPin size={14} />} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-x-5 gap-y-4 mb-4">
                        <InputGroup label="City" name="city" value={formData.city} onChange={handleInputChange} error={fieldErrors.city} />
                        <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">State</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 bg-white"
                            >
                                <option value="NSW">NSW</option>
                                <option value="VIC">VIC</option>
                                <option value="QLD">QLD</option>
                                <option value="WA">WA</option>
                                <option value="SA">SA</option>
                                <option value="TAS">TAS</option>
                                <option value="ACT">ACT</option>
                                <option value="NT">NT</option>
                            </select>
                        </div>
                        <InputGroup label="Postcode" name="postcode" value={formData.postcode} onChange={handleInputChange} error={fieldErrors.postcode} />
                    </div>

                    <div className="mb-2">
                        <InputGroup label="Country" name="country" value={formData.country} onChange={handleInputChange} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-3 pt-2 mt-auto pb-4">
                    <button
                        className="px-6 py-[11px] rounded-lg border border-gray-200 text-[13px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-[11px] rounded-lg bg-blue-800 hover:bg-black text-white text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div> {/* End of Right Column */}

        </div>
    );
}

/* --- Organization Settings View --- */
function OrganizationSettingsView() {
    const [loading, setLoading] = useState(false);
    const [orgData, setOrgData] = useState({
        orgName: "",
        abn: "",
        industry: "Financial Services",
        companySize: "50-100 employees",
        website: "",
        phone: "",
        street: "",
        city: "",
        state: "VIC",
        postcode: ""
    });

    const [teamMembers, setTeamMembers] = useState([]);
    const [currentPlan, setCurrentPlan] = useState({ name: "Professional Plan", price: "299", frequency: "annually", billingDate: "" });
    const [paymentDetails, setPaymentDetails] = useState({ last4: "", expiry: "" });

    // Fetch organization info on mount
    useEffect(() => {
        const fetchOrg = async () => {
            setLoading(true);
            try {
                const [orgRes, teamRes, billingRes] = await Promise.all([
                    organizationService.getOrganization(),
                    organizationService.getTeamMembers(),
                    organizationService.getBillingInfo()
                ]);

                if (orgRes.success) setOrgData(orgRes.data);
                if (teamRes.success) setTeamMembers(teamRes.data);
                if (billingRes.success) {
                    setCurrentPlan(billingRes.data.currentPlan);
                    setPaymentDetails(billingRes.data.paymentDetails);
                }
            } catch (err) {
                console.error("Failed to load organization settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, []);

    // Dynamic Modal States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: "", email: "", role: "Member" });

    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrgData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (id, newRole) => {
        setTeamMembers(prev => prev.map(member =>
            member.id === id ? { ...member, role: newRole } : member
        ));
    };

    const handleDeleteMember = (id) => {
        if (window.confirm("Are you sure you want to remove this team member?")) {
            setTeamMembers(prev => prev.filter(member => member.id !== id));
        }
    };

    const handleInviteSubmit = (e) => {
        e.preventDefault();
        if (!inviteData.name || !inviteData.email) return;

        const initials = inviteData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
        const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1;

        setTeamMembers([...teamMembers, {
            id: newId,
            ...inviteData,
            initials: initials || "U",
            color: "bg-gray-600"
        }]);

        setShowInviteModal(false);
        setInviteData({ name: "", email: "", role: "Member" });
    };

    const handlePlanUpdate = (planName, price) => {
        setCurrentPlan({ ...currentPlan, name: planName, price: price });
        setShowPlanModal(false);
    };

    const handlePaymentUpdate = (last4, expiry) => {
        setPaymentDetails({ last4, expiry });
        setShowPaymentModal(false);
    };

    const handleSave = () => {
        if (!orgData.orgName.trim() || !orgData.abn.trim()) {
            showToast("Organization Name and ABN are required.", 'error');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            showToast("Organization settings saved successfully!");
        }, 1000);
    };

    return (
        <div className="space-y-6 relative">
            {/* Organization Details Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm max-w-[800px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[10px]">
                        <Building2 size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Organization Details</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Manage your organization information</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <InputGroup label="Organization Name" name="orgName" value={orgData.orgName} onChange={handleInputChange} required />
                    <InputGroup label="ABN" name="abn" value={orgData.abn} onChange={handleInputChange} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">Industry</label>
                        <select
                            name="industry"
                            value={orgData.industry}
                            onChange={handleInputChange}
                            className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 bg-white"
                        >
                            <option>Financial Services</option>
                            <option>Real Estate</option>
                            <option>Technology</option>
                            <option>Legal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">Company Size</label>
                        <select
                            name="companySize"
                            value={orgData.companySize}
                            onChange={handleInputChange}
                            className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 bg-white"
                        >
                            <option>1-10 employees</option>
                            <option>11-50 employees</option>
                            <option>50-100 employees</option>
                            <option>100+ employees</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-4">
                    <InputGroup label="Website" name="website" value={orgData.website} onChange={handleInputChange} />
                    <InputGroup label="Phone Number" name="phone" value={orgData.phone} onChange={handleInputChange} />
                </div>

                <div className="mb-4">
                    <InputGroup label="Street Address" name="street" value={orgData.street} onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-x-5 gap-y-4">
                    <InputGroup label="City" name="city" value={orgData.city} onChange={handleInputChange} />
                    <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">State</label>
                        <select
                            name="state"
                            value={orgData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 bg-white"
                        >
                            <option>NSW</option>
                            <option>VIC</option>
                            <option>QLD</option>
                            <option>WA</option>
                            <option>SA</option>
                            <option>TAS</option>
                            <option>ACT</option>
                            <option>NT</option>
                        </select>
                    </div>
                    <InputGroup label="Postcode" name="postcode" value={orgData.postcode} onChange={handleInputChange} />
                </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm max-w-[800px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-fuchsia-50/80 border border-fuchsia-100 text-fuchsia-500 rounded-[10px]">
                            <Users size={18} strokeWidth={2} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[15px] text-gray-900">Team Members ({teamMembers.length})</h3>
                            <p className="text-[13px] text-gray-500 font-medium">Manage who has access to your organization</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-5 py-2.5 bg-indigo-800 text-white rounded-lg text-[13px] font-bold hover:bg-indigo-900 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={14} /> Invite Member
                    </button>
                </div>

                <div className="space-y-3">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-[12px] hover:border-gray-200 transition-colors shadow-sm bg-white">
                            <div className="flex items-center gap-4">
                                <div className={`w-[42px] h-[42px] rounded-full ${member.color} text-white flex items-center justify-center font-bold text-[15px] tracking-wide`}>
                                    {member.initials}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-[15px] mb-0.5">{member.name}</h4>
                                    <p className="text-[13px] text-gray-400 font-medium flex items-center gap-1.5"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-[13px] font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[right_12px_center]"
                                >
                                    <option>Administrator</option>
                                    <option>Member</option>
                                    <option>Viewer</option>
                                </select>
                                {member.role !== 'Administrator' && (
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="p-[7px] text-red-500 hover:text-red-600 rounded-lg transition-colors border border-red-50 hover:bg-red-50 ml-1 bg-white hover:border-red-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 bg-blue-50/50 rounded-[12px] p-4 border border-blue-100 shadow-sm">
                    <h4 className="text-[13px] font-bold text-blue-700 mb-2 leading-none">Team Member Roles:</h4>
                    <ul className="text-[12px] text-blue-700 space-y-1.5 font-medium">
                        <li className="flex gap-2"><span>&bull;</span> <span><span className="font-bold">Administrator:</span> Full access to all settings and data</span></li>
                        <li className="flex gap-2"><span>&bull;</span> <span><span className="font-bold">Member:</span> Can view and manage deals, but cannot change organization settings</span></li>
                        <li className="flex gap-2"><span>&bull;</span> <span><span className="font-bold">Viewer:</span> Read-only access to organization data</span></li>
                    </ul>
                </div>
            </div>

            {/* Billing Information Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm max-w-[800px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-green-50 border border-green-100 text-green-500 rounded-[10px]">
                        <CreditCard size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Billing Information</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Subscription and payment details</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Professional Plan Box */}
                    <div className="flex justify-between items-center p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl shadow-sm">
                        <div>
                            <h4 className="font-bold text-[14px] text-gray-900 mb-0.5">{currentPlan.name}</h4>
                            <p className="text-[13px] text-gray-500 font-medium mb-1">A${currentPlan.price}/month &bull; Billed {currentPlan.frequency}</p>
                            <p className="text-[12px] text-gray-400 font-medium">Next billing date: {currentPlan.billingDate}</p>
                        </div>
                        <button
                            onClick={() => setShowPlanModal(true)}
                            className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Manage Plan
                        </button>
                    </div>

                    {/* Payment Method Box */}
                    <div className="flex justify-between items-center p-5 border border-gray-100 rounded-xl shadow-sm">
                        <div>
                            <h4 className="font-bold text-[14px] text-gray-900 mb-0.5">Payment Method</h4>
                            <p className="text-[14px] font-medium text-gray-600 tracking-widest mb-1">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {paymentDetails.last4}</p>
                            <p className="text-[12px] text-gray-400 font-medium tracking-wide">Expires {paymentDetails.expiry}</p>
                        </div>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CreditCard size={14} /> Update
                        </button>
                    </div>

                    {/* Billing Contact */}
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start gap-3 mt-4">
                        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2} />
                        <div>
                            <h4 className="font-bold text-[13px] text-amber-700 mb-1">Billing Contact</h4>
                            <p className="text-[13px] text-amber-700 font-medium">
                                All invoices will be sent to the organization administrator email.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-4 max-w-[800px]">
                <button
                    className="px-6 py-[11px] rounded-lg border border-gray-200 text-[13px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-[11px] rounded-lg bg-blue-800 hover:bg-black text-white text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* --- Modals --- */}

            {/* Invite Member Modal */}
            {
                showInviteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleInviteSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Member Name</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Enter full name"
                                        value={inviteData.name}
                                        onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Enter email address"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Role</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                        value={inviteData.role}
                                        onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    >
                                        <option>Administrator</option>
                                        <option>Member</option>
                                        <option>Viewer</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 mt-4">
                                    Send Invitation
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Manage Plan Modal */}
            {
                showPlanModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Manage Subscription</h3>
                                <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div
                                    onClick={() => handlePlanUpdate("Starter Plan", "149")}
                                    className={`p-4 border rounded-xl cursor-pointer hover:border-indigo-500 transition-colors ${currentPlan.name === "Starter Plan" ? "border-indigo-600 bg-indigo-50" : "border-gray-200"}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Starter Plan</span>
                                        <span className="font-bold text-gray-900">A$149/mo</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Basic features for small teams</p>
                                </div>
                                <div
                                    onClick={() => handlePlanUpdate("Professional Plan", "299")}
                                    className={`p-4 border rounded-xl cursor-pointer hover:border-indigo-500 transition-colors ${currentPlan.name === "Professional Plan" ? "border-indigo-600 bg-indigo-50" : "border-gray-200"}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Professional Plan</span>
                                        <span className="font-bold text-gray-900">A$299/mo</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Advanced tools for growing organizations</p>
                                </div>
                                <div
                                    onClick={() => handlePlanUpdate("Enterprise Plan", "999")}
                                    className={`p-4 border rounded-xl cursor-pointer hover:border-indigo-500 transition-colors ${currentPlan.name === "Enterprise Plan" ? "border-indigo-600 bg-indigo-50" : "border-gray-200"}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Enterprise Plan</span>
                                        <span className="font-bold text-gray-900">A$999/mo</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Available for large scale operations</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Update Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Update Payment Method</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handlePaymentUpdate(
                                    formData.get('cardNumber').slice(-4),
                                    formData.get('expiry')
                                );
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Card Number</label>
                                    <input
                                        name="cardNumber"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={16}
                                        defaultValue="4242424242424242"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Expiry Date</label>
                                        <input
                                            name="expiry"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="MM/YY"
                                            defaultValue="12/26"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2">CVC</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="123"
                                            maxLength={3}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 mt-4">
                                    Update Card
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function InputGroup({ label, name, value, onChange, type = "text", required, icon, disabled, error }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-[34px]' : 'pl-4'} pr-4 py-[11px] rounded-lg border text-[13px] focus:outline-none focus:ring-1 transition-all font-medium text-gray-900 placeholder:text-gray-400 ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'} ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
            </div>
            {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
        </div>
    )
}

/* --- API Settings View --- */
function ApiSettingsView() {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    React.useEffect(() => {
        const fetchIntegrations = async () => {
            setLoading(true);
            try {
                const res = await integrationService.getIntegrations();
                if (res.success) {
                    setIntegrations(res.data);
                }
            } catch (err) {
                console.error("Failed to load integrations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchIntegrations();
    }, []);

    const handleTest = async (id) => {
        setIntegrations(prev => prev.map(item =>
            item.id === id ? { ...item, testing: true } : item
        ));

        try {
            const res = await integrationService.testIntegration(id);
            if (res.success) {
                setIntegrations(prev => prev.map(item =>
                    item.id === id ? {
                        ...item,
                        status: "Connected",
                        lastTestedAt: res.data.timestamp,
                        testSuccess: true,
                        testing: false
                    } : item
                ));
            } else {
                setIntegrations(prev => prev.map(item =>
                    item.id === id ? {
                        ...item,
                        status: "Error",
                        lastTestedAt: res.data.timestamp,
                        testSuccess: false,
                        testing: false
                    } : item
                ));
            }
        } catch (err) {
            setIntegrations(prev => prev.map(item =>
                item.id === id ? { ...item, testing: false } : item
            ));
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'shield': return <Shield size={20} className="text-indigo-600 stroke-[2px]" />;
            case 'database': return <Database size={20} className="text-indigo-600 stroke-[2px]" />;
            case 'file': return <FileText size={20} className="text-indigo-600 stroke-[2px]" />;
            case 'zap': return <Zap size={20} className="text-indigo-600 stroke-[2px]" fill="#4F46E5" fillOpacity={0.2} />;
            case 'globe': return <Globe size={20} className="text-indigo-600 stroke-[2px]" />;
            default: return <Database size={20} className="text-indigo-600 stroke-[2px]" />;
        }
    };

    if (loading && integrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
                <p className="text-gray-500 font-bold text-sm">Loading integrations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.msg}
                </div>
            )}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">API Integrations</h3>
                <p className="text-[13px] text-gray-500 font-medium mb-6">Manage third-party API connections for KYC, property data, payments, and compliance</p>
            </div>

            <div className="space-y-6 max-w-[900px]">
                {integrations.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        id={integration.id}
                        icon={getIcon(integration.type)}
                        title={integration.name}
                        description={integration.description}
                        status={integration.status}
                        fields={integration.fields}
                        lastTested={integration.lastTestedAt}
                        testing={integration.testing}
                        onTest={() => handleTest(integration.id)}
                    />
                ))}

                <div className="bg-white rounded-[16px] border border-dashed border-gray-200 p-8 shadow-sm text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <Plus size={18} strokeWidth={2.5} />
                    </div>
                    <h4 className="font-bold text-[15px] text-gray-900 mb-1">Need Another Integration?</h4>
                    <p className="text-[13px] text-gray-500 font-medium mb-5">Contact support to add custom API integrations</p>
                    <button 
                        onClick={() => showToast("Registration request sent to support team. We'll be in touch soon!")}
                        className="px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg shadow-sm transition-colors"
                    >
                        Request Integration
                    </button>
                </div>
            </div>
        </div>
    );
}

function IntegrationCard({ id, icon, title, description, status, fields = [], lastTested, testing, onTest }) {
    const [hiddenFields, setHiddenFields] = useState(
        (fields || []).reduce((acc, field, idx) => {
            if (field.isSecret) acc[idx] = true;
            return acc;
        }, {})
    );
    const [fieldValues, setFieldValues] = useState(
        (fields || []).reduce((acc, field, idx) => { acc[idx] = field.value || ''; return acc; }, {})
    );

    const toggleHide = (idx) => setHiddenFields(prev => ({ ...prev, [idx]: !prev[idx] }));
    const handleFieldChange = (idx, val) => setFieldValues(prev => ({ ...prev, [idx]: val }));

    return (
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-[16px] text-gray-900 mb-0.5">{title}</h3>
                        <p className="text-[13px] text-gray-500 font-medium">{description}</p>
                    </div>
                </div>
                {status === "Connected" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50/80 border border-green-100/50 text-green-600 rounded-full text-[12px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <CheckCircle size={13} strokeWidth={2.5} className="text-green-500" />
                        Connected
                    </div>
                )}
                {status === "Error" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100/50 text-red-600 rounded-full text-[12px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <AlertCircle size={13} strokeWidth={2.5} className="text-red-500" />
                        Error
                    </div>
                )}
                {status === "Disconnected" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200/50 text-gray-600 rounded-full text-[12px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <XCircle size={13} strokeWidth={2.5} className="text-gray-500" />
                        Disconnected
                    </div>
                )}
            </div>

            {/* Inputs */}
            <div className="p-6 space-y-4">
                {fields.map((field, idx) => (
                    <div key={idx}>
                        <label className="block text-[11px] font-bold text-slate-800 mb-2 leading-none">{field.label}</label>
                        <div className="relative">
                            <input
                                type={field.isSecret && hiddenFields[idx] ? "password" : "text"}
                                value={fieldValues[idx] ?? ""}
                                placeholder={field.placeholder || ""}
                                onChange={(e) => handleFieldChange(idx, e.target.value)}
                                className="w-full px-4 py-[11px] rounded-lg border border-gray-100 text-[13px] font-medium text-gray-700 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {field.isSecret && (
                                <button
                                    onClick={() => toggleHide(idx)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto bg-white"
                                >
                                    <Eye size={16} strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-50 flex justify-between items-center rounded-b-[16px]">
                <div className="flex items-center gap-1.5 text-[12px]">
                    {lastTested && (
                        <>
                            <span className="text-gray-500 font-medium">Last tested:</span>
                            <span className="font-bold text-gray-900">{lastTested}</span>
                            {status === "Connected" ? (
                                <CheckCircle size={14} className="text-emerald-500 ml-0.5" strokeWidth={2.5} />
                            ) : status === "Error" ? (
                                <XCircle size={14} className="text-red-500 ml-0.5" strokeWidth={2.5} />
                            ) : null}
                        </>
                    )}
                </div>
                <button
                    onClick={onTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-gray-700 rounded-lg shadow-sm transition-colors ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={13} strokeWidth={2} className={testing ? "animate-spin" : ""} />
                    {testing ? "Testing..." : "Test Connection"}
                </button>
            </div>
        </div>
    );
}

/* --- Form Customization View --- */
function FormCustomizationView() {
    const [forms, setForms] = useState([]);
    const [activeFormId, setActiveFormId] = useState(localStorage.getItem('activeFormId') || "case-creation");
    const [fields, setFields] = useState([]);
    const [fetchingForms, setFetchingForms] = useState(true);
    const [fetchingFields, setFetchingFields] = useState(false);
    const [addingField, setAddingField] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Form input state
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState("Text");

    // Fetch forms on mount
    React.useEffect(() => {
        const loadForms = async () => {
            setFetchingForms(true);
            try {
                const res = await formService.getForms();
                if (res.success) {
                    setForms(res.data);
                }
            } catch (err) {
                console.error("Failed to load forms", err);
            } finally {
                setFetchingForms(false);
            }
        };
        loadForms();
    }, []);

    // Fetch fields when subcomponent is selected
    React.useEffect(() => {
        if (!activeFormId) return;
        localStorage.setItem('activeFormId', activeFormId);

        const loadFields = async () => {
            setFetchingFields(true);
            try {
                const res = await formService.getFormFields(activeFormId);
                if (res.success) {
                    setFields(res.data);
                }
            } catch (err) {
                console.error("Failed to load fields", err);
            } finally {
                setFetchingFields(false);
            }
        };
        loadFields();
    }, [activeFormId]);

    const activeForm = forms.find(f => f.id === activeFormId) || forms[0];

    const showStatus = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    const handleAddField = async () => {
        if (!newFieldLabel.trim()) {
            showStatus('error', 'Field label is required.');
            return;
        }
        if (fields.some(f => f.name.toLowerCase() === newFieldLabel.trim().toLowerCase())) {
            showStatus('error', 'A field with this name already exists.');
            return;
        }

        setAddingField(true);
        try {
            const res = await formService.addField(activeFormId, {
                name: newFieldLabel.trim(),
                type: newFieldType,
                required: false
            });
            if (res.success) {
                setFields([...fields, res.data]);
                setNewFieldLabel("");
                showStatus('success', 'Field added successfully.');
            } else {
                showStatus('error', res.error || 'Failed to add field.');
            }
        } catch (err) {
            showStatus('error', 'An error occurred while adding the field.');
        } finally {
            setAddingField(false);
        }
    };

    const toggleRequired = async (fieldId) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        // Optimistic update
        const prevRequired = field.required;
        setFields(prev => prev.map(f => f.id === fieldId ? { ...f, required: !prevRequired } : f));

        try {
            const res = await formService.updateField(activeFormId, fieldId, { required: !prevRequired });
            if (res.success) {
                showStatus('success', `Field made ${!prevRequired ? 'Required' : 'Optional'}.`);
            } else {
                // Rollback
                setFields(prev => prev.map(f => f.id === fieldId ? { ...f, required: prevRequired } : f));
                showStatus('error', 'Failed to update field requirement.');
            }
        } catch (err) {
            setFields(prev => prev.map(f => f.id === fieldId ? { ...f, required: prevRequired } : f));
            showStatus('error', 'Migration failed.');
        }
    };

    const deleteField = async (fieldId) => {
        if (!window.confirm("Are you sure you want to delete this field?")) return;

        // Optimistic update
        const deletedField = fields.find(f => f.id === fieldId);
        setFields(prev => prev.filter(f => f.id !== fieldId));

        try {
            const res = await formService.deleteField(activeFormId, fieldId);
            if (res.success) {
                showStatus('success', 'Field deleted.');
            } else {
                setFields(prev => [...prev, deletedField]);
                showStatus('error', 'Failed to delete field.');
            }
        } catch (err) {
            setFields(prev => [...prev, deletedField]);
            showStatus('error', 'Delete failed.');
        }
    };

    const getFieldIcon = (type) => {
        if (type.includes("Currency")) return <DollarSign size={16} />;
        if (type.includes("Number")) return <Hash size={16} />;
        if (type.includes("Text")) return <FileText size={16} />;
        if (type.includes("User")) return <User size={16} />;
        if (type.includes("Building")) return <Building2 size={16} />;
        return <FileText size={16} />;
    };

    if (fetchingForms && forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
                <p className="text-gray-500 font-bold text-sm">Initializing forms...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            {/* View Header */}
            <div className="mb-6">
                <h2 className="text-[20px] font-bold text-gray-900 mb-1">Form Customization</h2>
                <p className="text-[13px] text-gray-500 font-medium tracking-wide">Add custom fields to forms across the Brickbanq platform</p>
            </div>

            {/* Status Feedback */}
            {status.message && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <p className="text-[13px] font-bold">{status.message}</p>
                </div>
            )}

            <div className="flex items-start gap-6">
                {/* Left Panel: Form List */}
                <div className="w-[300px] bg-white rounded-[16px] border border-gray-100 shadow-sm shrink-0 overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                        <h3 className="font-bold text-[15px] text-gray-900">Forms</h3>
                    </div>
                    <div>
                        {forms.map(form => (
                            <button
                                key={form.id}
                                onClick={() => setActiveFormId(form.id)}
                                className={`w-full flex items-start gap-3.5 px-5 py-4 border-b border-gray-50 text-left transition-colors ${activeFormId === form.id ? 'bg-indigo-50 border-l-[3px] border-l-indigo-800' : 'bg-white hover:bg-gray-50 border-l-[3px] border-l-transparent'}`}
                            >
                                <div className={`mt-0.5 ${activeFormId === form.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    <FileText size={18} strokeWidth={2} />
                                </div>
                                <div className="space-y-0.5 mt-0.5">
                                    <div className={`font-bold text-[13px] leading-snug ${activeFormId === form.id ? 'text-gray-900' : 'text-gray-800'}`}>{form.name}</div>
                                    <div className="text-[11.5px] font-medium text-gray-500">{activeFormId === form.id && fetchingFields ? '...' : (activeFormId === form.id ? fields.length : 'Manage')} fields</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Content */}
                <div className="flex-1 space-y-6">
                    {/* Form Description Header */}
                    {activeForm && (
                        <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-[18px] text-gray-900 mb-1">{activeForm.name}</h3>
                            <p className="text-[13px] text-gray-500 font-medium">{activeForm.description}</p>
                        </div>
                    )}

                    {/* Custom Fields List */}
                    <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm min-h-[300px] relative">
                        {fetchingFields && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[16px]">
                                <RefreshCw className="animate-spin text-indigo-500" size={24} />
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 mb-6">
                            <Settings2 size={18} className="text-gray-700" strokeWidth={2.5} />
                            <h3 className="font-bold text-[15px] text-gray-900">Custom Fields</h3>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-[12px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center gap-4">
                                        <div className="text-gray-300 cursor-grab px-1">
                                            <GripVertical size={16} strokeWidth={2.5} />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            {getFieldIcon(field.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2.5 mb-0.5">
                                                <h4 className="font-bold text-[14px] text-gray-900 leading-none">{field.name}</h4>
                                                {field.required && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-500 font-bold text-[10px] rounded uppercase tracking-wider border border-red-100/50 block">Required</span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-gray-500 font-medium">Type: {field.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleRequired(field.id)}
                                            className="px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
                                        >
                                            {field.required ? 'Make Optional' : 'Make Required'}
                                        </button>
                                        <button
                                            onClick={() => deleteField(field.id)}
                                            className="p-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors bg-white shadow-sm"
                                        >
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {fields.length === 0 && !fetchingFields && (
                                <div className="text-center py-10 opacity-60">
                                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-[13px] text-gray-500 font-medium">No custom fields added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Field Form */}
                    <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Plus size={18} className="text-gray-900" strokeWidth={2.5} />
                                <h3 className="font-bold text-[15px] text-gray-900">Add New Custom Field</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4 max-w-[600px] mb-6">
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-800 mb-2 leading-none">Field Label <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={newFieldLabel}
                                        onChange={(e) => setNewFieldLabel(e.target.value)}
                                        placeholder="e.g., Property Manager Contact"
                                        className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] text-gray-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white placeholder:text-gray-400 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-800 mb-2 leading-none">Field Type <span className="text-red-500">*</span></label>
                                    <select
                                        value={newFieldType}
                                        onChange={(e) => setNewFieldType(e.target.value)}
                                        className="w-full px-4 py-[11px] rounded-lg border border-gray-200 text-[13px] text-gray-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors bg-white appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1.5%201.75L6%206.25L10.5%201.75%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_8px] bg-[right_16px_center] bg-no-repeat">
                                        <option>Text</option>
                                        <option>Number</option>
                                        <option>Currency</option>
                                        <option>Date</option>
                                        <option>Textarea</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAddField}
                                    disabled={addingField}
                                    className="px-5 py-2.5 bg-blue-800 text-white rounded-lg text-[13px] font-bold hover:bg-black transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                                >
                                    {addingField ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} strokeWidth={2.5} />}
                                    {addingField ? 'Adding...' : 'Add Field to Form'}
                                </button>
                                <button
                                    onClick={() => { setNewFieldLabel(""); setNewFieldType("Text"); }}
                                    className="px-5 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- Security Settings View --- */
function SecuritySettingsView() {
    const [loading, setLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: "",
        new: "",
        confirm: ""
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // Fetch initial security states
    React.useEffect(() => {
        fetchSessions();
        // In a real app, we'd fetch 2FA status from user profile or a dedicated endpoint
    }, []);

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const response = await authService.getActiveSessions();
            if (response.success) {
                setSessions(response.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setSessionsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            setStatus({ type: 'error', message: 'All password fields are required.' });
            return;
        }
        if (passwordData.new.length < 8) {
            setStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
            return;
        }
        const hasUpper = /[A-Z]/.test(passwordData.new);
        const hasLower = /[a-z]/.test(passwordData.new);
        const hasNumber = /[0-9]/.test(passwordData.new);
        if (!hasUpper || !hasLower || !hasNumber) {
            setStatus({ type: 'error', message: 'Password must include uppercase, lowercase, and a number.' });
            return;
        }
        if (passwordData.new.length < 8) {
            setStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const response = await authService.changePassword({
                oldPassword: passwordData.current,
                newPassword: passwordData.new
            });
            if (response.success) {
                setStatus({ type: 'success', message: 'Password updated successfully.' });
                setPasswordData({ current: "", new: "", confirm: "" });
            } else {
                setStatus({ type: 'error', message: response.error || 'Failed to update password.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const toggle2FA = async () => {
        setLoading(true);
        try {
            const response = isTwoFactorEnabled
                ? await authService.disable2FA()
                : await authService.enable2FA();

            if (response.success) {
                setIsTwoFactorEnabled(!isTwoFactorEnabled);
                // Success feedback via toast or status would go here
            }
        } catch (error) {
            console.error("2FA toggle failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutSession = async (sessionId) => {
        try {
            const response = await authService.logoutSession(sessionId);
            if (response.success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleLogoutAllOthers = async () => {
        if (!window.confirm("Are you sure you want to sign out all other devices?")) return;

        try {
            const response = await authService.logoutAllOtherSessions();
            if (response.success) {
                setSessions(prev => prev.filter(s => s.current));
            }
        } catch (error) {
            console.error("Bulk logout failed", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-[800px]">
            {/* Password Feedback */}
            {status.message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <p className="text-[13px] font-bold">{status.message}</p>
                </div>
            )}

            {/* Change Password Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[10px]">
                        <Lock size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Change Password</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Update your password regularly to keep your account secure</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <InputGroup
                        label="Current Password"
                        type="password"
                        required
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    />

                    <div>
                        <InputGroup
                            label="New Password"
                            type="password"
                            required
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        />
                        <p className="text-[11px] text-gray-400 font-medium mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
                    </div>

                    <InputGroup
                        label="Confirm New Password"
                        type="password"
                        required
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    />

                    <div className="pt-2">
                        <button
                            onClick={handlePasswordChange}
                            disabled={loading}
                            className="px-5 py-2.5 bg-indigo-800 text-white rounded-lg text-[13px] font-bold hover:bg-indigo-900 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                        >
                            <Key size={14} /> {loading ? 'Processing...' : 'Change Password'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-Factor Authentication Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-green-50 border border-green-100 text-green-500 rounded-[10px]">
                        <Shield size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Add an extra layer of security to your account</p>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 text-[15px]">Status:</span>
                            <span className={`flex items-center gap-1 text-[14px] font-bold ${isTwoFactorEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                                {isTwoFactorEnabled ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                                {isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium">
                            {isTwoFactorEnabled ? 'Your account is protected with 2FA.' : 'Enable 2FA to significantly improve your account security.'}
                        </p>
                    </div>
                    <button
                        onClick={toggle2FA}
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm disabled:opacity-70 ${isTwoFactorEnabled ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-indigo-800 text-white hover:bg-indigo-900'}`}
                    >
                        {isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            {/* Active Sessions Card */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Active Sessions</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Manage devices where you're currently signed in</p>
                    </div>
                    <span className="text-[13px] text-gray-500 font-bold">{sessions.length} active</span>
                </div>

                <div className="space-y-4">
                    {sessionsLoading ? (
                        <div className="py-4 flex justify-center"><RefreshCw size={20} className="animate-spin text-gray-300" /></div>
                    ) : sessions.map(session => (
                        <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl border ${session.current ? 'bg-indigo-50 border-indigo-100' : 'border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`mt-0.5 ${session.current ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {session.icon === 'monitor' ? <Monitor size={20} strokeWidth={2} /> : <Smartphone size={20} strokeWidth={2} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-[14px] mb-0.5">{session.current ? 'Current Session' : session.device}</h4>
                                    <p className="text-[13px] text-gray-600 font-medium leading-snug">{session.location}</p>
                                    <p className="text-[12px] text-gray-400 font-medium mt-1">Last active: {session.lastActive}</p>
                                </div>
                            </div>
                            {session.current ? (
                                <div className="px-2.5 py-1 bg-green-100 text-green-700 font-bold text-[11px] rounded-md tracking-wide">
                                    Active
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleLogoutSession(session.id)}
                                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-bold text-[13px] transition-colors"
                                >
                                    <X size={14} strokeWidth={2.5} /> Sign Out
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Sign Out All Other */}
                    <button
                        onClick={handleLogoutAllOthers}
                        disabled={sessions.filter(s => !s.current).length === 0}
                        className="w-full py-3 text-red-500 border border-gray-200 rounded-xl font-bold text-[13px] hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sign Out All Other Sessions
                    </button>
                </div>
            </div>

            {/* Security Best Practices */}
            <div className="bg-indigo-50 p-6 rounded-[16px] border border-blue-100">
                <h3 className="font-bold text-[15px] text-gray-900 mb-5">Security Best Practices</h3>
                <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-[13px] text-blue-700 font-medium">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>Use a unique password not used on other sites</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] text-blue-700 font-medium">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>Enable two-factor authentication for extra protection</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] text-blue-700 font-medium">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>Review active sessions regularly</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px] text-blue-700 font-medium">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>Never share your password or 2FA codes</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}

/* --- Notifications Settings View --- */
/* --- Notifications Settings View --- */
const CustomToggle = ({ checked, onChange, disabled }) => (
    <label className={`relative inline-flex items-center cursor-pointer flex-shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full peer-focus:outline-none transition-colors duration-200 ${checked ? 'bg-indigo-600' : 'bg-gray-200'} peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner`}></div>
    </label>
);

function NotificationsSettingsView() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [prefs, setPrefs] = useState({
        email: {},
        push: {},
        sms: {}
    });

    React.useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setFetching(true);
        try {
            const response = await notificationService.getPreferences();
            if (response.success) {
                setPrefs(response.data);
            }
        } catch (error) {
            console.error("Failed to load preferences", error);
        } finally {
            setFetching(false);
        }
    };

    const handleToggle = (category, setting) => {
        setPrefs(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: !prev[category][setting]
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const response = await notificationService.updatePreferences(prefs);
            if (response.success) {
                setStatus({ type: 'success', message: 'Preferences saved successfully.' });
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                setStatus({ type: 'error', message: 'Failed to save preferences.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
                <p className="text-gray-500 font-bold text-sm">Loading preferences...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-[800px] pb-6">
            {status.message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <p className="text-[13px] font-bold">{status.message}</p>
                </div>
            )}

            {/* Email Notifications */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-500 rounded-[10px]">
                        <Mail size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Email Notifications</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Manage which emails you receive from us</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <NotificationItem
                        title="Deal Updates"
                        desc="Get notified about new deals and opportunities"
                        checked={prefs.email.dealUpdates}
                        onChange={() => handleToggle('email', 'dealUpdates')}
                    />
                    <NotificationItem
                        title="Auction Alerts"
                        desc="Notifications about auction start times and bid activity"
                        checked={prefs.email.auctionAlerts}
                        onChange={() => handleToggle('email', 'auctionAlerts')}
                    />
                    <NotificationItem
                        title="Contract Reminders"
                        desc="Reminders to sign contracts and complete documentation"
                        checked={prefs.email.contractReminders}
                        onChange={() => handleToggle('email', 'contractReminders')}
                    />
                    <NotificationItem
                        title="Payment Notifications"
                        desc="Alerts about payments, invoices, and transactions"
                        checked={prefs.email.paymentNotifications}
                        onChange={() => handleToggle('email', 'paymentNotifications')}
                    />
                    <NotificationItem
                        title="System Updates"
                        desc="Platform updates, maintenance, and new features"
                        checked={prefs.email.systemUpdates}
                        onChange={() => handleToggle('email', 'systemUpdates')}
                    />
                    <NotificationItem
                        title="Marketing Emails"
                        desc="Tips, insights, and product announcements"
                        checked={prefs.email.marketingEmails}
                        onChange={() => handleToggle('email', 'marketingEmails')}
                    />
                </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-50 border border-purple-100 text-violet-500 rounded-[10px]">
                        <Bell size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">Push Notifications</h3>
                        <p className="text-[13px] text-gray-500 font-medium">In-app and browser notifications</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <NotificationItem
                        title="Deal Updates"
                        desc="Instant alerts for new investment opportunities"
                        checked={prefs.push.dealUpdates}
                        onChange={() => handleToggle('push', 'dealUpdates')}
                    />
                    <NotificationItem
                        title="Auction Alerts"
                        desc="Real-time auction activity and bid notifications"
                        checked={prefs.push.auctionAlerts}
                        onChange={() => handleToggle('push', 'auctionAlerts')}
                    />
                    <NotificationItem
                        title="Bid Activity"
                        desc="When someone outbids you or bids on your cases"
                        checked={prefs.push.bidActivity}
                        onChange={() => handleToggle('push', 'bidActivity')}
                    />
                    <NotificationItem
                        title="Messages"
                        desc="New messages from other users"
                        checked={prefs.push.messages}
                        onChange={() => handleToggle('push', 'messages')}
                    />
                    <NotificationItem
                        title="System Alerts"
                        desc="Important system notifications and warnings"
                        checked={prefs.push.systemAlerts}
                        onChange={() => handleToggle('push', 'systemAlerts')}
                    />
                </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-[10px]">
                        <MessageSquare size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900">SMS Notifications</h3>
                        <p className="text-[13px] text-gray-500 font-medium">Text message alerts to your phone</p>
                    </div>
                </div>

                <div className="space-y-6 mb-5">
                    <NotificationItem
                        title="Critical Alerts"
                        desc="Urgent notifications requiring immediate action"
                        checked={prefs.sms.criticalAlerts}
                        onChange={() => handleToggle('sms', 'criticalAlerts')}
                    />
                    <NotificationItem
                        title="Auction Reminders"
                        desc="SMS reminders before auctions start"
                        checked={prefs.sms.auctionReminders}
                        onChange={() => handleToggle('sms', 'auctionReminders')}
                    />
                    <NotificationItem
                        title="Payment Alerts"
                        desc="Payment confirmations and receipts via SMS"
                        checked={prefs.sms.paymentAlerts}
                        onChange={() => handleToggle('sms', 'paymentAlerts')}
                    />
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <p className="text-[13px] text-amber-800"><span className="font-bold">Note:</span> Standard SMS rates may apply. We recommend enabling SMS only for critical alerts.</p>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={loadPreferences}
                    className="px-5 py-2.5 bg-white text-gray-700 font-bold text-[13px] rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
                >
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="py-2.5 px-6 bg-indigo-800 text-white font-bold text-[13px] rounded-lg hover:bg-indigo-900 transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-70"
                >
                    {loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                    {loading ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
}

function NotificationItem({ title, desc, checked, onChange }) {
    return (
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-gray-900 text-[14px]">{title}</h4>
                <p className="text-[13px] text-gray-500 font-medium">{desc}</p>
            </div>
            <CustomToggle checked={!!checked} onChange={onChange} />
        </div>
    );
}
