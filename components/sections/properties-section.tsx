'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import {
  AddButtonIcon,
  DeleteButtonIcon,
  ImportButtonIcon
} from '@/components/costume-ui/icon'
import PropertiesTable from '@/components/tables/properties-table'
import Link from 'next/link'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'

type StatusCount = {
  status: DisplayStatus
  count: number
  total: number
}

type PropertyWithDetails = {
  id: string
  code: string
  address: string
  project: string | null
  type: string
  status: string | StatusCount[]
  tenantPhone?: string | null
}

interface PropertiesSectionProps {
  properties: PropertyWithDetails[]
}

export default function PropertiesSection({ properties }: PropertiesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) {
      return properties
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return properties.filter(property => {
      const codeMatch = property.code?.toLowerCase().includes(lowerSearch)
      const projectMatch = property.project?.toLowerCase().includes(lowerSearch)
      const typeMatch = property.type?.toLowerCase().includes(lowerSearch)

      // Handle status - can be string or StatusCount[]
      let statusMatch = false
      if (typeof property.status === 'string') {
        statusMatch = property.status.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)
      } else if (Array.isArray(property.status)) {
        statusMatch = property.status.some(s =>
          s.status.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)
        )
      }

      return codeMatch || projectMatch || typeMatch || statusMatch
    })
  }, [properties, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search properties'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Link href='/properties/import-properties'>
            <Button
              variant='secondary'
              icon={<ImportButtonIcon className='text-neutral-400' />}
              label='Import'
            />
          </Link>

          <Link href='/properties/add-property'>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Property'
            />
          </Link>
        </div>
      </div>
      {/* Table */}
      <div>
        <PropertiesTable data={filteredProperties} />
      </div>
    </>
  )
}
