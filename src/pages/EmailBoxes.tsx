import { useState, useEffect } from 'react'
import { BusinessFlyoLoginResponse } from '../api/auth'

interface EmailBox {
  email: string
  provider: string
}

const EmailBoxes = () => {
  const [emailBoxes, setEmailBoxes] = useState<EmailBox[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
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
    // Extract name from email or use first letter
    const nameMatch = email.match(/^([^@]+)/)
    if (nameMatch) {
      const name = nameMatch[1]
      // Try to extract first letter or number
      const parts = name.split(/[._-]/)
      if (parts.length > 0) {
        const firstPart = parts[0]
        // If it starts with a number, return the number
        if (/^\d/.test(firstPart)) {
          return firstPart.charAt(0)
        }
        return firstPart.charAt(0).toUpperCase()
      }
      // If starts with number, return number
      if (/^\d/.test(name)) {
        return name.charAt(0)
      }
      return name.charAt(0).toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  const getAvatarColor = (email: string): string => {
    // Generate a consistent color based on email
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
    // Try to extract name from email
    const nameMatch = email.match(/^([^@]+)/)
    if (nameMatch) {
      const name = nameMatch[1]
      // Convert to title case, handling numbers
      return name
        .split(/[._-]/)
        .map(part => {
          // If it's a number, return as is
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading email boxes...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Existing Email Boxes</h1>
            <p className="text-sm text-gray-500 mt-1">Email boxes connected to your account</p>
          </div>
        </div>

        {/* Email Boxes List */}
        <div className="p-6">
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
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg mr-4 ${getAvatarColor(emailBox.email)}`}>
                    {getInitials(emailBox.email)}
                  </div>

                  {/* Email Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getDisplayName(emailBox.email)}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
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
      </div>
    </div>
  )
}

export default EmailBoxes

