'use client'

import { useState, useRef } from 'react'
import Button from '@/components/costume-ui/button'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from 'lucide-react'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { PermissionGuard } from '@/components/permission-guard'

const VALID_IDENTITY_TYPES = ['mykad', 'passport'] as const

type ImportError = {
  row: number
  field: string
  message: string
  value?: string
}

const ImportTenants = () => {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importSuccess, setImportSuccess] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidExcelFile(droppedFile)) {
      setFile(droppedFile)
      setImportErrors([])
      setImportSuccess(false)
    } else {
      FeedbackToasts.createFailed('file', 'Please upload a valid Excel file (.xlsx or .xls)')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidExcelFile(selectedFile)) {
      setFile(selectedFile)
      setImportErrors([])
      setImportSuccess(false)
    } else if (selectedFile) {
      FeedbackToasts.createFailed('file', 'Please upload a valid Excel file (.xlsx or .xls)')
    }
  }

  const isValidExcelFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  }

  const handleImport = async () => {
    if (!file) {
      FeedbackToasts.createFailed('import', 'Please upload a file')
      return
    }

    setIsImporting(true)
    setImportErrors([])
    setImportSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/tenants/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setImportErrors(data.errors)
        } else {
          FeedbackToasts.createFailed('import', data.error || 'Failed to import tenants')
        }
        return
      }

      setImportSuccess(true)
      setImportedCount(data.count)
      FeedbackToasts.created('Tenants', `Successfully imported ${data.count} tenants`)

      // Clear file after successful import
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh to show new data
      router.refresh()
    } catch (error: any) {
      console.error('Import error:', error)
      FeedbackToasts.createFailed('import', 'An error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setImportErrors([])
    setImportSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    // Create a simple CSV template that users can open in Excel
    const headers = ['identity_type', 'identity_number', 'first_name', 'last_name', 'phone_number', 'email']
    const exampleRows = [
      ['mykad', '901234567890', 'Ahmad', 'Bin Ali', '60123456789', 'ahmad@example.com'],
      ['passport', 'AB1234567', 'John', 'Smith', '60187654321', 'john.smith@example.com']
    ]

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'tenants_import_template.csv'
    link.click()
  }

  return (
    <PermissionGuard permission="tenants.create">
      <div className='flex flex-col gap-5'>
      {/* Head section */}
      <section className='flex flex-col gap-2.5'>
        <Breadcrumb
          items={[
            { label: 'Tenants', href: '/tenants' },
            { label: 'Import Tenants' }
          ]}
        />
        <div className='flex items-center justify-between w-full'>
          <div>
            <h2>Import Tenants</h2>
            <span className='texts-body-medium text-(--text-secondary)'>
              Bulk import tenants from an Excel file (maximum 50 tenants per import)
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='flex flex-col gap-6 w-full'>
        {/* Upload File Section */}
        <div className='flex flex-col gap-3 p-5 border border-(--border-strong) rounded-lg'>
          <div className='flex items-center gap-2'>
            <span className='flex items-center justify-center w-6 h-6 rounded-full bg-(--primary-color) text-white text-sm font-medium'>1</span>
            <h3 className='texts-body-large font-semibold'>Upload Excel File</h3>
          </div>

          {/* File Format Guide */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5 shrink-0' />
              <div className='flex flex-col gap-2'>
                <p className='texts-body-medium font-medium text-blue-800'>Required columns in your Excel file:</p>
                <div className='overflow-x-auto'>
                  <table className='texts-caption-large text-blue-700 border-collapse'>
                    <thead>
                      <tr className='border-b border-blue-200'>
                        <th className='text-left py-1 pr-4 font-semibold'>Column</th>
                        <th className='text-left py-1 pr-4 font-semibold'>Format</th>
                        <th className='text-left py-1 font-semibold'>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>identity_type</td>
                        <td className='py-1 pr-4'>
                          One of: <code className='bg-blue-100 px-1 rounded'>mykad</code>, <code className='bg-blue-100 px-1 rounded'>passport</code>
                        </td>
                        <td className='py-1'>mykad</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>identity_number</td>
                        <td className='py-1 pr-4'>
                          MyKad: exactly 12 digits<br />
                          Passport: 6-20 characters
                        </td>
                        <td className='py-1'>901234567890</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>first_name</td>
                        <td className='py-1 pr-4'>Text, 1-100 characters</td>
                        <td className='py-1'>Ahmad</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>last_name</td>
                        <td className='py-1 pr-4'>Text, 1-100 characters (optional, but column required)</td>
                        <td className='py-1'>Bin Ali</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>phone_number</td>
                        <td className='py-1 pr-4'>
                          Numbers only with country code, 8-20 digits<br />
                          <span className='text-xs text-gray-500'>(Do not include + sign, it will be added automatically)</span>
                        </td>
                        <td className='py-1'>60123456789</td>
                      </tr>
                      <tr>
                        <td className='py-1 pr-4 font-medium'>email</td>
                        <td className='py-1 pr-4'>Valid email address</td>
                        <td className='py-1'>ahmad@example.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type='button'
                  onClick={downloadTemplate}
                  className='flex items-center gap-1.5 text-blue-600 hover:text-blue-800 texts-caption-large font-medium mt-1 w-fit'
                >
                  <Download className='w-4 h-4' />
                  Download template file
                </button>
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 p-8',
              'border-2 border-dashed rounded-lg cursor-pointer',
              'transition-colors duration-200',
              isDragging
                ? 'border-(--primary-color) bg-blue-50'
                : 'border-(--border-strong) hover:border-(--primary-color) hover:bg-neutral-50'
            )}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='.xlsx,.xls'
              onChange={handleFileSelect}
              className='hidden'
            />
            {file ? (
              <>
                <FileSpreadsheet className='w-12 h-12 text-green-600' />
                <div className='flex items-center gap-2'>
                  <span className='texts-body-medium font-medium'>{file.name}</span>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className='p-1 hover:bg-neutral-200 rounded-full'
                  >
                    <X className='w-4 h-4 text-neutral-500' />
                  </button>
                </div>
                <span className='texts-caption-large text-(--text-secondary)'>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </>
            ) : (
              <>
                <Upload className='w-12 h-12 text-neutral-400' />
                <div className='text-center'>
                  <span className='texts-body-medium font-medium text-(--primary-color)'>
                    Click to upload
                  </span>
                  <span className='texts-body-medium text-(--text-secondary)'> or drag and drop</span>
                </div>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Excel files only (.xlsx, .xls)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {importErrors.length > 0 && (
          <div className='flex flex-col gap-3 p-5 border border-red-300 bg-red-50 rounded-lg'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='w-5 h-5 text-red-600' />
              <h3 className='texts-body-large font-semibold text-red-800'>
                Import Failed - {importErrors.length} error{importErrors.length > 1 ? 's' : ''} found
              </h3>
            </div>
            <p className='texts-body-medium text-red-700'>
              Please fix the following errors in your Excel file and try again. The entire import was cancelled to ensure data consistency.
            </p>
            <div className='max-h-60 overflow-y-auto'>
              <table className='w-full texts-caption-large'>
                <thead>
                  <tr className='border-b border-red-200'>
                    <th className='text-left py-2 pr-4 font-semibold text-red-800'>Row</th>
                    <th className='text-left py-2 pr-4 font-semibold text-red-800'>Column</th>
                    <th className='text-left py-2 pr-4 font-semibold text-red-800'>Value</th>
                    <th className='text-left py-2 font-semibold text-red-800'>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importErrors.map((error, index) => (
                    <tr key={index} className='border-b border-red-100'>
                      <td className='py-2 pr-4 text-red-700'>{error.row}</td>
                      <td className='py-2 pr-4 text-red-700 font-medium'>{error.field}</td>
                      <td className='py-2 pr-4 text-red-600 font-mono text-xs'>
                        {error.value !== undefined ? `"${error.value}"` : '-'}
                      </td>
                      <td className='py-2 text-red-700'>{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Success Display */}
        {importSuccess && (
          <div className='flex items-center gap-3 p-5 border border-green-300 bg-green-50 rounded-lg'>
            <CheckCircle2 className='w-6 h-6 text-green-600' />
            <div>
              <h3 className='texts-body-large font-semibold text-green-800'>
                Import Successful
              </h3>
              <p className='texts-body-medium text-green-700'>
                {importedCount} tenants have been imported successfully.
              </p>
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className='flex gap-3'>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            loading={isImporting}
            label={isImporting ? 'Importing...' : 'Import Tenants'}
            icon={<Upload className='w-4 h-4 text-white!' />}
          />
          <Button
            variant='secondary'
            onClick={() => router.push('/tenants')}
            label='Cancel'
          />
        </div>
      </div>
      </div>
    </PermissionGuard>
  )
}

export default ImportTenants
