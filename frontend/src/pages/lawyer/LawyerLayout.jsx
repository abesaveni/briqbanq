import { Suspense, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LawyerProfileProvider } from './LawyerProfileContext'
import LawyerTopNavBar from '../../components/layout/LawyerTopNavBar'
import { useAuth } from '../../context/AuthContext'

export default function LawyerLayout() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token && !localStorage.getItem('token')) { navigate('/signin', { replace: true }); return; }
    if (user && user.role && user.role !== 'lawyer') {
      navigate(`/${user.role}/dashboard`, { replace: true })
    }
  }, [token, user, navigate])

  if (!token && !localStorage.getItem('token')) return null

  return (
    <LawyerProfileProvider>
      <div className="min-h-screen bg-gray-50">
        <LawyerTopNavBar />
        <main className="pt-14">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
            <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading…</div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </LawyerProfileProvider>
  )
}
