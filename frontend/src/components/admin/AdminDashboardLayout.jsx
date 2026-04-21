import { Suspense, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import AdminTopNavBar from './AdminTopNavBar'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboardLayout() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token && !localStorage.getItem('token')) { navigate('/signin', { replace: true }); return; }
    if (user && user.role && user.role !== 'admin') {
      navigate(`/${user.role}/dashboard`, { replace: true })
    }
  }, [token, user, navigate])

  if (!token && !localStorage.getItem('token')) return null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed sidebar — desktop only */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[220px]">
        <AdminTopNavBar />
        <main className="flex-1 pt-11 p-5">
          <Suspense fallback={
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
