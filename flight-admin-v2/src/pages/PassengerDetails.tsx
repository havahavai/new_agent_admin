import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowLeft,
  User,
  FileText,
  Upload,
  Download,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countries } from '@/data/countries'
import {
  PassengerDetailsResponse,
  PassengerDetail,
  ApiError,
  uploadUserDocument,
  GetUserId,
  updatePassenger,
  addPassport,
  updatePassport
} from '@/api'
import { getUsersPassengerDetails } from '@/api/passengerDetails'
import SimpleSeatWidget from '@/components/SimpleSeatWidget'

const PassengerDetails = () => {
  // Updated component with document preview fixes
  const navigate = useNavigate()
  const location = useLocation()
  const { id: passengerId } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiPassengers, setApiPassengers] = useState<PassengerDetail[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [showInvalidDocumentDialog, setShowInvalidDocumentDialog] = useState(false)

  // State for update operations
  const [isUpdatingPassenger, setIsUpdatingPassenger] = useState(false)
  const [isUpdatingPassport, setIsUpdatingPassport] = useState(false)
  const [isPassportEditMode, setIsPassportEditMode] = useState(false)

  // Form validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Get passenger data from navigation state if available
  const navigationPassengerData = location.state?.passengerData as PassengerDetail | undefined

  // Passenger data from API
  const [passenger, setPassenger] = useState({
    id: '',
    name: '',
    firstName: '',
    lastName: '',
    email: 'N/A',
    phone: 'N/A',
    hasDocuments: false,
    gender: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportDateOfIssue: '',
    passportExpiry: '',
    passportPlaceOfIssue: '',
    countryOfResidence: '',
    numberOfFlights: 0,
    mainPassenger: false,
    passengerFlightId: 0,
    documentType: '',
    documentUrl: ''
  })

  // Function to fetch passenger details from API
  const fetchPassengerDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // If we have passenger data from navigation, use it directly
        if (navigationPassengerData && passengerId) {
          const document = navigationPassengerData.passengerDocuments[0]
          setPassenger({
            id: `P${navigationPassengerData.passengerId}`,
            name: `${navigationPassengerData.firstName} ${navigationPassengerData.lastName}`,
            firstName: navigationPassengerData.firstName,
            lastName: navigationPassengerData.lastName,
            email: navigationPassengerData.email || '',
            phone: navigationPassengerData.mobileNumber || '',
            hasDocuments: navigationPassengerData.passengerDocuments.length > 0,
            gender: navigationPassengerData.gender || document?.gender || '',
            dateOfBirth: navigationPassengerData.dateOfBirth || document?.dateOfBirth || '',
            nationality: normalizeNationality(navigationPassengerData.nationality || document?.nationality || ''),
            passportNumber: document?.documentNumber || '',
            passportDateOfIssue: document?.dateOfIssue || '',
            passportExpiry: document?.dateOfExpiry || '',
            passportPlaceOfIssue: document?.placeOfIssue || '',
            countryOfResidence: normalizeCountryOfResidence(navigationPassengerData.countryOfResidence || document?.countryOfResidence || ''),
            numberOfFlights: navigationPassengerData.numberOfFlights,
            mainPassenger: navigationPassengerData.mainPassenger,
            passengerFlightId: navigationPassengerData.passengerFlightId,
            documentType: document?.documentType || '',
            documentUrl: document?.documentUrl || ''
          })
          setLoading(false)
          return
        }

        // Fallback to API call if no navigation data
        const response = await getUsersPassengerDetails()

        if ('data' in response) {
          const passengerResponse = response as PassengerDetailsResponse
          setApiPassengers(passengerResponse.data)

          // Find specific passenger if passengerId is provided
          if (passengerId) {
            const foundPassenger = passengerResponse.data.find(p => {
              const formattedId = `P${p.passengerId}`
              return formattedId === passengerId || p.passengerId.toString() === passengerId.replace('P', '')
            })

            if (foundPassenger) {
              const document = foundPassenger.passengerDocuments[0]

              // Debug logging
              console.log('Found passenger data:', {
                nationality: foundPassenger.nationality,
                gender: foundPassenger.gender,
                countryOfResidence: foundPassenger.countryOfResidence,
                email: foundPassenger.email,
                mobileNumber: foundPassenger.mobileNumber
              })

              setPassenger({
                id: `P${foundPassenger.passengerId}`,
                name: `${foundPassenger.firstName} ${foundPassenger.lastName}`,
                firstName: foundPassenger.firstName,
                lastName: foundPassenger.lastName,
                email: foundPassenger.email || '',
                phone: foundPassenger.mobileNumber || '',
                hasDocuments: foundPassenger.passengerDocuments.length > 0,
                gender: foundPassenger.gender || document?.gender || '',
                dateOfBirth: foundPassenger.dateOfBirth || document?.dateOfBirth || '',
                nationality: normalizeNationality(foundPassenger.nationality || document?.nationality || ''),
                passportNumber: document?.documentNumber || '',
                passportDateOfIssue: document?.dateOfIssue || '',
                passportExpiry: document?.dateOfExpiry || '',
                passportPlaceOfIssue: document?.placeOfIssue || '',
                countryOfResidence: normalizeCountryOfResidence(foundPassenger.countryOfResidence || document?.countryOfResidence || ''),
                numberOfFlights: foundPassenger.numberOfFlights,
                mainPassenger: foundPassenger.mainPassenger,
                passengerFlightId: foundPassenger.passengerFlightId,
                documentType: document?.documentType || '',
                documentUrl: document?.documentUrl || ''
              })
            } else {
              // If specific passenger not found, try to find by passenger ID without 'P' prefix
              const passengerIdNumber = passengerId.replace('P', '')
              const fallbackPassenger = passengerResponse.data.find(p =>
                p.passengerId.toString() === passengerIdNumber
              )

              if (fallbackPassenger) {
                const document = fallbackPassenger.passengerDocuments[0]
                setPassenger({
                  id: `P${fallbackPassenger.passengerId}`,
                  name: `${fallbackPassenger.firstName} ${fallbackPassenger.lastName}`,
                  firstName: fallbackPassenger.firstName,
                  lastName: fallbackPassenger.lastName,
                  email: fallbackPassenger.email || '',
                  phone: fallbackPassenger.mobileNumber || '',
                  hasDocuments: fallbackPassenger.passengerDocuments.length > 0,
                  gender: fallbackPassenger.gender || document?.gender || '',
                  dateOfBirth: fallbackPassenger.dateOfBirth || document?.dateOfBirth || '',
                  nationality: normalizeNationality(fallbackPassenger.nationality || document?.nationality || ''),
                  passportNumber: document?.documentNumber || '',
                  passportDateOfIssue: document?.dateOfIssue || '',
                  passportExpiry: document?.dateOfExpiry || '',
                  passportPlaceOfIssue: document?.placeOfIssue || '',
                  countryOfResidence: normalizeCountryOfResidence(fallbackPassenger.countryOfResidence || document?.countryOfResidence || ''),
                  numberOfFlights: fallbackPassenger.numberOfFlights,
                  mainPassenger: fallbackPassenger.mainPassenger,
                  passengerFlightId: fallbackPassenger.passengerFlightId,
                  documentType: document?.documentType || '',
                  documentUrl: document?.documentUrl || ''
                })
              } else {
                // If no passenger found by ID, show the first passenger as fallback
                if (passengerResponse.data.length > 0) {
                  const firstPassenger = passengerResponse.data[0]
                  const document = firstPassenger.passengerDocuments[0]
                  setPassenger({
                    id: `P${firstPassenger.passengerId}`,
                    name: `${firstPassenger.firstName} ${firstPassenger.lastName}`,
                    firstName: firstPassenger.firstName,
                    lastName: firstPassenger.lastName,
                    email: firstPassenger.email || '',
                    phone: firstPassenger.mobileNumber || '',
                    hasDocuments: firstPassenger.passengerDocuments.length > 0,
                    gender: firstPassenger.gender || document?.gender || '',
                    dateOfBirth: firstPassenger.dateOfBirth || document?.dateOfBirth || '',
                    nationality: normalizeNationality(firstPassenger.nationality || document?.nationality || ''),
                    passportNumber: document?.documentNumber || '',
                    passportDateOfIssue: document?.dateOfIssue || '',
                    passportExpiry: document?.dateOfExpiry || '',
                    passportPlaceOfIssue: document?.placeOfIssue || '',
                    countryOfResidence: normalizeCountryOfResidence(firstPassenger.countryOfResidence || document?.countryOfResidence || ''),
                    numberOfFlights: firstPassenger.numberOfFlights,
                    mainPassenger: firstPassenger.mainPassenger,
                    passengerFlightId: firstPassenger.passengerFlightId,
                    documentType: document?.documentType || '',
                    documentUrl: document?.documentUrl || ''
                  })
                  setError(`Passenger with ID ${passengerId} not found. Showing first available passenger.`)
                } else {
                  setError(`Passenger with ID ${passengerId} not found`)
                }
              }
            }
          } else if (passengerResponse.data.length > 0) {
            // If no specific passenger ID, show the first passenger
            const firstPassenger = passengerResponse.data[0]
            const document = firstPassenger.passengerDocuments[0]
            setPassenger({
              id: `P${firstPassenger.passengerId}`,
              name: `${firstPassenger.firstName} ${firstPassenger.lastName}`,
              firstName: firstPassenger.firstName,
              lastName: firstPassenger.lastName,
              email: firstPassenger.email || '',
              phone: firstPassenger.mobileNumber || '',
              hasDocuments: firstPassenger.passengerDocuments.length > 0,
              gender: firstPassenger.gender || document?.gender || '',
              dateOfBirth: firstPassenger.dateOfBirth || document?.dateOfBirth || '',
              nationality: normalizeNationality(firstPassenger.nationality || document?.nationality || ''),
              passportNumber: document?.documentNumber || '',
              passportDateOfIssue: document?.dateOfIssue || '',
              passportExpiry: document?.dateOfExpiry || '',
              passportPlaceOfIssue: document?.placeOfIssue || '',
              countryOfResidence: normalizeCountryOfResidence(firstPassenger.countryOfResidence || document?.countryOfResidence || ''),
              numberOfFlights: firstPassenger.numberOfFlights,
              mainPassenger: firstPassenger.mainPassenger,
              passengerFlightId: firstPassenger.passengerFlightId,
              documentType: document?.documentType || '',
              documentUrl: document?.documentUrl || ''
            })
          }
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
        }
      } catch (err) {
        console.error('Error fetching passenger details:', err)
        setError('Failed to load passenger details')
      } finally {
        setLoading(false)
      }
    }

  // Helper function to normalize nationality and country values
  const normalizeNationality = (nationality: string): string => {
    if (!nationality) return ''

    // First, check if it's already a country code (2 letters)
    if (nationality.length === 2) {
      const upperCode = nationality.toUpperCase()
      const matchingCountry = countries.find(country => country.code === upperCode)
      return matchingCountry ? upperCode : ''
    }

    // Convert to proper case and find matching nationality in countries array
    const normalizedNationality = nationality.toLowerCase()
    const matchingCountry = countries.find(country =>
      country.nationality.toLowerCase() === normalizedNationality
    )

    return matchingCountry ? matchingCountry.code : ''
  }

  const normalizeCountryOfResidence = (countryName: string): string => {
    if (!countryName) return ''

    // Convert to proper case and find matching country name in countries array
    const normalizedCountryName = countryName.toLowerCase()
    const matchingCountry = countries.find(country =>
      country.name.toLowerCase() === normalizedCountryName
    )

    return matchingCountry ? matchingCountry.name.toLowerCase() : countryName.toLowerCase()
  }

  // Fetch passenger details from API
  useEffect(() => {
    fetchPassengerDetails()
  }, [passengerId, navigationPassengerData])







  const handleInputChange = (field: string, value: string) => {
    setPassenger(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validation function for passenger update (only validate filled fields)
  const validatePassengerForm = () => {
    const errors: Record<string, string> = {}

    // Only validate email format if it's provided
    if (passenger.email && passenger.email.trim() && !/\S+@\S+\.\S+/.test(passenger.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Note: For update, we allow partial updates, so no required field validation
    // The API will handle which fields are actually required

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate passport form (using passenger data directly)
  const validatePassportForm = () => {
    const errors: Record<string, string> = {}

    if (!passenger.passportNumber?.trim()) {
      errors.passportNumber = 'Document number is required'
    }
    if (!passenger.passportExpiry) {
      errors.passportExpiry = 'Expiry date is required'
    } else {
      const expiryDate = new Date(passenger.passportExpiry)
      const today = new Date()
      if (expiryDate <= today) {
        errors.passportExpiry = 'Expiry date must be in the future'
      }
    }
    if (!passenger.passportPlaceOfIssue?.trim()) {
      errors.passportPlaceOfIssue = 'Place of issue is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle passenger update
  const handleUpdatePassenger = async () => {
    if (!validatePassengerForm()) {
      return
    }

    try {
      setIsUpdatingPassenger(true)
      setError(null)

      const passengerIdNumber = passenger.id.replace('P', '')

      // Convert nationality code back to nationality name for API
      const nationalityForApi = passenger.nationality ?
        countries.find(country => country.code === passenger.nationality)?.nationality || passenger.nationality
        : ''

      const result = await updatePassenger(
        passengerIdNumber,
        passenger.firstName,
        passenger.lastName,
        passenger.phone || '',
        passenger.email || '',
        passenger.dateOfBirth,
        passenger.gender,
        nationalityForApi,
        passenger.countryOfResidence
      )

      if ('success' in result && result.success) {
        setUploadSuccess('Passenger details updated successfully!')
        // Refresh passenger details
        await fetchPassengerDetails()
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        setError(result.message || 'Failed to update passenger details')
      }
    } catch (err) {
      console.error('Update passenger error:', err)
      setError('An unexpected error occurred while updating passenger details')
    } finally {
      setIsUpdatingPassenger(false)
    }
  }

  // Handle add/update passport (unified function for inline editing)
  const handleSavePassport = async () => {
    if (!validatePassportForm()) {
      return
    }

    try {
      setIsUpdatingPassport(true)
      setError(null)

      const passengerIdNumber = parseInt(passenger.id.replace('P', ''))

      let result
      if (passenger.hasDocuments) {
        // Update existing passport
        const document = navigationPassengerData?.passengerDocuments[0] ||
                       apiPassengers.find(p => p.passengerId.toString() === passenger.id.replace('P', ''))?.passengerDocuments[0]

        if (!document?.documentId) {
          setError('Document ID not found. Cannot update passport.')
          return
        }

        result = await updatePassport(
          document.documentId,
          passenger.passportNumber || '',
          passenger.passportDateOfIssue || '',
          passenger.passportExpiry || '',
          passenger.passportPlaceOfIssue || ''
        )
      } else {
        // Add new passport
        result = await addPassport(
          passengerIdNumber,
          passenger.passportNumber || '',
          passenger.passportDateOfIssue || '',
          passenger.passportExpiry || '',
          passenger.passportPlaceOfIssue || ''
        )
      }

      if ('success' in result && result.success) {
        setUploadSuccess(passenger.hasDocuments ? 'Passport updated successfully!' : 'Passport added successfully!')
        setIsPassportEditMode(false)
        // Refresh passenger details
        await fetchPassengerDetails()
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        setError(result.message || 'Failed to save passport')
      }
    } catch (err) {
      console.error('Save passport error:', err)
      setError('An unexpected error occurred while saving passport')
    } finally {
      setIsUpdatingPassport(false)
    }
  }



  const handleViewDocument = (documentUrl: string) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }

  const handleDownloadDocument = async (documentUrl: string, fileName?: string) => {
    if (!documentUrl) return

    try {
      // Try direct download first (for S3 URLs that support it)
      const link = document.createElement('a')
      link.href = documentUrl

      // Set filename - extract from URL or use default
      const urlParts = documentUrl.split('/')
      const urlFileName = urlParts[urlParts.length - 1]
      const defaultFileName = fileName || urlFileName || `${passenger.documentType || 'document'}_${passenger.id}.${documentUrl.split('.').pop() || 'pdf'}`

      // Set download attribute to force download
      link.download = defaultFileName
      link.target = '_blank'

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Download error:', error)

      // Fallback: try fetch method
      try {
        const response = await fetch(documentUrl, {
          mode: 'cors',
          headers: {
            'Accept': '*/*',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const defaultFileName = `${passenger.documentType || 'document'}_${passenger.id}.${documentUrl.split('.').pop() || 'pdf'}`
        link.download = fileName || defaultFileName

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

      } catch (fetchError) {
        console.error('Fetch download error:', fetchError)
        setError('Failed to download document. Please try viewing the document instead.')
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear previous messages
    setError(null)
    setUploadSuccess(null)

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed')
      return
    }

    try {
      setUploading(true)

      // Get user ID from JWT token
      const jwtToken = localStorage.getItem('jwtToken')
      if (!jwtToken) {
        setError('Authentication token not found. Please login again.')
        return
      }

      const userId = GetUserId(jwtToken)
      if (!userId) {
        setError('Unable to get user ID from token')
        return
      }

      // Get passenger ID (remove 'P' prefix if present)
      const currentPassengerId = passenger.id.replace('P', '')

      console.log('Uploading file:', file.name, 'for user:', userId, 'passenger:', currentPassengerId)

      const result = await uploadUserDocument(userId, currentPassengerId, file)

      if (result.success) {
        // Check if passport was successfully validated
        if (result.data?.passportExtraction?.data.is_passport) {
          setUploadSuccess('Passport document uploaded and validated successfully!')

          // Update passenger to show they now have documents
          setPassenger(prev => ({ ...prev, hasDocuments: true }))

          // Reload passenger details immediately to get updated data
          await fetchPassengerDetails()

          // Clear success message after showing it briefly
          setTimeout(() => {
            setUploadSuccess(null)
          }, 3000)
        } else {
          setUploadSuccess('Document uploaded successfully!')
          // Update passenger to show they now have documents
          setPassenger(prev => ({ ...prev, hasDocuments: true }))

          // Reload passenger details after successful upload
          setTimeout(() => {
            fetchPassengerDetails()
            setUploadSuccess(null)
          }, 2000)
        }
      } else {
        setError(result.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('An unexpected error occurred during upload')
    } finally {
      setUploading(false)
      // Clear the file input
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading passenger details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                {uploadSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !error && !passenger.id && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No passenger data available</p>
          <p className="text-gray-500 text-sm">Please check your connection and try again</p>
        </div>
      )}

      {/* Header */}
      {passenger.id && (
        <>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/passengers')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Passengers</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>

            {/* Header content row */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{passenger.name}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-600">
                  <p>Passenger ID: <span className="font-semibold text-gray-900">{passenger.id}</span></p>
                  <p className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{passenger.numberOfFlights} flight{passenger.numberOfFlights !== 1 ? 's' : ''}</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{passenger.mainPassenger ? 'Primary' : 'Secondary'} passenger</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  passenger.hasDocuments
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {passenger.hasDocuments ? '✓ Documents Complete' : '✗ Documents Missing'}
                </div>
              </div>
            </div>
          </div>



          {/* Accordion Sections */}
          <Accordion type="single" collapsible defaultValue="personal" className="w-full space-y-4">
            {/* Personal Information */}
            <AccordionItem value="personal">
              <AccordionTrigger className="text-left">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <Input
                        value={passenger.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`mt-1 h-9 text-sm ${validationErrors.firstName ? 'border-red-500' : ''}`}
                        placeholder="Enter first name"
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <Input
                        value={passenger.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`mt-1 h-9 text-sm ${validationErrors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Enter last name"
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={passenger.dateOfBirth ? (
                          passenger.dateOfBirth.includes('T')
                            ? passenger.dateOfBirth.split('T')[0]
                            : passenger.dateOfBirth
                        ) : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className={`mt-1 h-9 text-sm ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger className={`mt-1 h-9 text-sm ${validationErrors.gender ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.gender && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input
                        type="email"
                        value={passenger.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`mt-1 h-9 text-sm ${validationErrors.email ? 'border-red-500' : ''}`}
                        placeholder="Enter email address"
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <PhoneInput
                        value={passenger.phone}
                        onChange={(value) => handleInputChange('phone', value || '')}
                        defaultCountry="IN"
                        className="mt-1"
                        style={{
                          '--PhoneInputCountryFlag-height': '1em',
                          '--PhoneInputCountrySelectArrow-color': '#6b7280',
                          '--PhoneInput-color--focus': '#2563eb',
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nationality</label>
                      <Select
                        value={passenger.nationality}
                        onValueChange={(value) => handleInputChange('nationality', value)}
                      >
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue placeholder="Select Nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.nationality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Country of Residence</label>
                      <Select
                        value={passenger.countryOfResidence}
                        onValueChange={(value) => handleInputChange('countryOfResidence', value)}
                      >
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue placeholder="Select Country of Residence" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name.toLowerCase()}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
              </div>

              {/* Update Passenger Button */}
              <div className="border-t pt-4 mt-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    You can update any individual field or multiple fields at once. Only the fields you modify will be updated.
                  </p>
                </div>
                <Button
                  onClick={handleUpdatePassenger}
                  disabled={isUpdatingPassenger}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingPassenger ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Passenger Details'
                  )}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="documents">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Travel Documents</span>
              {passenger.hasDocuments && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {passenger.documentType || 'Document'} Available
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Document Type</label>
                  <Input
                    value={passenger.documentType || 'passport'}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., passport"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Document Number <span className="text-red-500">*</span></label>
                  <Input
                    value={passenger.passportNumber || ''}
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    className={`mt-1 h-9 text-sm ${validationErrors.passportNumber ? 'border-red-500' : ''}`}
                    placeholder="Enter document number"
                    disabled={!isPassportEditMode}
                  />
                  {validationErrors.passportNumber && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.passportNumber}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Issue</label>
                  <Input
                    type="date"
                    value={passenger.passportDateOfIssue || ''}
                    onChange={(e) => handleInputChange('passportDateOfIssue', e.target.value)}
                    className="mt-1 h-9 text-sm"
                    disabled={!isPassportEditMode}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Expiry <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={passenger.passportExpiry || ''}
                    onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                    className={`mt-1 h-9 text-sm ${validationErrors.passportExpiry ? 'border-red-500' : ''}`}
                    disabled={!isPassportEditMode}
                  />
                  {validationErrors.passportExpiry && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.passportExpiry}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Place of Issue <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={passenger.passportPlaceOfIssue || ''}
                    onValueChange={(value) => handleInputChange('passportPlaceOfIssue', value)}
                    disabled={!isPassportEditMode}
                  >
                    <SelectTrigger className={`mt-1 h-9 text-sm ${validationErrors.passportPlaceOfIssue ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.passportPlaceOfIssue && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.passportPlaceOfIssue}</p>
                  )}
                </div>
              </div>

              {/* Document Preview Section */}
              {passenger.hasDocuments && passenger.documentUrl && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700">Document Preview</label>
                  <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {passenger.documentType || 'passport'}_document
                          {passenger.documentUrl ? `.${passenger.documentUrl.split('.').pop()}` : '.pdf'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Document ID: {passenger.passengerFlightId}
                        </p>
                        <p className="text-xs text-gray-500">
                          Number: {passenger.passportNumber}
                        </p>
                        {passenger.documentUrl && (
                          <p className="text-xs text-green-600">
                            ✓ Document available
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(passenger.documentUrl)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(passenger.documentUrl)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Passport Management Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Passport Management</h4>
                  <div className="flex gap-2">
                    {!isPassportEditMode ? (
                      <Button
                        onClick={() => setIsPassportEditMode(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {passenger.hasDocuments ? 'Edit Details' : 'Add Details'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleSavePassport}
                          disabled={isUpdatingPassport}
                          size="sm"
                          className="flex items-center"
                        >
                          {isUpdatingPassport ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsPassportEditMode(false)
                            setValidationErrors({})
                            // Reset form data if needed
                            fetchPassengerDetails()
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isPassportEditMode && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Edit Mode:</strong> You can now modify the passport details above. Click "Save" when done or "Cancel" to discard changes.
                    </p>
                  </div>
                )}
              </div>



              {/* Document Upload Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Upload Document</label>
                <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="file"
                    id="document-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('document-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {passenger.hasDocuments ? 'Replace Document' : 'Upload Passport'}
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
        </>
      )}
    </div>
  )
}

export default PassengerDetails
