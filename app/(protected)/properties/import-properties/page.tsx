'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/costume-ui/button'
import InputGroup from '@/components/costume-ui/input-group'
import Select from '@/components/costume-ui/select'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from 'lucide-react'
import type { projects } from '@prisma/client'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { PermissionGuard } from '@/components/permission-guard'

const PROPERTY_TYPES = ['House', 'Apartment', 'Studio', 'Commercial_Unit'] as const
const PROPERTY_STATUSES = ['Ready', 'Pending_Inspection', 'Under_Preparation'] as const

type ImportError = {
  row: number
  field: string
  message: string
  value?: string
}

const ImportProperties = () => {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<projects[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedProject, setSelectedProject] = useState<projects>()

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importSuccess, setImportSuccess] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

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
    if (!file || !selectedProject) {
      FeedbackToasts.createFailed('import', 'Please select a project and upload a file')
      return
    }

    setIsImporting(true)
    setImportErrors([])
    setImportSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', selectedProject.id)

      const response = await fetch('/api/properties/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setImportErrors(data.errors)
        } else {
          FeedbackToasts.createFailed('import', data.error || 'Failed to import properties')
        }
        return
      }

      setImportSuccess(true)
      setImportedCount(data.count)
      FeedbackToasts.created('Properties', `Successfully imported ${data.count} properties`)

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
    const headers = ['code', 'street_address', 'city', 'postal_code', 'type', 'status']
    const exampleRows = [
      ['B-2-1', 'Bukit Burueng', 'Ayer Keroh', '75450', 'Apartment', 'Ready'],
      ['C-3-2', 'Jalan Harmoni', 'Petaling Jaya', '46000', 'House', 'Pending_Inspection'],
      ['D-1-5', 'Taman Melati', 'Kuala Lumpur', '53100', 'Studio', 'Under_Preparation'],
      ['E-4-3', 'Business Park', 'Shah Alam', '40150', 'Commercial_Unit', 'Ready']
    ]

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'properties_import_template.csv'
    link.click()
  }

  return (
    <PermissionGuard permission="properties.create">
      <div className='flex flex-col gap-5'>
      {/* Head section */}
      <section className='flex flex-col gap-2.5'>
        <Breadcrumb
          items={[
            { label: 'Properties', href: '/properties' },
            { label: 'Import Properties' }
          ]}
        />
        <div className='flex items-center justify-between w-full'>
          <div>
            <h2>Import Properties</h2>
            <span className='texts-body-medium text-(--text-secondary)'>
              Bulk import properties from an Excel file
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='flex flex-col gap-6 w-full'>
        {/* Step 1: Select Project */}
        <div className='flex flex-col gap-3 p-5 border border-(--border-strong) rounded-lg'>
          <div className='flex items-center gap-2'>
            <span className='flex items-center justify-center w-6 h-6 rounded-full bg-(--primary-color) text-white text-sm font-medium'>1</span>
            <h3 className='texts-body-large font-semibold'>Select Project</h3>
          </div>
          <p className='texts-body-medium text-(--text-secondary)'>
            All imported properties will be assigned to the selected project.
          </p>
          <InputGroup label='Project' isRequired>
            <Select
              items={projects.map((p: any) => ({ value: p.id, label: p.title }))}
              label='Projects'
              placeholder={loadingProjects ? 'Loading projects...' : 'Select a project'}
              required
              value={selectedProject?.id}
              onValueChange={(id: string) => {
                const project = projects.find(p => p.id === id)
                setSelectedProject(project)
              }}
              disabled={loadingProjects}
            />
          </InputGroup>
          {selectedProject && (
            <p className='texts-caption-large text-(--text-secondary)'>
              State: <span className='font-medium'>{selectedProject.state}</span> (automatically applied to all properties)
            </p>
          )}
        </div>

        {/* Step 2: Upload File */}
        <div className='flex flex-col gap-3 p-5 border border-(--border-strong) rounded-lg'>
          <div className='flex items-center gap-2'>
            <span className='flex items-center justify-center w-6 h-6 rounded-full bg-(--primary-color) text-white text-sm font-medium'>2</span>
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
                        <td className='py-1 pr-4 font-medium'>code</td>
                        <td className='py-1 pr-4'>Text, 1-50 characters</td>
                        <td className='py-1'>B-2-1</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>street_address</td>
                        <td className='py-1 pr-4'>Text, 5-300 characters</td>
                        <td className='py-1'>Jalan 123, Bukit Burueng</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>city</td>
                        <td className='py-1 pr-4'>Text, 1-100 characters</td>
                        <td className='py-1'>Ayer Keroh</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>postal_code</td>
                        <td className='py-1 pr-4'>Text, 4-10 characters</td>
                        <td className='py-1'>50450</td>
                      </tr>
                      <tr className='border-b border-blue-100'>
                        <td className='py-1 pr-4 font-medium'>type</td>
                        <td className='py-1 pr-4'>
                          One of: <code className='bg-blue-100 px-1 rounded'>House</code>, <code className='bg-blue-100 px-1 rounded'>Apartment</code>, <code className='bg-blue-100 px-1 rounded'>Studio</code>, <code className='bg-blue-100 px-1 rounded'>Commercial_Unit</code>
                        </td>
                        <td className='py-1'>Apartment</td>
                      </tr>
                      <tr>
                        <td className='py-1 pr-4 font-medium'>status</td>
                        <td className='py-1 pr-4'>
                          One of: <code className='bg-blue-100 px-1 rounded'>Ready</code>, <code className='bg-blue-100 px-1 rounded'>Pending_Inspection</code>, <code className='bg-blue-100 px-1 rounded'>Under_Preparation</code>
                        </td>
                        <td className='py-1'>Ready</td>
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
                {importedCount} properties have been imported successfully.
              </p>
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className='flex gap-3'>
          <Button
            onClick={handleImport}
            disabled={!file || !selectedProject || isImporting}
            loading={isImporting}
            label={isImporting ? 'Importing...' : 'Import Properties'}
            icon={<Upload className='w-4 h-4 text-white!' />}
          />
          <Button
            variant='secondary'
            onClick={() => router.push('/properties')}
            label='Cancel'
          />
        </div>
      </div>
      </div>
    </PermissionGuard>
  )
}

export default ImportProperties
