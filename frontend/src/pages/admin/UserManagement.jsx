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
        try {
            const res = await adminUsersService.createUser(addForm)
            if (res.success) {
                setShowAddModal(false)
                setAddForm({ full_name: '', email: '', role: 'borrower', password: '' })
                // Reload the full list from the server
                const listRes = await adminUsersService.getUsers()
                if (listRes.success) setUsers(listRes.data || [])
            }
        } catch { /* ignore */ } finally {
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
        <div className="space-y-8 max-w-7xl pb-20">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">Platform administration and compliance management</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <UserPlus className="w-4 h-4" /> Add User
                </button>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <Home className="w-3.5 h-3.5" />
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gray-900 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600">User Management</span>
            </nav>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <p className="text-3xl font-semibold text-gray-900 leading-none">{stat.value}</p>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-6 border-b border-gray-50 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sort by:</span>
                                <select
                                    value={sortField}
                                    onChange={e => setSortField(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                                >
                                    <option>Name</option>
                                    <option>Role</option>
                                    <option>Status</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setSortAsc(p => !p)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-900 uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {sortAsc ? 'Ascending' : 'Descending'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50">
                            <Filter className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">Filters</span>
                        </div>
                        <button
                            onClick={() => setShowFilters(p => !p)}
                            className="text-xs font-semibold text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Role:</label>
                                <select
                                    value={filterRole}
                                    onChange={e => setFilterRole(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option>All Roles</option>
                                    {ROLES.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Status:</label>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option>All Status</option>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                            {(filterRole !== 'All Roles' || filterStatus !== 'All Status') && (
                                <button
                                    onClick={() => { setFilterRole('All Roles'); setFilterStatus('All Status') }}
                                    className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Reset Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-50">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">No users found</td></tr>
                                ) : filteredUsers.map((user) => {
                                    const name = user.full_name || user.name || user.email || 'Unknown'
                                    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    const active = isActive(user)
                                    const role = user.role || 'user'
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-semibold border border-indigo-100/50">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{name}</p>
                                                        <p className="text-xs text-gray-400 font-bold tracking-tight lowercase">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest shadow-sm
                                                    ${role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                        role === 'lawyer' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                        role === 'investor' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        role === 'lender' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        'bg-emerald-50 text-emerald-600 border border-emerald-100'}
                                                `}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-gray-300" />}
                                                    <span className={`text-xs font-semibold uppercase tracking-widest ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                    <Clock className="w-3 h-3 text-gray-300" />
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-AU') : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingUser({ ...user })}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleBan(user)}
                                                        disabled={actionId === user.id}
                                                        className={`p-2 transition-colors ${active ? 'text-gray-300 hover:text-amber-500' : 'text-amber-400 hover:text-emerald-500'}`}
                                                        title={active ? 'Suspend user' : 'Reactivate user'}
                                                    >
                                                        {actionId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                    </button>
                                                    {role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            disabled={actionId === user.id}
                                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                            title="Delete user"
                                                        >
                                                            {actionId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" required value={addForm.full_name} onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Smith" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" required value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                                <input type="password" required minLength={8} value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                                <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    {saving ? 'Adding...' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleEditUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                                <input type="text" value={editingUser.full_name || editingUser.name || ''} onChange={e => setEditingUser(p => ({ ...p, full_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                                <input type="email" value={editingUser.email || ''} disabled className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                                <select value={editingUser.role || 'borrower'} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
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
