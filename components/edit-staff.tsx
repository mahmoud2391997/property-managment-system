'use client'
import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'

type Props = {
  staffId: string
  firstName: string
  lastName: string | null
  phoneNumber: string
  roleId: string
  isOwner: boolean
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

interface Role {
  id: string
  title: string
}

const EditStaff = ({ staffId, firstName, lastName, phoneNumber, roleId, isOwner, onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const { can } = usePermissions()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [editFirstName, setEditFirstName] = useState<string>(firstName)
  const [editLastName, setEditLastName] = useState<string | null>(lastName)
  const [editPhoneNumber, setEditPhoneNumber] = useState<string>(phoneNumber)
  const [editRoleId, setEditRoleId] = useState<string>(roleId)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true)

  const canEdit = can('staff.update')
  const canChangeRole = can('staff.change_role')

  if (!canEdit) {
    return (
      <div className="text-center py-8 text-gray-500">
        You don't have permission to edit staff members.
      </div>
    )
  }

  const styles = {
    inputsContainer: 'grid grid-cols-2 items-start gap-5'
  }

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const response = await fetch('/api/roles')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch roles')
        }

        setRoles(data.roles)
      } catch (err: any) {
        console.error('Error fetching roles:', err)
        FeedbackToasts.operationFailed(
          'Loading roles',
          'Could not load roles from server'
        )
      } finally {
        setLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const body: any = {
        first_name: editFirstName,
        last_name: editLastName,
        phone_number: editPhoneNumber
      }

      if (canChangeRole) {
        body.role_id = editRoleId
      }

      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff')
      }

      FeedbackToasts.updated('Staff', `${editFirstName} has been updated.`)

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update staff'
      setError(errorMessage)
      FeedbackToasts.updateFailed('staff', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <>
      <form
        id='dialog-form'
        onSubmit={handleSubmit}
        className='flex flex-col gap-7.5'
      >
        <div className={styles.inputsContainer}>
          <InputGroup label='First Name' isRequired>
            <Input
              placeholder='E.g. Mohammed'
              value={editFirstName}
              onChange={e => setEditFirstName(e.target.value)}
              minLength={1}
              maxLength={100}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Last Name'>
            <Input
              placeholder='E.g. Ali'
              value={editLastName ?? ''}
              onChange={e => setEditLastName(e.target.value)}
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
          </InputGroup>
        </div>

        <InputGroup
          label='Phone Number'
          className='overflow-visible!'
          isRequired
        >
          <Input
            phoneNumber
            value={editPhoneNumber}
            onChange={setEditPhoneNumber}
            required
            disabled={loading}
          />
        </InputGroup>

        {canChangeRole && (
          <div className={styles.inputsContainer}>
            <InputGroup label='Role' isRequired>
              <Select
                label='Roles'
                items={roles.map(role => role.title)}
                placeholder={loadingRoles ? 'Loading roles...' : 'Select a role'}
                value={roles.find(r => r.id === editRoleId)?.title ?? ''}
                onValueChange={value => {
                  const selectedRole = roles.find(r => r.title === value)
                  if (selectedRole) setEditRoleId(selectedRole.id)
                }}
                required
                disabled={loading || loadingRoles}
              />
            </InputGroup>
          </div>
        )}
        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default EditStaff
