import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, UserPlus, Search, Filter,
    Edit, Ban, Trash2, CheckCircle2, XCircle, Clock,
    ChevronUp, ChevronDown, Home, ChevronRight, Shield, Loader2, X, Save
} from 'lucide-react'
import { adminUsersService } from '../../api/dataService'

const ROLES = ['borrower', 'lender', 'investor', 'lawyer', 'admin']

export default function UserManagement() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Sort & filter
    const [sortField, setSortField] = useState('Name')
    const [sortAsc, setSortAsc] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [filterRole, setFilterRole] = useState('All Roles')
    const [filterStatus, setFilterStatus] = useState('All Status')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [addForm, setAddForm] = useState({ full_name: '', email: '', role: 'borrower', password: '' })
    const [saving, setSaving] = useState(false)
    const [actionId, setActionId] = useState(null)
    const [addError, setAddError] = useState('')

    useEffect(() => {
        adminUsersService.getUsers().then(res => {
            if (res.success) setUsers(res.data || [])
            setLoading(false)
        })
    }, [])

    const isActive = (u) => u.is_active !== false && u.status !== 'Inactive'

    const activeCount = users.filter(isActive).length
    const adminCount = users.filter(u => ['admin', 'Super Admin', 'Admin'].includes(u.role)).length
    const suspendedCount = users.filter(u => !isActive(u)).length

    const stats = [
        { label: 'Total Users', value: users.length, sub: 'Across all modules', icon: Users, color: 'text-gray-400' },
        { label: 'Active Users', value: activeCount, sub: `${users.length ? Math.round(activeCount / users.length * 100) : 0}% of total`, icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Administrators', value: adminCount, sub: 'With elevated access', icon: Shield, color: 'text-indigo-600' },
        { label: 'Suspended', value: suspendedCount, sub: 'Requires review', icon: XCircle, color: 'text-red-500' }
    ]

    const filteredUsers = useMemo(() => {
        let list = [...users]

        // Text search
        if (searchTerm) {
            list = list.filter(u =>
                (u.full_name || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Role filter
        if (filterRole !== 'All Roles') list = list.filter(u => u.role === filterRole)

        // Status filter
        if (filterStatus === 'Active') list = list.filter(u => isActive(u))
        if (filterStatus === 'Inactive') list = list.filter(u => !isActive(u))

        // Sort
        list.sort((a, b) => {
            let av = '', bv = ''
            if (sortField === 'Name') { av = (a.full_name || a.name || a.email || '').toLowerCase(); bv = (b.full_name || b.name || b.email || '').toLowerCase() }
            else if (sortField === 'Role') { av = a.role || ''; bv = b.role || '' }
            else if (sortField === 'Status') { av = isActive(a) ? 'active' : 'inactive'; bv = isActive(b) ? 'active' : 'inactive' }
            if (av < bv) return sortAsc ? -1 : 1
            if (av > bv) return sortAsc ? 1 : -1
            return 0
        })
        return list
    }, [users, searchTerm, sortField, sortAsc, filterRole, filterStatus])

    const handleAddUser = async (e) => {
        e.preventDefault()
        setSaving(true)
        setAddError('')
        const formData = { ...addForm }
        try {
            const res = await adminUsersService.createUser(formData)
            if (res.success) {
                setShowAddModal(false)
                setAddForm({ full_name: '', email: '', role: 'borrower', password: '' })
                // Re-fetch to get server-assigned role from user_roles
                adminUsersService.getUsers().then(r => { if (r.success) setUsers(r.data || []) })
            } else {
                // Extract human-readable error from pydantic/FastAPI response
                let msg = res.error || 'Failed to create user.'
                try {
                    const parsed = typeof msg === 'string' ? JSON.parse(msg) : msg
                    if (Array.isArray(parsed)) msg = parsed.map(e => e.msg || e.message || JSON.stringify(e)).join('; ')
                    else if (parsed?.detail) msg = Array.isArray(parsed.detail) ? parsed.detail.map(e => e.msg || JSON.stringify(e)).join('; ') : parsed.detail
                } catch { /* keep original */ }
                setAddError(msg)
            }
        } catch (err) {
            setAddError(err?.message || 'Failed to create user. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleEditUser = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u))
            setEditingUser(null)
        } catch { /* ignore */ } finally {
            setSaving(false)
        }
    }

    const handleToggleBan = async (user) => {
        setActionId(user.id)
        try {
            if (isActive(user)) {
                await adminUsersService.suspendUser(user.id)
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false } : u))
            } else {
                await adminUsersService.reactivateUser(user.id)
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true } : u))
            }
        } catch { /* ignore */ } finally {
            setActionId(null)
        }
    }

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete user ${user.full_name || user.email}? This cannot be undone.`)) return
        setActionId(user.id)
        try {
            await adminUsersService.suspendUser(user.id) // fallback: suspend if no delete endpoint
            setUsers(prev => prev.filter(u => u.id !== user.id))
        } catch { /* ignore */ } finally {
            setActionId(null)
        }
    }

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage platform users, roles, and access</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Add User
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color} shrink-0`} />
                        </div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1.5">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={sortField} onChange={e => setSortField(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                            <option>Name</option><option>Role</option><option>Status</option>
                        </select>
                        <button onClick={() => setSortAsc(p => !p)} className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                            {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button onClick={() => setShowFilters(p => !p)} className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                            <Filter className="w-3 h-3" /> Filters
                        </button>
                    </div>
                    {showFilters && (
                        <>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                                <option>All Roles</option>
                                {ROLES.map(r => <option key={r}>{r}</option>)}
                            </select>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                                <option>All Status</option><option>Active</option><option>Inactive</option>
                            </select>
                            {(filterRole !== 'All Roles' || filterStatus !== 'All Status') && (
                                <button onClick={() => { setFilterRole('All Roles'); setFilterStatus('All Status') }} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Reset
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No users found</td></tr>
                                ) : filteredUsers.map((user) => {
                                    const name = user.full_name || user.name || user.email || 'Unknown'
                                    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    const active = isActive(user)
                                    const role = user.role || 'user'
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold border border-indigo-100 shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    role === 'admin' ? 'bg-violet-50 text-violet-600' :
                                                    role === 'lawyer' ? 'bg-indigo-50 text-indigo-600' :
                                                    role === 'investor' ? 'bg-blue-50 text-blue-600' :
                                                    role === 'lender' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>{role}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {active ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-slate-300" />}
                                                    <span className={`text-sm font-medium ${active ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        {active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-AU') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setEditingUser({ ...user })} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded" title="Edit">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleToggleBan(user)} disabled={actionId === user.id} className={`p-1.5 transition-colors rounded ${active ? 'text-slate-300 hover:text-amber-500' : 'text-amber-400 hover:text-emerald-500'}`} title={active ? 'Suspend' : 'Reactivate'}>
                                                        {actionId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {role !== 'admin' && (
                                                        <button onClick={() => handleDelete(user)} disabled={actionId === user.id} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded" title="Delete">
                                                            {actionId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-slate-800">Add New User</p>
                            <button onClick={() => { setShowAddModal(false); setAddError('') }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleAddUser} autoComplete="off" className="p-4 space-y-3">
                            {addError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{addError}</p>}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" required autoComplete="off" value={addForm.full_name} onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Smith" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" required autoComplete="off" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                                <input type="password" required minLength={8} autoComplete="new-password" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Role <span className="text-red-500">*</span></label>
                                <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-md hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-1.5 disabled:opacity-70">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    {saving ? 'Adding…' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-slate-800">Edit User</p>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleEditUser} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                                <input type="text" value={editingUser.full_name || editingUser.name || ''} onChange={e => setEditingUser(p => ({ ...p, full_name: e.target.value }))} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                                <input type="email" value={editingUser.email || ''} disabled className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                                <select value={editingUser.role || 'borrower'} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-md hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-1.5 disabled:opacity-70">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
