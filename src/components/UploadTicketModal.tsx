import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, AlertCircle, ChevronDown } from 'lucide-react'
import { uploadTicketByDocument } from '@/api/tickets.service'
import { getClients, Client } from '@/api/clients.service'
import { ApiError } from '@/api/types'

interface UploadTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const UploadTicketModal: React.FC<UploadTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clientEmail, setClientEmail] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Client combobox state
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        setIsLoadingClients(true)
        try {
          const response = await getClients()
          if ('success' in response && response.success) {
            setClients(response.data || [])
          }
        } catch (err) {
          console.error('Error fetching clients:', err)
        } finally {
          setIsLoadingClients(false)
        }
      }
      fetchClients()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    )
  })

  const handleClose = () => {
    if (!isUploading) {
      // Reset form
      setSelectedFile(null)
      setClientEmail('')
      setSearchQuery('')
      setError(null)
      setSuccess(null)
      setIsDropdownOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  const handleClientSelect = (email: string) => {
    setClientEmail(email)
    setSearchQuery('')
    setIsDropdownOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setClientEmail(value)
    setSearchQuery(value)
    setIsDropdownOpen(true)
  }

  const handleInputFocus = () => {
    setIsDropdownOpen(true)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    } else if (e.key === 'ArrowDown' && filteredClients.length > 0) {
      e.preventDefault()
      setIsDropdownOpen(true)
      // Focus first option
      const firstButton = dropdownRef.current?.querySelector('button')
      if (firstButton) {
        (firstButton as HTMLButtonElement).focus()
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset previous states
    setError(null)
    setSuccess(null)

    // Validate file type - only PDF for this endpoint
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
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

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await uploadTicketByDocument(
        selectedFile,
        clientEmail.trim() || undefined
      )

      // Check if response is an error object
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          setSuccess('Ticket uploaded successfully!')
          setTimeout(() => {
            handleClose()
            onSuccess()
          }, 1500)
        } else {
          setError(response.message || 'Failed to upload ticket')
        }
      } else {
        // If response doesn't have success field, treat as success
        setSuccess('Ticket uploaded successfully!')
        setTimeout(() => {
          handleClose()
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload ticket')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const truncateFileName = (fileName: string, maxLength: number = 30): string => {
    if (fileName.length <= maxLength) {
      return fileName
    }
    
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return fileName.substring(0, maxLength) + '...'
    }
    
    const extension = fileName.substring(lastDotIndex)
    const nameWithoutExt = fileName.substring(0, lastDotIndex)
    
    // Truncate name part, keeping extension
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...'
    return truncatedName + extension
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Ticket
          </DialogTitle>
          <DialogDescription>
            Upload a PDF ticket document. Client email is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Client Email (Optional) - Combobox */}
          <div className="relative">
            <Label htmlFor="clientEmail">Client Email (Optional)</Label>
            <div className="relative mt-1">
              <Input
                ref={inputRef}
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                placeholder="Search or enter email..."
                className="pr-10"
                disabled={isUploading}
                autoComplete="off"
              />
              <ChevronDown 
                className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            
            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {isLoadingClients ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    Loading clients...
                  </div>
                ) : filteredClients.length === 0 && searchQuery ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No clients found. You can enter a new email.
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No clients available. Enter an email manually.
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredClients.map((client) => (
                      <button
                        key={client.clientId}
                        type="button"
                        onClick={() => handleClientSelect(client.email)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                      >
                        <span className="text-gray-900">{client.name}</span>
                        <span className="text-gray-500"> — </span>
                        <span className="text-gray-600">{client.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div>
            <Label>Ticket Document (PDF)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mt-1">
              {!selectedFile ? (
                <div className="text-center">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload your flight ticket PDF
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    PDF only (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="ticket-upload"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                    <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium text-gray-900 truncate whitespace-nowrap">
                        {truncateFileName(selectedFile.name, 35)}
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
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UploadTicketModal

