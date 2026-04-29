'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import VendorsTable, { VendorWithDetails } from '@/components/tables/vendors-table'
import AddVendorDialog from '@/components/dialogs/add-vendor-dialog'
import { usePermissions } from '@/hooks/use-permissions'

interface VendorsSectionProps {
  vendors: VendorWithDetails[]
}

export default function VendorsSection({ vendors }: VendorsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { can } = usePermissions()

  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) {
      return vendors
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return vendors.filter(vendor => {
      // Search by name
      const nameMatch = vendor.name?.toLowerCase().includes(lowerSearch)

      // Search by phone number
      const phoneMatch = vendor.phone_number?.toLowerCase().includes(lowerSearch)

      // Search by email
      const emailMatch = vendor.email?.toLowerCase().includes(lowerSearch)

      return nameMatch || phoneMatch || emailMatch
    })
  }, [vendors, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search vendors'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {can('vendors.create') && <AddVendorDialog />}
        </div>
      </div>
      {/* Table */}
      <div>
        <VendorsTable data={filteredVendors} />
      </div>
    </>
  )
}
