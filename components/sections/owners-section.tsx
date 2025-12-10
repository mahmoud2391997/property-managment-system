'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import OwnersTable from '@/components/tables/owners-table'
import AddOwnerDialog from '@/components/dialogs/add-owner-dialog'
import { Prisma } from '@prisma/client'

type OwnerWithCount = Prisma.ownersGetPayload<{
  select: {
    id: true
    first_name: true
    last_name: true
    phone_number: true
    email: true
    profile_pic: true
    profile_thumb: true
    _count: {
      select: {
        contracts: true
      }
    }
  }
}>

interface OwnersSectionProps {
  owners: OwnerWithCount[]
}

export default function OwnersSection({ owners }: OwnersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOwners = useMemo(() => {
    if (!searchTerm.trim()) {
      return owners
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return owners.filter(owner => {
      // Search by name (first name, last name, or full name)
      const firstName = owner.first_name?.toLowerCase() || ''
      const lastName = owner.last_name?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const nameMatch = firstName.includes(lowerSearch) ||
                        lastName.includes(lowerSearch) ||
                        fullName.includes(lowerSearch)

      // Search by phone number
      const phoneMatch = owner.phone_number?.toLowerCase().includes(lowerSearch)

      // Search by email
      const emailMatch = owner.email?.toLowerCase().includes(lowerSearch)

      // Search by property count
      const propertyCountMatch = owner._count.contracts.toString().includes(lowerSearch)

      return nameMatch || phoneMatch || emailMatch || propertyCountMatch
    })
  }, [owners, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search owners'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <AddOwnerDialog />
        </div>
      </div>
      {/* Table */}
      <div>
        <OwnersTable data={filteredOwners} />
      </div>
    </>
  )
}
