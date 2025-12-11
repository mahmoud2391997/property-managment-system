'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { DeleteButtonIcon, ImportButtonIcon } from '@/components/costume-ui/icon'
import TenantsTable from '@/components/tables/tenants-table'
import AddTenantDialog from '@/components/dialogs/add-tenant-dialog'
import { Prisma } from '@prisma/client'

type TenantWithDetails = Prisma.tenantsGetPayload<{
  select: {
    id: true
    profile_thumb: true
    individual_tenants: {
      select: {
        identity_type: true
        identity_number: true
        first_name: true
        last_name: true
        phone_number: true
      }
    }
  }
}> & {
  email?: string
  accountStatus?: 'Activated' | 'Pending'
}

interface TenantsSectionProps {
  tenants: TenantWithDetails[]
}

export default function TenantsSection({ tenants }: TenantsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTenants = useMemo(() => {
    if (!searchTerm.trim()) {
      return tenants
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return tenants.filter(tenant => {
      const firstName = tenant.individual_tenants?.first_name?.toLowerCase() || ''
      const lastName = tenant.individual_tenants?.last_name?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()

      // Search by name (first name, last name, or full name)
      const nameMatch = firstName.includes(lowerSearch) ||
                        lastName.includes(lowerSearch) ||
                        fullName.includes(lowerSearch)

      // Search by identity number
      const identityMatch = tenant.individual_tenants?.identity_number?.toLowerCase().includes(lowerSearch)

      // Search by account status
      const statusMatch = tenant.accountStatus?.toLowerCase().includes(lowerSearch)

      // Search by phone number
      const phoneMatch = tenant.individual_tenants?.phone_number?.toLowerCase().includes(lowerSearch)

      // Search by email
      const emailMatch = tenant.email?.toLowerCase().includes(lowerSearch)

      return nameMatch || identityMatch || statusMatch || phoneMatch || emailMatch
    })
  }, [tenants, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search tenants'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}
          <Link href='/tenants/import-tenants'>
            <Button
              variant='secondary'
              icon={<ImportButtonIcon className='text-neutral-400' />}
              label='Import'
            />
          </Link>
          <AddTenantDialog />
        </div>
      </div>
      {/* Table */}
      <TenantsTable data={filteredTenants} />
    </>
  )
}
