import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadBulkPassports, BulkPassportUploadResponse, ApiError, GetUserId } from '@/api';

interface BulkPassportUploadProps {
  userId?: string | number;
}

const BulkPassportUpload: React.FC<BulkPassportUploadProps> = ({ userId }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get userId from JWT token if not provided
  const getUserId = (): string | number | null => {
    if (userId) return userId;
    
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) return null;
    
    return GetUserId(jwtToken);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setUploadResult({
        success: false,
        message: `Invalid file types detected: ${invalidFiles.map(f => f.name).join(', ')}. Only PDF, JPG, and PNG files are allowed.`
      });
      return;
    }

    // Validate file sizes (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setUploadResult({
        success: false,
        message: `Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum file size is 5MB.`
      });
      return;
    }

    // Add new files to existing selection instead of replacing
    setSelectedFiles(prev => {
      const existingFileNames = prev.map(f => f.name);
      const newFiles = fileArray.filter(file => !existingFileNames.includes(file.name));

      if (newFiles.length === 0) {
        setUploadResult({
          success: false,
          message: 'All selected files are already in the list.'
        });
        return prev;
      }

      if (newFiles.length < fileArray.length) {
        setUploadResult({
          success: false,
          message: `${fileArray.length - newFiles.length} file(s) were already selected and skipped.`
        });
      } else {
        setUploadResult(null);
      }

      return [...prev, ...newFiles];
    });

    // Clear the input so the same files can be selected again if needed
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadResult({
        success: false,
        message: 'Please select at least one file to upload.'
      });
      return;
    }

    const currentUserId = getUserId();
    if (!currentUserId) {
      setUploadResult({
        success: false,
        message: 'User ID not found. Please login again.'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadResult(null);

      console.log(`Uploading ${selectedFiles.length} files for user ${currentUserId}`);
      
      const result = await uploadBulkPassports(currentUserId, selectedFiles);
      
      if ('success' in result && result.success) {
        const successResult = result as BulkPassportUploadResponse;
        setUploadResult({
          success: true,
          message: successResult.message,
          data: successResult.data
        });
        
        // Clear files after successful upload
        setTimeout(() => {
          clearAllFiles();
        }, 3000);
      } else {
        const errorResult = result as ApiError;
        setUploadResult({
          success: false,
          message: errorResult.message
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: 'An unexpected error occurred during upload.'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-gray-900 text-lg">
          <Upload className="mr-2 h-5 w-5 flex-shrink-0" />
          Bulk Passport Upload
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload multiple passport documents at once (PDF, JPG, PNG - Max 5MB each)
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* File Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              id="bulk-passport-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              {selectedFiles.length > 0 ? 'Add More Files' : 'Select Files'}
            </Button>
            
            {selectedFiles.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearAllFiles}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Passports
                </>
              )}
            </Button>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`p-4 rounded-lg border ${
              uploadResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start space-x-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{uploadResult.message}</p>
                  {uploadResult.success && uploadResult.data && (
                    <p className="text-sm mt-1">
                      Successfully uploaded {uploadResult.data.successfulUploads} out of {uploadResult.data.totalFiles} files.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkPassportUpload;
