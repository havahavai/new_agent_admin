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
  Download
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countries } from '@/data/countries'

const PassengerDetails = () => {
  const navigate = useNavigate()

  // Mock passenger data - in real app, this would come from API
  const [passenger, setPassenger] = useState({
    id: 'P001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    hasDocuments: true,
    gender: 'Male',
    dateOfBirth: '1985-03-20',
    nationality: 'US',
    passportNumber: 'US123456789',
    passportDateOfIssue: '2018-12-15',
    passportExpiry: '2028-12-15',
    passportPlaceOfIssue: 'New York, NY',
    countryOfResidence: 'US'
  })







  const handleInputChange = (field: string, value: string) => {
    setPassenger(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In real app, would upload file to server
      console.log('Uploading file:', file.name)
      // Update passenger to show they now have documents
      setPassenger(prev => ({ ...prev, hasDocuments: true }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{passenger.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">{passenger.email}</p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible defaultValue="personal" className="w-full">
        <AccordionItem value="personal">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    value={passenger.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <Input
                    type="date"
                    value={passenger.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={passenger.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <PhoneInput
                    value={passenger.phone}
                    onChange={(value) => handleInputChange('phone', value || '')}
                    defaultCountry="US"
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
                    <SelectTrigger className="mt-1">
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
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="documents">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Travel Documents</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
                  <Select
                    value={passenger.gender || ''}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date Of Birth <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={passenger.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="mt-1"
                    placeholder="dd-mm-yyyy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Number <span className="text-red-500">*</span></label>
                  <Input
                    value={passenger.passportNumber || ''}
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    className="mt-1"
                    placeholder="Enter passport number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Issue</label>
                  <Input
                    type="date"
                    value={passenger.passportDateOfIssue || ''}
                    onChange={(e) => handleInputChange('passportDateOfIssue', e.target.value)}
                    className="mt-1"
                    placeholder="dd-mm-yyyy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Expiry <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={passenger.passportExpiry || ''}
                    onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                    className="mt-1"
                    placeholder="dd-mm-yyyy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nationality <span className="text-red-500">*</span></label>
                  <Select
                    value={passenger.nationality || ''}
                    onValueChange={(value) => handleInputChange('nationality', value)}
                  >
                    <SelectTrigger className="mt-1">
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
                  <label className="text-sm font-medium text-gray-700">Place of Issue</label>
                  <Select
                    value={passenger.passportPlaceOfIssue || ''}
                    onValueChange={(value) => handleInputChange('passportPlaceOfIssue', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Place of Issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country of Residence</label>
                  <Select
                    value={passenger.countryOfResidence || ''}
                    onValueChange={(value) => handleInputChange('countryOfResidence', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Country of Residence" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {passenger.hasDocuments && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700">Document Preview</label>
                  <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">passport_document.pdf</p>
                        <p className="text-xs text-gray-500">Uploaded on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {passenger.hasDocuments ? 'Replace Document' : 'Upload Passport'}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default PassengerDetails
