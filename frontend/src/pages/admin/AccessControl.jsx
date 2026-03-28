import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Shield, Lock, Users, Key, Plus, ChevronRight, Home,
    Search, Edit, Trash2, CheckCircle2, AlertTriangle, Eye,
    X, Save, Loader2, Check
} from 'lucide-react'

const ALL_PERMISSIONS = [
    { id: 'view_cases', label: 'View Cases', module: 'Cases' },
    { id: 'create_cases', label: 'Create Cases', module: 'Cases' },
    { id: 'edit_cases', label: 'Edit Cases', module: 'Cases' },
    { id: 'delete_cases', label: 'Delete Cases', module: 'Cases' },
    { id: 'approve_cases', label: 'Approve Cases', module: 'Cases' },
    { id: 'view_auctions', label: 'View Auctions', module: 'Auctions' },
    { id: 'manage_auctions', label: 'Manage Auctions', module: 'Auctions' },
    { id: 'place_bids', label: 'Place Bids', module: 'Auctions' },
    { id: 'view_users', label: 'View Users', module: 'Users' },
    { id: 'manage_users', label: 'Manage Users', module: 'Users' },
    { id: 'view_kyc', label: 'View KYC Queue', module: 'Compliance' },
    { id: 'approve_kyc', label: 'Approve/Reject KYC', module: 'Compliance' },
    { id: 'view_contracts', label: 'View Contracts', module: 'Contracts' },
    { id: 'sign_contracts', label: 'Sign Contracts', module: 'Contracts' },
    { id: 'manage_escrow', label: 'Manage Escrow', module: 'Finance' },
    { id: 'view_reports', label: 'View Reports', module: 'Analytics' },
    { id: 'export_reports', label: 'Export Reports', module: 'Analytics' },
    { id: 'manage_settings', label: 'Manage Settings', module: 'Admin' },
    { id: 'manage_roles', label: 'Manage Roles', module: 'Admin' },
    { id: 'view_audit', label: 'View Audit Log', module: 'Admin' },
]

const DEFAULT_ROLES = [
    { id: 1, name: 'Super Administrator', users: 2, description: 'Full access to all modules and features', permissions: ALL_PERMISSIONS.map(p => p.id) },
    { id: 2, name: 'Brickbanq Administrator', users: 5, description: 'Full access to Brickbanq module', permissions: ['view_cases','create_cases','edit_cases','approve_cases','view_auctions','manage_auctions','view_users','view_kyc','approve_kyc','view_contracts','view_reports','export_reports'] },
    { id: 3, name: 'Investor', users: 847, description: 'Can view and bid on deals', permissions: ['view_auctions','place_bids','view_contracts','sign_contracts','view_reports'] },
    { id: 4, name: 'Accountant', users: 12, description: 'Full access to Grow Accounting', permissions: ['view_reports','export_reports','manage_escrow','view_contracts'] },
    { id: 5, name: 'Financial Advisor', users: 45, description: 'Access to PFA module', permissions: ['view_reports','view_cases'] },
]

const MODULE_COLORS = {
    Cases: 'bg-blue-50 text-blue-600',
    Auctions: 'bg-orange-50 text-orange-600',
    Users: 'bg-purple-50 text-purple-600',
    Compliance: 'bg-red-50 text-red-600',
    Contracts: 'bg-green-50 text-green-600',
    Finance: 'bg-emerald-50 text-emerald-600',
    Analytics: 'bg-indigo-50 text-indigo-600',
    Admin: 'bg-gray-100 text-gray-600',
}

