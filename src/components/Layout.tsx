import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Plane,
  Users,
  User,
  LogOut,
  Calendar,
  Briefcase,
  Mail,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Ticket
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { logout, BusinessFlyoLoginResponse } from '../api/auth'
import logoSvg from '../assets/logo.svg'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'

interface LayoutProps {
  children: ReactNode
}

interface NavigationItem {
  name: string
  href?: string
  icon: any
  children?: NavigationItem[]
  section?: string
  showArrow?: boolean
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [userData, setUserData] = useState<BusinessFlyoLoginResponse['data']['user'] | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isEmailBoxesOpen, setIsEmailBoxesOpen] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userDataStr = localStorage.getItem('user')
    if (userDataStr) {
      try {
        const data = JSON.parse(userDataStr) as BusinessFlyoLoginResponse['data']['user']
        setUserData(data)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  const navigation: NavigationItem[] = [
    {
      name: 'Bookings',
      icon: Ticket,
      section: 'Bookings',
      children: [
        { name: 'Calendar View', href: '/booking-calendar', icon: Calendar },
        { name: 'Flight Bookings', href: '/trips', icon: Plane },
      ],
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
      section: 'Clients',
    },
  ]

  const isActive = (href?: string) => {
    if (!href) return false
    return location.pathname === href
  }

  const isParentActive = (item: NavigationItem): boolean => {
    if (item.href && isActive(item.href)) return true
    if (item.children) {
      return item.children.some(child => isActive(child.href))
    }
    return false
  }

  // Get breadcrumb parts based on current route
  const getBreadcrumbParts = (): { parent?: string; active: string } => {
    const pathname = location.pathname
    
    // Handle root path - maps to Calendar View
    if (pathname === '/' || pathname === '/booking-calendar') {
      const bookingsItem = navigation.find(item => item.section === 'Bookings')
      if (bookingsItem?.children) {
        const calendarChild = bookingsItem.children.find(child => 
          child.href === '/booking-calendar' || child.href === '/'
        )
        if (calendarChild) {
          return { parent: bookingsItem.name, active: calendarChild.name }
        }
      }
    }
    
    // Check for sub-items first (children)
    for (const item of navigation) {
      if (item.children) {
        for (const child of item.children) {
          if (child.href && pathname === child.href) {
            return { parent: item.name, active: child.name }
          }
        }
      }
      // Check if parent item is active
      if (item.href && pathname === item.href) {
        return { active: item.name }
      }
    }
    
    // Handle trip details pages - show as Flight Bookings > Trip Details
    if (pathname.startsWith('/trips/') && pathname !== '/trips') {
      const bookingsItem = navigation.find(item => item.section === 'Bookings')
      if (bookingsItem?.children) {
        const flightBookingsChild = bookingsItem.children.find(child => child.href === '/trips')
        if (flightBookingsChild) {
          return { parent: `${bookingsItem.name} > ${flightBookingsChild.name}`, active: 'Trip Details' }
        }
      }
    }
    
    // Default fallback
    return { active: 'Home' }
  }

  // Log navigation for debugging
  useEffect(() => {
    console.log('Layout: Current path:', location.pathname)
  }, [location.pathname])

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
              const isActive = item.href ? location.pathname === item.href : false
              return (
                <Link
                  key={item.name}
                  to={item.href || '#'}
                  onClick={() => console.log(`Navigating to: ${item.href}`)}
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
        <div className={`fixed inset-y-0 left-0 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            {/* Top section - Agent Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex h-14 items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center mr-2 flex-shrink-0">
                    <img src={logoSvg} alt={userData?.agentName || 'HavaHavai'} className="h-5 w-5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0">
                      <h1 className="text-base font-bold text-gray-900 truncate leading-tight">{userData?.agentName || 'HavaHavai'}</h1>
                      <p className="text-xs text-gray-500 leading-tight">Enterprise</p>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <button
                    onClick={toggleSidebar}
                    className="ml-2 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    title="Collapse sidebar"
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Collapse button when collapsed */}
            {isSidebarCollapsed && (
              <div className="px-2 py-3 border-b border-gray-200">
                <button
                  onClick={toggleSidebar}
                  className="w-full p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  title="Expand sidebar"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </button>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto">
              {!isSidebarCollapsed && (
                <>
                  {/* Bookings Section */}
                  <div className="px-4 pt-4 pb-2">
                    <h2 className="text-[10px] font-normal text-gray-400 uppercase tracking-wider leading-tight">Bookings</h2>
                  </div>
                  <div className="px-2 pb-3">
                    {navigation.filter(item => item.section === 'Bookings').map((item) => {
                      const Icon = item.icon
                      const hasChildren = item.children && item.children.length > 0
                      const isExpanded = expandedItems.has(item.name)
                      const isItemActive = isParentActive(item)

                      if (hasChildren) {
                        return (
                          <div key={item.name}>
                            <button
                              onClick={() => toggleExpanded(item.name)}
                              className={`group flex items-center w-full px-3 py-2 text-xs font-medium rounded-md leading-normal ${
                                isItemActive
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className="h-5 w-5 mr-3 text-gray-600" />
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                            {isExpanded && item.children && (
                              <div className="ml-8 mt-1 space-y-1">
                                {item.children.map((child) => {
                                  const ChildIcon = child.icon
                                  const childActive = isActive(child.href)
                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href || '#'}
                                      className={`group flex items-center px-3 py-2 text-xs font-normal rounded-md leading-normal ${
                                        childActive
                                          ? 'bg-gray-100 text-gray-900'
                                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                      }`}
                                    >
                                      <ChildIcon className="mr-3 h-4 w-4 text-gray-600" />
                                      {child.name}
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={item.name}
                          to={item.href || '#'}
                          className={`group flex items-center w-full px-3 py-2 text-xs font-medium rounded-md leading-normal ${
                            isActive(item.href)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3 text-gray-600" />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Clients Section */}
                  <div className="px-4 pt-2 pb-2">
                    <h2 className="text-[10px] font-normal text-gray-400 uppercase tracking-wider leading-tight">Clients</h2>
                  </div>
                  <div className="px-2 pb-3">
                    {navigation.filter(item => item.section === 'Clients').map((item) => {
                      const Icon = item.icon
                      const itemActive = isActive(item.href)
                      return (
                        <Link
                          key={item.name}
                          to={item.href || '#'}
                          className={`group flex items-center w-full px-3 py-2 text-xs font-medium rounded-md leading-normal ${
                            itemActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3 text-gray-600" />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Collapsed navigation - icons only */}
              {isSidebarCollapsed && (
                <div className="px-2 py-4 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const hasChildren = item.children && item.children.length > 0
                    const itemActive = isActive(item.href) || isParentActive(item)
                    
                    if (hasChildren) {
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggleExpanded(item.name)}
                          className={`flex items-center justify-center p-2 rounded-md ${
                            itemActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          title={item.name}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      )
                    }
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href || '#'}
                        className={`flex items-center justify-center p-2 rounded-md ${
                          itemActive
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        title={item.name}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </nav>

            {/* Bottom section - Email Boxes, User Info, Logout */}
            {!isSidebarCollapsed && (
              <div className="border-t border-gray-200">
                {/* Email Boxes */}
                <button
                  onClick={() => setIsEmailBoxesOpen(true)}
                  className="flex items-center w-full px-3 py-2 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 leading-normal"
                >
                  <Mail className="h-5 w-5 mr-3 text-gray-600" />
                  <span>Email Boxes</span>
                </button>

                {/* User Info */}
                {userData && (
                  <div className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-gray-700 font-medium text-xs">
                          {userData.name?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate leading-tight">{userData.name || userData.agentName || 'User'}</p>
                        <p className="text-[10px] text-gray-400 truncate leading-tight">{userData.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="group flex items-center w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 leading-normal"
                >
                  <LogOut className="h-5 w-5 mr-3 text-gray-600" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Collapsed bottom section */}
            {isSidebarCollapsed && (
              <div className="border-t border-gray-200 px-2 py-4 space-y-2">
                <button
                  onClick={() => setIsEmailBoxesOpen(true)}
                  className="flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  title="Email Boxes"
                >
                  <Mail className="h-5 w-5" />
                </button>
                {userData && (
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-700 font-semibold text-sm">
                        {userData.name?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="group flex items-center justify-center w-full p-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`w-full transition-all duration-300 ${isMobile ? '' : isSidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Top bar */}
        <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white shadow-sm ${
          isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'
        }`}>
          <div className="flex flex-1 items-center min-w-0">
            <div className="flex items-center min-w-0">
              <nav className="flex items-center text-sm" aria-label="Breadcrumb">
                {(() => {
                  const parts = getBreadcrumbParts()
                  return (
                    <>
                      {parts.parent && (
                        <>
                          <span className="text-gray-500">{parts.parent}</span>
                          <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                        </>
                      )}
                      <span className="text-gray-900 font-medium">{parts.active}</span>
                    </>
                  )
                })()}
              </nav>
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

      {/* Email Boxes Modal */}
      <Dialog open={isEmailBoxesOpen} onOpenChange={setIsEmailBoxesOpen}>
        <DialogContent className="max-w-[600px] w-[calc(100%-2rem)] max-h-[85vh] p-0 flex flex-col [&>button]:z-10">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">Existing Email Boxes</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Email boxes connected to your account</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <EmailBoxesContent />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Email Boxes Content Component (extracted from EmailBoxes page)
const EmailBoxesContent = () => {
  const [emailBoxes, setEmailBoxes] = useState<Array<{ email: string; provider: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userDataStr = localStorage.getItem('user')
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr) as BusinessFlyoLoginResponse['data']['user']
        if (userData.emails && Array.isArray(userData.emails)) {
          setEmailBoxes(userData.emails)
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    setLoading(false)
  }, [])

  const getInitials = (email: string): string => {
    const nameMatch = email.match(/^([^@]+)/)
    if (nameMatch) {
      const name = nameMatch[1]
      const parts = name.split(/[._-]/)
      if (parts.length > 0) {
        const firstPart = parts[0]
        if (/^\d/.test(firstPart)) {
          return firstPart.charAt(0)
        }
        return firstPart.charAt(0).toUpperCase()
      }
      if (/^\d/.test(name)) {
        return name.charAt(0)
      }
      return name.charAt(0).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  const getAvatarColor = (email: string): string => {
    const colors = [
      'bg-pink-100 text-pink-600',
      'bg-orange-100 text-orange-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
    ]
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getDisplayName = (email: string): string => {
    const nameMatch = email.match(/^([^@]+)/)
    if (nameMatch) {
      const name = nameMatch[1]
      return name
        .split(/[._-]/)
        .map(part => {
          if (/^\d+$/.test(part)) {
            return part
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join(' ')
    }
    return email
  }

  const getProviderName = (provider: string): string => {
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading email boxes...</div>
      </div>
    )
  }

  return (
    <div>
      {emailBoxes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No email boxes connected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emailBoxes.map((emailBox, index) => (
            <div
              key={index}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0 ${getAvatarColor(emailBox.email)}`}>
                {getInitials(emailBox.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {getDisplayName(emailBox.email)}
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded flex-shrink-0">
                    {getProviderName(emailBox.provider)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{emailBox.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Layout
