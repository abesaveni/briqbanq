import { useState, useMemo, useEffect } from 'react'
import { Breadcrumb, FormInput } from './SettingsComponents'
import { userManagementService } from '../services'

const SORT_OPTIONS = [{ value: 'name', label: 'Name' }, { value: 'email', label: 'Email' }, { value: 'role', label: 'Role' }, { value: 'status', label: 'Status' }, { value: 'lastLogin', label: 'Last Login' }]

function roleBadgeClass(role) {
  if (role === 'Super Admin') return 'bg-indigo-600 text-white'
  if (role === 'Admin') return 'bg-blue-500 text-white'
  if (role === 'User') return 'bg-slate-500 text-white'
  return 'bg-slate-400 text-white'
}

function getAvatar(name) {
  return name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [, setShowFilters] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('Viewer')

  useEffect(() => {
    let cancelled = false
    userManagementService.getUsers()
      .then((usersList) => {
        if (!cancelled && Array.isArray(usersList) && usersList.length) {
          setUsers(usersList)
        }
      })
      .catch(() => {
        // Service handles fallback
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
    list = [...list].sort((a, b) => {
      let va = a[sortBy] ?? ''
      let vb = b[sortBy] ?? ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [users, search, sortBy, sortAsc])

  const total = users.length
  const active = users.filter((u) => u.status === 'Active').length
  const admins = users.filter((u) => u.role === 'Super Admin' || u.role === 'Admin').length
  const suspended = users.filter((u) => u.status === 'Inactive').length

  const deleteUser = async (id) => {
    try {
      await userManagementService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      // Service handles offline case
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const addUser = async () => {
    const name = addName.trim()
    const email = addEmail.trim()
    if (!name || !email) return
    
    try {
      const newUser = await userManagementService.createUser({
        name,
        email,
        role: addRole,
        avatar: getAvatar(name),
        modules: ['brickbanq'],
        status: 'Active',
        lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' '),
      })
      setUsers((prev) => [...prev, newUser])
      setAddName('')
      setAddEmail('')
      setAddRole('Viewer')
      setShowAddUser(false)
    } catch {
      // Service handles offline case
      const newUser = { id: Date.now(), avatar: getAvatar(name), name, email, role: addRole, modules: ['brickbanq'], status: 'Active', lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' ') }
      setUsers((prev) => [...prev, newUser])
      setAddName('')
      setAddEmail('')
      setAddRole('Viewer')
      setShowAddUser(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '🏠', link: '/borrower/dashboard' }, { label: 'Dashboard', link: '/borrower/dashboard' }, { label: 'Settings', link: '/borrower/settings' }, { label: 'User Management' }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage users and their access across all modules.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-3xl font-bold text-slate-900">{total}</p>
          <p className="text-sm font-medium text-slate-700 mt-1">Total Users</p>
          <p className="text-xs text-slate-500">Across all modules</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-3xl font-bold text-slate-900">{active}</p>
          <p className="text-sm font-medium text-slate-700 mt-1">Active Users</p>
          <p className="text-xs text-slate-500">{total ? Math.round((active / total) * 100) : 0}% of total</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-3xl font-bold text-slate-900">{admins}</p>
          <p className="text-sm font-medium text-slate-700 mt-1">Administrators</p>
          <p className="text-xs text-slate-500">With elevated access</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-3xl font-bold text-slate-900">{suspended}</p>
          <p className="text-sm font-medium text-slate-700 mt-1">Suspended</p>
          <p className="text-xs text-slate-500">Requires review</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or email..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setSortAsc((a) => !a)} className="text-sm text-slate-600 hover:text-slate-900">
          {sortAsc ? 'Ascending ↑' : 'Descending ↓'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filters</span>
          <button type="button" onClick={() => setShowFilters((v) => !v)} className="border border-slate-300 bg-white text-slate-700 text-sm px-3 py-1.5 rounded hover:bg-slate-50">Show Filters</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-slate-500 font-medium px-4 py-3">USER</th>
              <th className="text-left text-slate-500 font-medium px-4 py-3">ROLE</th>
              <th className="text-left text-slate-500 font-medium px-4 py-3">MODULES</th>
              <th className="text-left text-slate-500 font-medium px-4 py-3">STATUS</th>
              <th className="text-left text-slate-500 font-medium px-4 py-3">LAST LOGIN</th>
              <th className="text-right text-slate-500 font-medium px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">{u.avatar}</div>
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                <td className="px-4 py-3"><span className="text-slate-600">{u.modules.join(', ')}</span></td>
                <td className="px-4 py-3">{u.status === 'Active' ? <span className="text-emerald-600">✓ Active</span> : <span className="text-slate-500">○ Inactive</span>}</td>
                <td className="px-4 py-3 text-slate-600">{u.lastLogin}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded hover:border-indigo-300" title="Edit">✏️</button>
                  <button type="button" className="p-2 ml-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded" title="View">👁️</button>
                  <button type="button" onClick={() => deleteUser(u.id)} className="p-2 ml-1 text-slate-400 hover:text-red-600 border border-slate-200 rounded" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500">No users match your search.</div>}
      </div>
      <div className="flex flex-col items-end gap-4">
        {showAddUser && (
          <div className="w-full max-w-md p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-end">
            <FormInput label="Name" value={addName} onChange={(e) => setAddName(e.target.value.replace(/[^a-zA-Z\s''-]/g, ''))} placeholder="Full name" />
            <FormInput label="Email" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@example.com" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={addRole} onChange={(e) => setAddRole(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <button type="button" onClick={addUser} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded">Add</button>
            <button type="button" onClick={() => { setShowAddUser(false); setAddName(''); setAddEmail('') }} className="border border-slate-300 bg-white text-slate-700 text-sm px-4 py-2 rounded hover:bg-slate-50">Cancel</button>
          </div>
        )}
        <button type="button" onClick={() => setShowAddUser((s) => !s)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded">+ Add User</button>
      </div>
    </div>
  )
}