export default function AccessControl() {
    const navigate = useNavigate()
    const [roles, setRoles] = useState(DEFAULT_ROLES)
    const [selectedRole, setSelectedRole] = useState(null)
    const [showMatrix, setShowMatrix] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [saving, setSaving] = useState(false)
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] })

    const modules = [...new Set(ALL_PERMISSIONS.map(p => p.module))]

    const handleCreateRole = async (e) => {
        e.preventDefault()
        setSaving(true)
        await new Promise(r => setTimeout(r, 600))
        const created = { ...newRole, id: Date.now(), users: 0 }
        setRoles(prev => [...prev, created])
        setSelectedRole(created)
        setShowCreateModal(false)
        setNewRole({ name: '', description: '', permissions: [] })
        setSaving(false)
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault()
        setSaving(true)
        await new Promise(r => setTimeout(r, 600))
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...editingRole } : r))
        setSelectedRole(prev => prev?.id === editingRole.id ? { ...prev, ...editingRole } : prev)
        setEditingRole(null)
        setSaving(false)
    }

    const handleDeleteRole = (role) => {
        if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return
        setRoles(prev => prev.filter(r => r.id !== role.id))
        if (selectedRole?.id === role.id) setSelectedRole(null)
    }

    const togglePermission = (permId) => {
        if (!selectedRole) return
        const updated = selectedRole.permissions.includes(permId)
            ? selectedRole.permissions.filter(p => p !== permId)
            : [...selectedRole.permissions, permId]
        const updatedRole = { ...selectedRole, permissions: updated }
        setSelectedRole(updatedRole)
        setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r))
    }

    const togglePermissionInForm = (permId, form, setForm) => {
        const perms = form.permissions.includes(permId)
            ? form.permissions.filter(p => p !== permId)
            : [...form.permissions, permId]
        setForm(p => ({ ...p, permissions: perms }))
    }

    const stats = [
        { label: 'Total Roles', value: roles.length, sub: 'Active role configurations', icon: Shield, color: 'text-indigo-600' },
        { label: 'Total Permissions', value: ALL_PERMISSIONS.length, sub: 'Across all modules', icon: Lock, color: 'text-indigo-600' },
        { label: 'Users Assigned', value: roles.reduce((s, r) => s + r.users, 0), sub: 'With role assignments', icon: Users, color: 'text-emerald-500' }
    ]

    return (
        <div className="space-y-8 max-w-7xl pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Control</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">Platform administration and compliance management</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <Shield className="w-4 h-4" /> Create Role
                </button>
            </div>

            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <Home className="w-3.5 h-3.5" />
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gray-900 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600">Access Control</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            <stat.icon className={`w-4 h-4 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Roles List */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Roles</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => { setSelectedRole(role); setShowMatrix(false); }}
                                className={`w-full p-6 text-left hover:bg-gray-50/50 transition-all group relative ${selectedRole?.id === role.id ? 'bg-indigo-50/30' : ''}`}
                            >
                                {selectedRole?.id === role.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-indigo-600 rounded-r-lg" />}
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-sm font-semibold transition-colors ${selectedRole?.id === role.id ? 'text-indigo-600' : 'text-gray-900'}`}>{role.name}</h4>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-400 text-xs font-semibold rounded uppercase tracking-tighter">{role.users}</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-1 mb-2">{role.description}</p>
                                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{role.permissions.length} permissions</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Area */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[600px] flex flex-col p-8">
                    {selectedRole ? (
                        <>
                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-50">
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{selectedRole.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">{selectedRole.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingRole({ ...selectedRole })}
                                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Edit role"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRole(selectedRole)}
                                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete role"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {!showMatrix ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center">
                                    <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 tracking-tight mb-2">Configure Role Permissions</h4>
                                    <p className="text-sm text-gray-500 font-medium mb-8 max-w-sm">
                                        Manage granular access controls for {selectedRole.name} across all platform modules.
                                    </p>
                                    <button
                                        onClick={() => setShowMatrix(true)}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                    >
                                        Open Permission Matrix
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 font-medium">{selectedRole.permissions.length} of {ALL_PERMISSIONS.length} permissions enabled</p>
                                        <button onClick={() => setShowMatrix(false)} className="text-xs text-gray-400 hover:text-gray-600">Collapse</button>
                                    </div>
                                    {modules.map(module => {
                                        const perms = ALL_PERMISSIONS.filter(p => p.module === module)
                                        return (
                                            <div key={module}>
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${MODULE_COLORS[module] || 'bg-gray-100 text-gray-600'}`}>
                                                    {module}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {perms.map(perm => {
                                                        const enabled = selectedRole.permissions.includes(perm.id)
                                                        return (
                                                            <button
                                                                key={perm.id}
                                                                onClick={() => togglePermission(perm.id)}
                                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${enabled ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
                                                            >
                                                                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-indigo-600' : 'border-2 border-gray-300'}`}>
                                                                    {enabled && <Check className="w-2.5 h-2.5 text-white" />}
                                                                </div>
                                                                {perm.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-8 ring-8 ring-gray-100/50">
                                <Shield className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-200 tracking-tight mb-4">Select a role</h3>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">Choose a role from the left sidebar to view and manage assigned permissions and user access.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Role Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-bold text-gray-900">Create New Role</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateRole} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role Name <span className="text-red-500">*</span></label>
                                <input type="text" required value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Senior Analyst" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                                <input type="text" value={newRole.description} onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this role" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-3">Permissions</label>
                                <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-4">
                                    {modules.map(module => (
                                        <div key={module}>
                                            <p className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${MODULE_COLORS[module] || 'bg-gray-100 text-gray-600'}`}>{module}</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {ALL_PERMISSIONS.filter(p => p.module === module).map(perm => {
                                                    const enabled = newRole.permissions.includes(perm.id)
                                                    return (
                                                        <button key={perm.id} type="button" onClick={() => togglePermissionInForm(perm.id, newRole, setNewRole)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${enabled ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                                                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-indigo-600' : 'border-2 border-gray-300'}`}>
                                                                {enabled && <Check className="w-2 h-2 text-white" />}
                                                            </div>
                                                            {perm.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    {saving ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {editingRole && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Edit Role</h3>
                            <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role Name <span className="text-red-500">*</span></label>
                                <input type="text" required value={editingRole.name} onChange={e => setEditingRole(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                                <input type="text" value={editingRole.description} onChange={e => setEditingRole(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingRole(null)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
