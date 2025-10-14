import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, CheckCircle2, Plane, MapPin, ArrowRight, User, Briefcase } from 'lucide-react'
import {
  uploadTicketByDocument,
  confirmTicketParsing,
  TicketInfo,
  FlightSegment,
  getB2BUserInfo,
  B2BUserResponse,
  ApiError
} from '@/api'

interface UploadTicketDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

type DialogStep = 'upload' | 'review' | 'confirming'

export const UploadTicketDialog: React.FC<UploadTicketDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<DialogStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedTickets, setParsedTickets] = useState<TicketInfo[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch user info when dialog opens
  useEffect(() => {
    if (isOpen && !userEmail) {
      fetchUserInfo()
    }
  }, [isOpen])

  const fetchUserInfo = async () => {
    try {
      const response = await getB2BUserInfo()
      if ('success' in response && response.success) {
        const userResponse = response as B2BUserResponse
        setUserEmail(userResponse.data.emails[0] || '')
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      // Reset form
      setStep('upload')
      setSelectedFile(null)
      setParsedTickets([])
      setError(null)
      setSuccess(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset previous states
    setError(null)
    setSuccess(null)

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, JPEG, JPG, or PNG file.')
      setSelectedFile(null)
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Step 1: Upload and parse ticket
  const handleUploadTicket = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await uploadTicketByDocument(selectedFile)

      // Check if response has success field
      if ('success' in response) {
        if (response.success) {
          // Success response - check for ticket data
          // Handle different possible response structures
          let tickets: TicketInfo[] = []

          if (response.data?.ticket && Array.isArray(response.data.ticket)) {
            tickets = response.data.ticket
          } else if (Array.isArray(response.data)) {
            tickets = response.data
          } else if (response.data) {
            // Single ticket object
            tickets = [response.data as TicketInfo]
          }

          if (tickets.length === 0) {
            setError('No ticket information could be extracted from the file. Please try a different file.')
            setIsUploading(false)
            return
          }

          setParsedTickets(tickets)
          setStep('review')
        } else {
          // Success is false
          const errorResponse = response as ApiError
          setError(errorResponse.message || 'Failed to parse ticket. Please try a different file.')
        }
      } else {
        // No success field - unexpected response
        setError('Unexpected response from server. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload ticket')
    } finally {
      setIsUploading(false)
    }
  }

  // Step 2: Confirm parsed ticket
  const handleConfirmTicket = async () => {
    if (parsedTickets.length === 0) {
      setError('No ticket data to confirm')
      return
    }

    setIsUploading(true)
    setStep('confirming')

    try {
      const response = await confirmTicketParsing(parsedTickets, userEmail)

      if ('success' in response && response.success) {
        await onSuccess()
        handleClose()
      } else {
        const errorResponse = response as ApiError
        setError(errorResponse.message || 'Failed to confirm ticket')
        setStep('review')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm ticket')
      setStep('review')
    } finally {
      setIsUploading(false)
    }
  }

  const handleBackToUpload = () => {
    setStep('upload')
    setParsedTickets([])
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDateTime = (dateTimeStr: string): string => {
    try {
      const date = new Date(dateTimeStr.replace(' ', 'T'))
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateTimeStr
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-blue-600" />
            {step === 'upload' && 'Upload Ticket'}
            {step === 'review' && 'Review Ticket Details'}
            {step === 'confirming' && 'Confirming Ticket'}
          </DialogTitle>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 -mt-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Upload File */}
        {step === 'upload' && (
          <>
            <div className="space-y-4 py-2">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
                {!selectedFile ? (
                  <div className="text-center">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm text-gray-600 mb-1 sm:mb-2">
                      Upload your flight ticket
                    </p>
                    <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                      PDF, JPG, or PNG (Max 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="ticket-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-sm w-full sm:w-auto"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      className="flex-shrink-0 ml-2 p-1.5 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 sm:p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Upload a clear image or PDF of your flight ticket.
                  The system will automatically extract flight details.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadTicket}
                disabled={!selectedFile || isUploading}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Parse Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Review Parsed Ticket */}
        {step === 'review' && parsedTickets.length > 0 && (
          <>
            <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto">
              {parsedTickets.map((ticket, ticketIndex) => (
                <div key={ticketIndex} className="border border-gray-200 rounded-lg p-3">
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)} Journey
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      PNR: <span className="font-medium text-gray-700">{ticket.pnr}</span>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="space-y-2">
                    {ticket.flights.map((flight, flightIndex) => (
                      <div key={flightIndex} className="bg-gray-50 rounded-md p-2.5">
                        {/* Flight Number and Class */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-600">
                            {flight.flight_number.toUpperCase()}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {ticket.class}
                          </span>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{flight.dep_airport}</span>
                            <span className="text-gray-500">{formatDateTime(flight.departure_date_time)}</span>
                          </div>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{flight.arr_airport}</span>
                            <span className="text-gray-500">{formatDateTime(flight.arrival_date_time)}</span>
                          </div>
                        </div>

                        {/* Cities */}
                        <div className="text-xs text-gray-600 mb-2">
                          {flight.dep_city} → {flight.arr_city}
                        </div>

                        {/* Passengers */}
                        {flight.passengers.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 mb-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-600">
                                Passengers ({flight.passengers.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {flight.passengers.map((passenger, passengerIndex) => (
                                <div key={passengerIndex} className="text-xs text-gray-700 flex items-center gap-2">
                                  <span>{passenger.first_name} {passenger.last_name}</span>
                                  {passenger.seat_info && (
                                    <span className="text-gray-500">• Seat: {passenger.seat_info}</span>
                                  )}
                                  {passenger.baggage_info && (
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Briefcase className="h-3 w-3" />
                                      {passenger.baggage_info.check_in}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToUpload}
                disabled={isUploading}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConfirmTicket}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : (
                  'Confirm Ticket'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Confirming (Loading State) */}
        {step === 'confirming' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Confirming your ticket...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UploadTicketDialog

