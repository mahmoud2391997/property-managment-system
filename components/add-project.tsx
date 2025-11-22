'use client'

import { useState } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import { malaysiaStates } from '@/utils/data'
import { useRouter } from 'next/navigation'
import { FeedbackToasts } from './costume-ui/feedback-toast'

interface AddProjectProps {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddProject = ({ onSuccess, onLoadingChange }: AddProjectProps) => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, state }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      // Show success toast
      FeedbackToasts.created('Project', `${data.project.title} has been added to your projects.`)

      // Reset form
      setTitle('')
      setState('')

      // Refresh the page to show new project
      router.refresh()

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create project'
      setError(errorMessage)
      FeedbackToasts.createFailed('project', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <form id='dialog-form' onSubmit={handleSubmit} className='flex flex-col gap-7.5'>
      <InputGroup label='Name' isRequired>
        <Input
          placeholder='E.g. Heights Residence Condominium'
          className='w-full'
          minLength={2}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
      </InputGroup>
      <InputGroup label='State' isRequired>
        <Select
          label='States'
          items={malaysiaStates}
          placeholder='Select a state'
          value={state}
          onChange={setState}
          required
          disabled={loading}
          minLength={2}
          maxLength={100}
        />
      </InputGroup>
      {error && (
        <p className='text-red-600 text-sm'>{error}</p>
      )}
    </form>
  )
}

export default AddProject
