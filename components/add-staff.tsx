'use client'
import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import PhotoUploader from './costume-ui/photo-uploader'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

interface Role {
  id: string
  title: string
}

const AddStaff = ({ onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [roleId, setRoleId] = useState<string>('')
  const [profileImage, setProfileImage] = useState<Blob | null>(null)
  const [profileThumb, setProfileThumb] = useState<Blob | null>(null)
  const [photoUploaderKey, setPhotoUploaderKey] = useState<number>(0)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true)

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

  const handlePhotoSave = (mainBlob: Blob, thumbBlob: Blob) => {
    setProfileImage(mainBlob)
    setProfileThumb(thumbBlob)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('firstName', firstName)
      if (lastName) formData.append('lastName', lastName)
      formData.append('email', email)
      formData.append('phoneNumber', phoneNumber)
      formData.append('roleId', roleId)

      if (profileImage && profileThumb) {
        formData.append('profileImage', profileImage, 'profile.jpg')
        formData.append('profileThumb', profileThumb, 'thumb.jpg')
      }

      const response = await fetch('/api/staff', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff')
      }

      FeedbackToasts.created('Staff', `${data.staff.firstName} has been added.`)

      setFirstName('')
      setLastName(null)
      setEmail('')
      setPhoneNumber('')
      setRoleId('')
      setProfileImage(null)
      setProfileThumb(null)
      setPhotoUploaderKey(prev => prev + 1)

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create staff'
      setError(errorMessage)
      FeedbackToasts.createFailed('staff', errorMessage)
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
        <PhotoUploader
          key={photoUploaderKey}
          description='Upload staff profile picture here optionally'
          loading={loading}
          onSave={handlePhotoSave}
        />

        <div className={styles.inputsContainer}>
          <InputGroup label='First Name' isRequired>
            <Input
              placeholder='E.g. Mohammed'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              minLength={1}
              maxLength={100}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Last Name'>
            <Input
              placeholder='E.g. Ali'
              value={lastName ?? ''}
              onChange={e => setLastName(e.target.value)}
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
          <InputGroup label='Email' isRequired>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              minLength={5}
              maxLength={255}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup
            label='Phone Number'
            className='overflow-visible!'
            isRequired
          >
            <Input
              phoneNumber
              value={phoneNumber}
              onChange={setPhoneNumber}
              required
              disabled={loading}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
          <InputGroup label='Role' isRequired>
            <Select
              label='Roles'
              items={roles.map(role => role.title)}
              placeholder={loadingRoles ? 'Loading roles...' : 'Select a role'}
              value={roles.find(r => r.id === roleId)?.title ?? ''}
              onValueChange={value => {
                const selectedRole = roles.find(r => r.title === value)
                if (selectedRole) setRoleId(selectedRole.id)
              }}
              required
              disabled={loading || loadingRoles}
            />
          </InputGroup>
        </div>
        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default AddStaff
