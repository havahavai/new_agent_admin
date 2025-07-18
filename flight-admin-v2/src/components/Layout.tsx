import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Plane,
  Users,
  User,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { logout } from '../api/auth'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const navigation = [
    { name: 'Trips', href: '/', icon: Plane },
    { name: 'Passenger', href: '/passengers', icon: Users },
    { name: 'Account', href: '/account', icon: User },
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
          <nav className="flex justify-around py-2 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            <div className="flex h-16 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">Flight Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.href
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Logout button at bottom of sidebar */}
            <div className="px-2 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`w-full ${isMobile ? '' : 'pl-64'}`}>
        {/* Top bar */}
        <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white shadow-sm ${
          isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'
        }`}>
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Flight Admin</h1>
            </div>
            <div className="flex items-center ml-4 space-x-4">
              <div className="text-sm font-medium text-gray-900 truncate">Admin User</div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={`w-full ${isMobile ? 'py-4 pb-20' : 'py-10'}`}>
          <div className={`w-full max-w-full ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
