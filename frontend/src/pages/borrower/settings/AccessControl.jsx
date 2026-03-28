import { useState } from 'react'
import { Breadcrumb } from './SettingsComponents'
export default function AccessControl() {
  const [roles] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)

  const selectedRole = roles.find((r) => r.id === selectedRoleId)
  const totalRoles = roles.length
  const totalPermissions = 27
  const usersAssigned = roles.reduce((s, r) => s + (r.count || 0), 0)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '🏠', link: '/borrower/dashboard' }, { label: 'Dashboard', link: '/borrower/dashboard' }, { label: 'Settings', link: '/borrower/settings' }, { label: 'Access Control' }]} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Access Control</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your mortgage resolution case</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Access Control</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage roles and permissions across all modules</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-3xl font-bold text-slate-900">{totalRoles}</p>
            <p className="text-sm font-medium text-slate-700 mt-1">Total Roles</p>
            <p className="text-xs text-slate-500">Active role configurations</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-3xl font-bold text-slate-900">{totalPermissions}</p>
            <p className="text-sm font-medium text-slate-700 mt-1">Total Permissions</p>
            <p className="text-xs text-slate-500">Across all modules</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-3xl font-bold text-slate-900">{usersAssigned}</p>
            <p className="text-sm font-medium text-slate-700 mt-1">Users Assigned</p>
            <p className="text-xs text-slate-500">With role assignments</p>
          </div>
        </div>
        <button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded inline-flex items-center gap-2">
          <span>+</span> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Roles</h3>
          <ul className="space-y-3">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedRoleId === r.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    {r.count != null && <span className="text-xs text-slate-500">{r.count} users</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{r.permissions} permissions</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a role</h3>
          {selectedRole ? (
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedRole.name}</p>
              <p className="text-sm text-slate-500 mt-1">{selectedRole.description}</p>
              <p className="text-sm text-slate-500 mt-2">{selectedRole.permissions} permissions</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <p className="text-sm font-medium text-slate-700">Select a role to view and edit permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
