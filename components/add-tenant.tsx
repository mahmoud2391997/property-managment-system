'use client'
import { useState, useRef } from 'react'
import TenantFormFields, { type TenantFormRef } from './tenant-form-fields'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddTenant = ({ onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const formRef = useRef<TenantFormRef>(null)
  const { can } = usePermissions()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Early return if user doesn't have permission to create tenants
  if (!can('tenants.create')) {
    return (
      <div className="text-center py-8 text-gray-500">
        You don't have permission to create tenants.
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const tenantData = formRef.current!.getTenantData()

      const formData = new FormData()
      formData.append('identityType', tenantData.identityType)
      formData.append('identityNumber', tenantData.identityNumber)
      formData.append('firstName', tenantData.firstName)
      formData.append('lastName', tenantData.lastName)
      formData.append('phoneNumber', tenantData.phoneNumber)
      formData.append('email', tenantData.email)

      if (tenantData.profileImage && tenantData.profileThumb) {
        formData.append('profileImage', tenantData.profileImage, 'profile.jpg')
        formData.append('profileThumb', tenantData.profileThumb, 'thumb.jpg')
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant')
      }

      FeedbackToasts.created(
        'Tenant',
        `${data.tenant.firstName} has been added.`
      )

      formRef.current!.reset()
      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create tenant'
      setError(errorMessage)
      FeedbackToasts.createFailed('tenant', errorMessage)
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
        <TenantFormFields ref={formRef} loading={loading} />

        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default AddTenant
