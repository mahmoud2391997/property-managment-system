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
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getProperties() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  // Get properties for this organization
  const properties = await prisma.properties.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      code: true,
      street_address: true,
      postal_code: true,
      city: true,
      type: true,
      status: true,
      projects: {
        select: {
          title: true,
          state: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return properties.map(property => ({
    id: property.id,
    code: property.code,
    address: `${property.street_address}, ${property.postal_code}, ${property.city}, ${property.projects?.state}`,
    project: property.projects?.title || null,
    type: property.type,
    status: property.status
  }))
}

const Properties = async () => {
  const properties = await getProperties()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Properties</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search properties' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            variant='secondary'
            icon={<ImportButtonIcon className='text-neutral-400' />}
            label='Import'
          />

          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

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
        <PropertiesTable data={properties} />
      </div>
    </div>
  )
}

export default Properties
