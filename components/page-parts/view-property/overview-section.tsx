'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ComboBoxitemsType } from '@/types'
import {
  type LucideIcon,
  MoreVertical,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck2
} from 'lucide-react'
import { UserAvatar } from '../../costume-ui/name-avatar'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '../../ui/button'
import CustomButton from '../../costume-ui/button'
import { ownersData, tenantsData } from '@/utils/data'
import { Tab, TabGroup } from '../../costume-ui/tab'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import SearchInput from '../../costume-ui/search-input'
import { AddButtonIcon, DeleteButtonIcon } from '../../costume-ui/icon'
import Link from 'next/link'
import PaymentsTable from '../../tables/pyaments-table'

// Sub component
type CardProps = {
  iconStyles: string
  Icon: LucideIcon
  title: string
  subtitle: string
  amount: string
  date_label: string
  date: string
  user_name: string
  user_type: string
}

export const Card = ({
  iconStyles = '',
  Icon,
  title,
  subtitle,
  amount,
  date_label,
  date,
  user_name,
  user_type
}: CardProps) => {
  const renderAvatar = (item: ComboBoxitemsType) => {
    if (!item.avatar) {
      return (
        <div className='flex items-center gap-2.5 select-none'>
          {!item.avatar ? (
            <UserAvatar
              name={item.label}
              size={40}
              className={'texts-body-large-medium'}
            />
          ) : (
            typeof item.avatar === 'string' && (
              <span className='w-10 h-10 relative rounded-full overflow-hidden'>
                <Image
                  src={item.avatar}
                  alt='Profile pic'
                  fill
                  className='object-cover'
                />
              </span>
            )
          )}
          <div className='flex-1 flex flex-col'>
            <span className='texts-body-large-medium'>{item.label}</span>
            {item.subtitle && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {item.subtitle}
              </span>
            )}
          </div>
        </div>
      )
    }

    return <span className='w-5 h-5'>{item.avatar}</span>
  }

  return (
    <>
      {/* Card */}
      <div
        className={cn(
          'flex flex-col gap-5 w-full',
          'w-full p-5 rounded-[12px]',
          'bg-(--background-primary)'
        )}
      >
        {/* Head */}
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex gap-2.5'>
            {/* Icon */}
            <div
              className={cn(
                'flex items-center justify-center rounded-[7px]',
                'h-[31] w-[31]',
                iconStyles
              )}
            >
              <Icon size={19} strokeWidth={1.5} />
            </div>
            {/* Title */}
            <div className='flex flex-col'>
              <h3>{title}</h3>
              <span className='texts-caption-large text-(--text-secondary)'>
                {subtitle}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreVertical className='h-6! w-6! text-neutral-600' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Assign owner</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Body */}
        <div className='flex flex-col gap-2.5'>
          <h2>{amount}</h2>
          <span className='texts-body-small'>
            <span className='texts-body-small-medium'>{date_label}</span> {date}
          </span>
        </div>
        {/* Footer */}
        <div className='w-full pt-[15] border-t border-(--border-light)'>
          {renderAvatar({
            label: user_name,
            subtitle: user_type
          })}
        </div>
      </div>
    </>
  )
}
const OverViewSection = () => {
  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Payments',
      isSelected: true
    },
    {
      label: 'Expenses',
      isSelected: false
    }
  ])

  const {
    options: filterTabs,
    selectByIndex: selectFilterByIndex,
    selectedIndex: selectedFilterIndex
  } = useSingleSelectOption([
    {
      label: 'All',
      isSelected: true
    },
    {
      label: 'Paid',
      isSelected: false
    },
    {
      label: 'Paid Late',
      isSelected: false
    },
    {
      label: 'Overdue',
      isSelected: false
    },
    {
      label: 'Pending',
      isSelected: false
    }
  ])

  return (
    <>
      {/* Cards */}
      <div className='flex items-start gap-5 w-full'>
        <Card
          iconStyles='bg-[#DEFFE2] text-(--success-dark)'
          Icon={ArrowDownLeft}
          title='Lease Overview'
          subtitle='Income from tenant'
          amount='RM2,000.00'
          date_label='Due'
          date='17 November 2025'
          user_name={tenantsData[0].tenant_name}
          user_type='Tenant'
        />
        <Card
          iconStyles='bg-(--warning-light) text-(--warning-dark)'
          Icon={ArrowUpRight}
          title='Contract Overview'
          subtitle='Payment to owner'
          amount='RM1,500.00'
          date_label='Due'
          date='15 November 2025'
          user_name={ownersData[0].owner_name}
          user_type='Owner'
        />
        <Card
          iconStyles='bg-(--info-light) text-(--info-main)'
          Icon={CalendarCheck2}
          title='Booking Overview'
          subtitle='Property reservation'
          amount='RM300.00'
          date_label='Move in'
          date='01 December 2025'
          user_name={tenantsData[1].tenant_name}
          user_type='Tenant'
        />
      </div>
      {/* Payments */}
      <div
        className={cn(
          'flex flex-col gap-5',
          'p-5 py-2.5 rounded-[12px]',
          'bg-(--background-primary) '
        )}
      >
        <TabGroup className='-mx-5 px-5'>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              isSelected={tab.isSelected}
              onClick={() => selectByIndex(index)}
            />
          ))}
        </TabGroup>

        {/* Actions */}
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <SearchInput placeholder='Search rooms' />
          {/* Buttons */}
          <div className={cn('flex items-center gap-2.5', 'py-5')}>
            <CustomButton
              icon={<DeleteButtonIcon />}
              label='Delete'
              className='bg-(--error-main)!'
            />

            <Link href='/rooms/add-room'>
              <CustomButton
                icon={<AddButtonIcon className='text-neutral-300' />}
                label='Add Room'
              />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <TabGroup showButton={true} className='-mx-5 px-5'>
          {filterTabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              isSelected={tab.isSelected}
              onClick={() => selectFilterByIndex(index)}
              className='texts-tab-secondary'
            />
          ))}
        </TabGroup>
        <PaymentsTable showPropertyColumn={false} className='-mx-5! rounded-none! border-x-0' />
      </div>
    </>
  )
}

export default OverViewSection
