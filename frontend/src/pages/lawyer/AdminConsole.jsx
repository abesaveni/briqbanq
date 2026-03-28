import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  Shield,
} from 'lucide-react'

// Available roles and modules – can be fetched from API later
const ROLES = ['User', 'Admin', 'Super Admin', 'Viewer']
const MODULE_OPTIONS = [
  { id: 'brickbanq', label: 'Brickbanq' },
  { id: 'grow accounting', label: 'Grow Accounting' },
  { id: 'pfa', label: 'Pfa' },
  { id: 'grow hq', label: 'Grow Hq' },
]

const initialUsers = [
  { id: 1, name: 'Admin User', email: 'admin@grow.com', role: 'Super Admin', modules: ['brickbanq', 'grow accounting', 'pfa', 'grow hq'], status: 'Active', lastLogin: '2024-02-13 14:23' },
  { id: 2, name: 'Emily Davis', email: 'emily.davis@corp.com', role: 'Viewer', modules: ['grow accounting'], status: 'Active', lastLogin: '2024-02-13 11:20' },
  { id: 3, name: 'John Smith', email: 'john.smith@example.com', role: 'User', modules: ['brickbanq'], status: 'Active', lastLogin: '2024-02-13 12:15' },
  { id: 4, name: 'Michael Brown', email: 'mbrown@business.com', role: 'User', modules: ['brickbanq', 'grow accounting'], status: 'Inactive', lastLogin: '2024-01-28 09:30' },
  { id: 5, name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'Admin', modules: ['grow accounting'], status: 'Active', lastLogin: '2024-02-12 16:45' },
]

function getInitials(name) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function AddEditUserModal({ user, modules, onClose, onSave }) {
  const isEdit = !!user
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState(user?.role ?? 'User')
  const [selectedModules, setSelectedModules] = useState(() => new Set(user?.modules ?? []))
  const [errors, setErrors] = useState({})

  const toggleModule = (id) => {
    setSelectedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validate = () => {
    const e = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      id: user?.id,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      modules: Array.from(selectedModules),
    })
    onClose()
  }

  const list = modules.length ? modules : MODULE_OPTIONS

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Add User'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={isEdit}
              className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            {isEdit && <p className="mt-1 text-xs text-gray-500">Email cannot be changed when editing.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Module Access</h3>
            <div className="space-y-2">
              {list.map((mod) => (
                <label key={mod.id || mod.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModules.has(mod.id || mod.label)}
                    onChange={() => toggleModule(mod.id || mod.label)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-900">{mod.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              {isEdit ? 'Save' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminConsole() {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('Name')
  const [sortAsc, setSortAsc] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const filteredAndSorted = useMemo(() => {
    let list = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const key = sortBy === 'Name' ? 'name' : sortBy === 'Role' ? 'role' : 'status'
    list = [...list].sort((a, b) => {
      const va = a[key] ?? ''
      const vb = b[key] ?? ''
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' })
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [users, searchTerm, sortBy, sortAsc])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'Active').length
    const admins = users.filter((u) => u.role === 'Admin' || u.role === 'Super Admin').length
    const suspended = users.filter((u) => u.status === 'Suspended' || u.status === 'Inactive').length
    const activePct = total ? Math.round((active / total) * 100) : 0
    return [
      { label: 'Total Users', value: total, sub: 'Across all modules', icon: Users, color: 'text-gray-500' },
      { label: 'Active Users', value: active, sub: `${activePct}% of total`, icon: CheckCircle2, color: 'text-emerald-500' },
      { label: 'Administrators', value: admins, sub: 'With elevated access', icon: Shield, color: 'text-indigo-600' },
      { label: 'Suspended', value: suspended, sub: 'Requires review', icon: XCircle, color: 'text-red-500' },
    ]
  }, [users])

  const openAdd = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const handleSaveUser = (payload) => {
    if (payload.id) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === payload.id
            ? { ...u, name: payload.name, email: payload.email, role: payload.role, modules: payload.modules }
            : u
        )
      )
    } else {
      const lastLogin = new Date().toISOString().slice(0, 16).replace('T', ' ')
      setUsers((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((u) => u.id)) + 1,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          modules: payload.modules,
          status: 'Active',
          lastLogin,
        },
      ])
    }
  }

  const handleDeactivate = (user) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u))
    )
  }

  const handleDelete = (user) => {
    if (user.role === 'Super Admin') return
    if (window.confirm(`Delete user ${user.name}?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform administration and compliance management</p>
          <p className="text-sm text-gray-500">Manage users and their access across all modules.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Name</option>
            <option>Role</option>
            <option>Status</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc((a) => !a)}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            title={sortAsc ? 'Ascending' : 'Descending'}
          >
            {sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-semibold shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Super Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'Admin'
                            ? 'bg-indigo-100 text-indigo-700'
                            : user.role === 'Viewer'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(Array.isArray(user.modules) ? user.modules : []).map((m) => (
                        <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'Active' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        aria-label="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(user)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        aria-label={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      {user.role !== 'Super Admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSorted.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">No users match your search.</div>
        )}
      </div>

      {/* Test ID System – optional floating button */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white text-sm font-medium rounded-full shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          Test ID System
        </button>
      </div>

      {modalOpen && (
        <AddEditUserModal
          user={editingUser}
          modules={MODULE_OPTIONS}
          onClose={() => { setModalOpen(false); setEditingUser(null) }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  )
}
