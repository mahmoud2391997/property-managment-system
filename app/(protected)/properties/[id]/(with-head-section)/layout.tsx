'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tab, TabGroup } from '@/components/costume-ui/tab'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { useParams } from 'next/navigation'
import { Property } from '@/types'
import { propertiesData } from '@/utils/data'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { useRouter, usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}
const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'rooms', 'views', 'leases', 'contracts']

  const params = useParams()
  const id = params.id as string
  const propertyData: Property | undefined = propertiesData.find(
    p => p.id === id
  )
  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Overview',
      isSelected: lastSegment === routes[0]
    },
    {
      label: 'Rooms',
      isSelected: lastSegment === routes[1]
    },
    {
      label: 'Views',
      isSelected: lastSegment === routes[2]
    },
    {
      label: 'Leases',
      isSelected: lastSegment === routes[3]
    },
    {
      label: 'Contracts',
      isSelected: lastSegment === routes[4]
    }
  ])

 

  const handleTabClick = (index: number) => {
    const route = routes[index]
    if (route) {
      router.replace(`/properties/${id}/${route}`)
    }
  }

  return (
    <>
      <section className={cn('flex flex-col gap-2.5 mb-2.5')}>
        <Breadcrumb
          items={[
            { label: 'Properties', href: '/properties' },
            { label: propertyData?.code }
          ]}
        />
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex items-center gap-2.5'>
            <span className='w-12 h-12 rounded-full overflow-hidden'>
              <Image
                src={'/images/property-image-placeholder.png'}
                height={48}
                width={48}
                alt='Property Placeholder'
              />
            </span>
            <h1>{propertyData?.code}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-9 w-9 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-7! w-7! text-neutral-600' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Assign owner</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <TabGroup>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              isSelected={tab.isSelected}
              onClick={() => {
                selectByIndex(index)
                handleTabClick(index)
              }}
            />
          ))}
        </TabGroup>
      </section>
      <section className='flex flex-col gap-5 -mx-7.5 -mb-7.5 p-7.5 py-5 bg-(--background-tertiary) min-h-full h-fit'>
        {children}
      </section>
    </>
  )
}

export default WithHeadSectionLayout
