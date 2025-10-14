import { useState } from 'react'
import { Plus, X, FileText, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  onAddManually: () => void
  onUploadTicket: () => void
  className?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddManually,
  onUploadTicket,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleAddManually = () => {
    setIsOpen(false)
    onAddManually()
  }

  const handleUploadTicket = () => {
    setIsOpen(false)
    onUploadTicket()
  }

  return (
    <div className={cn('fixed z-40', className)}>
      {/* Backdrop overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed dial options */}
      <div
        className={cn(
          'absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 ease-out',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Add Manually Option */}
        <button
          onClick={handleAddManually}
          className="group flex items-center gap-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 pr-4 pl-4 py-3 hover:scale-105"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
            <Edit3 className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Add Manually
          </span>
        </button>

        {/* Upload Ticket Option */}
        <button
          onClick={handleUploadTicket}
          className="group flex items-center gap-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 pr-4 pl-4 py-3 hover:scale-105"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Upload Ticket
          </span>
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'hover:shadow-xl hover:scale-110 active:scale-95',
          isOpen && 'rotate-45'
        )}
        aria-label={isOpen ? 'Close menu' : 'Add flight'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}

export default FloatingActionButton

