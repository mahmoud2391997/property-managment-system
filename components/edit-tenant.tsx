'use client'
import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import PhotoUploader from './costume-ui/photo-uploader'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { Skeleton } from './ui/skeleton'

export type TenantEditData = {
  id: string
  type: 'Individual' | 'Company'
  profile_pic: string | null
  profile_thumb: string | null
  first_name?: string
  last_name?: string | null
  identity_type?: 'mykad' | 'passport'
  identity_number?: string
  phone_number: string
  email: string
  accountStatus?: 'Activated' | 'Pending'
}

type Props = {
  tenantId: string
  initialData?: TenantEditData
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
  onHasChanges?: (hasChanges: boolean) => void
}

const EditTenant = ({
  tenantId,
  initialData,
  onSuccess,
  onLoadingChange,
  onHasChanges
}: Props) => {
  const router = useRouter()
  const identityTypes: string[] = ['mykad', 'passport']

  const [loading, setLoading] = useState<boolean>(false)
  const [fetching, setFetching] = useState<boolean>(!initialData)
  const [error, setError] = useState<string>('')
  const [identityType, setIdentityType] = useState<string>(
    initialData?.identity_type || ''
  )
  const [identityNumber, setIdentityNumber] = useState<string>(
    initialData?.identity_number || ''
  )
  const [firstName, setFirstName] = useState<string>(
    initialData?.first_name || ''
  )
  const [lastName, setLastName] = useState<string>(initialData?.last_name || '')
  const [phoneNumber, setPhoneNumber] = useState<string>(
    initialData?.phone_number || ''
  )
  const [email, setEmail] = useState<string>(initialData?.email || '')
  const [emailError, setEmailError] = useState<string>('')
  const [profileImage, setProfileImage] = useState<Blob | null>(null)
  const [profileThumb, setProfileThumb] = useState<Blob | null>(null)
  const [existingProfilePic, setExistingProfilePic] = useState<string | null>(
    initialData?.profile_pic || null
  )
  const [accountStatus, setAccountStatus] = useState<'Activated' | 'Pending'>(
    initialData?.accountStatus || 'Activated'
  )

  // Store original values to detect changes
  const [originalValues, setOriginalValues] = useState<{
    identityType: string
    identityNumber: string
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
  } | null>(
    initialData
      ? {
          identityType: initialData.identity_type || '',
          identityNumber: initialData.identity_number || '',
          firstName: initialData.first_name || '',
          lastName: initialData.last_name || '',
          phoneNumber: initialData.phone_number || '',
          email: initialData.email || ''
        }
      : null
  )

  // Check if any field has changed
  const hasChanges = originalValues
    ? identityType !== originalValues.identityType ||
      identityNumber !== originalValues.identityNumber ||
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      phoneNumber !== originalValues.phoneNumber ||
      email !== originalValues.email ||
      profileImage !== null
    : false

  // Notify parent of changes
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  const styles = {
    inputsContainer: 'grid grid-cols-2 items-start gap-5'
  }

  // Fetch tenant data if not provided via initialData or if email is missing
  useEffect(() => {
    // Skip fetching if initialData was provided AND has email
    if (initialData && initialData.email) {
      return
    }

    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}`)
        if (response.ok) {
          const data = await response.json()
          const tenant = data.tenant
          const idType = tenant.identity_type || ''
          const idNumber = tenant.identity_number || ''
          const fName = tenant.first_name || ''
          const lName = tenant.last_name || ''
          const phone = tenant.phone_number || ''
          const mail = tenant.email || ''

          // Only update fields that weren't already provided in initialData
          if (!initialData?.identity_type) setIdentityType(idType)
          if (!initialData?.identity_number) setIdentityNumber(idNumber)
          if (!initialData?.first_name) setFirstName(fName)
          if (!initialData?.last_name) setLastName(lName)
          if (!initialData?.phone_number) setPhoneNumber(phone)
          // Always update email since it's fetched from auth
          setEmail(mail)
          if (!initialData?.profile_pic) setExistingProfilePic(tenant.profile_pic)
          if (!initialData?.accountStatus) setAccountStatus(tenant.accountStatus || 'Activated')
          
          // Update original values with the complete data
          setOriginalValues({
            identityType: initialData?.identity_type || idType,
            identityNumber: initialData?.identity_number || idNumber,
            firstName: initialData?.first_name || fName,
            lastName: initialData?.last_name || lName,
            phoneNumber: initialData?.phone_number || phone,
            email: mail // Always use fetched email from auth
          })
        }
      } catch (err) {
        console.error('Error fetching tenant:', err)
        setError('Failed to load tenant data')
      } finally {
        setFetching(false)
      }
    }
    fetchTenant()
  }, [tenantId, initialData])

  const handlePhotoSave = (mainBlob: Blob, thumbBlob: Blob) => {
    setProfileImage(mainBlob)
    setProfileThumb(thumbBlob)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError('Invalid email format')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('identityType', identityType.toLowerCase())
      formData.append('identityNumber', identityNumber)
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('phoneNumber', phoneNumber)
      formData.append('email', email)

      if (profileImage && profileThumb) {
        formData.append('profileImage', profileImage, 'profile.jpg')
        formData.append('profileThumb', profileThumb, 'thumb.jpg')
      }

      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tenant')
      }

      FeedbackToasts.updated(
        'Tenant',
        `${data.tenant.firstName} has been updated.`
      )

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update tenant'
      setError(errorMessage)
      FeedbackToasts.updateFailed('tenant', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  if (fetching) {
    return (
      <div className='flex flex-col gap-7.5'>
        <div className='flex justify-center'>
          <Skeleton className='w-24 h-24 rounded-full bg-neutral-200' />
        </div>
        <div className={styles.inputsContainer}>
          <Skeleton className='h-16 bg-neutral-200' />
          <Skeleton className='h-16 bg-neutral-200' />
        </div>
        <div className={styles.inputsContainer}>
          <Skeleton className='h-16 bg-neutral-200' />
          <Skeleton className='h-16 bg-neutral-200' />
        </div>
        <div className={styles.inputsContainer}>
          <Skeleton className='h-16 bg-neutral-200' />
          <Skeleton className='h-16 bg-neutral-200' />
        </div>
      </div>
    )
  }

  return (
    <>
      <form
        id='dialog-form'
        onSubmit={handleSubmit}
        className='flex flex-col gap-7.5'
      >
        <PhotoUploader
          description='Upload tenant profile picture here optionally'
          loading={loading}
          onSave={handlePhotoSave}
          existingImageUrl={existingProfilePic}
        />

        <div className={styles.inputsContainer}>
          <InputGroup label='Identity' isRequired>
            <Select
              label='Identity Types'
              items={identityTypes}
              placeholder='Select type'
              value={identityType}
              onValueChange={setIdentityType}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Identity No' isRequired>
            <Input
              placeholder={
                identityType === 'mykad'
                  ? 'E.g. 900101014321 (12 digits)'
                  : identityType === 'passport'
                  ? 'E.g. A1234567 (6–20 characters)'
                  : 'Select Identity Type First'
              }
              value={identityNumber}
              onChange={e => {
                let val = e.target.value

                if (identityType === 'mykad') {
                  // Only allow numbers
                  val = val.replace(/\D/g, '')
                }

                setIdentityNumber(val)
              }}
              minLength={identityType === 'mykad' ? 12 : 6}
              maxLength={identityType === 'mykad' ? 12 : 20}
              required
              disabled={loading || !identityType}
            />
          </InputGroup>
        </div>

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
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
          <InputGroup
            label='Phone Number'
            className='overflow-visible!'
            isRequired
          >
            <Input
              phoneNumber
              value={phoneNumber}
              onChange={setPhoneNumber}
              note='Used to redirect to Whatsapp'
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Email' isRequired>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                validateEmail(e.target.value)
              }}
              disabled={loading}
              required
              minLength={5}
              maxLength={255}
            />
            {emailError && (
              <p className='text-red-600 text-sm mt-1'>{emailError}</p>
            )}
          </InputGroup>
        </div>

        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default EditTenant
