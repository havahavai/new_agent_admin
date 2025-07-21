import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, User, Phone, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
// import SeatPreferenceWidgetSimple from '@/components/SeatPreferenceWidgetSimple'
import SimpleSeatWidget from '@/components/SimpleSeatWidget'
import { getB2BUserInfo, B2BUserResponse, ApiError } from '@/api'
import { logout } from '../api/auth'

const Account = () => {
  const [balance, setBalance] = useState(1250.75)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    emails: [''],
    checkInPreference: undefined as any
  })

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getB2BUserInfo()

        if ('success' in response && response.success) {
          const userResponse = response as B2BUserResponse
          setUserInfo({
            companyName: userResponse.data.companyName,
            firstName: userResponse.data.firstName,
            lastName: userResponse.data.lastName,
            mobileNumber: userResponse.data.mobileNumber,
            emails: userResponse.data.emails,
            checkInPreference: userResponse.data.checkInPreference
          })
          setBalance(parseFloat(userResponse.data.currentBalance))
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          // Keep default values
        }
      } catch (err) {
        console.error('Error fetching user info:', err)
        setError('Failed to load user information')
        // Keep default values
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [])



  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}. Showing fallback data.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="mt-2 text-gray-600">Manage your profile and account settings</p>
        </div>
      </div>

      {/* User Profile Widget */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 text-lg">
            <User className="mr-2 h-5 w-5 flex-shrink-0" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Company Name</p>
                <p className="text-lg font-semibold text-gray-900">{userInfo.companyName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="text-lg font-semibold text-gray-900">{userInfo.mobileNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="text-lg font-semibold text-gray-900">{userInfo.emails[0] || 'No email available'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Widget */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-white text-lg">
            <Wallet className="mr-2 h-5 w-5 flex-shrink-0" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-bold">₹{balance.toFixed(2)}</div>
              <p className="text-blue-100 text-sm">Available for bookings</p>
            </div>

          </div>
        </CardContent>
      </Card>


      <SimpleSeatWidget checkInPreference={userInfo.checkInPreference} />
    </div>
  )
}

export default Account
