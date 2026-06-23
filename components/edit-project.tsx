'use client'

import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import { malaysiaStates } from '@/utils/data'
import { useRouter } from 'next/navigation'
import { FeedbackToasts } from './costume-ui/feedback-toast'

type Props = {
  projectId: string
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const EditProject = ({ projectId, onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchLoading, setFetchLoading] = useState(true)

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch project')
        }

        setTitle(data.project.title)
        setState(data.project.state)
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch project'
        setError(errorMessage)
        FeedbackToasts.createFailed('project', errorMessage)
      } finally {
        setFetchLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, state }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project')
      }

      // Show success toast
      FeedbackToasts.updated('Project', `${data.project.title} has been updated.`)

      // Refresh the page to show updated project
      router.refresh()

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update project'
      setError(errorMessage)
      FeedbackToasts.createFailed('project', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-neutral-500'>Loading project details...</div>
      </div>
    )
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
        />
      </InputGroup>
      {error && (
        <p className='text-red-600 text-sm'>{error}</p>
      )}
    </form>
  )
}

export default EditProject
