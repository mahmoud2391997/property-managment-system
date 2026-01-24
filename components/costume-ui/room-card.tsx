import React, { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import InputCard from './input-card'
import InputGroup from './input-group'
import Input from './input'
import { Checkbox } from '@/components/ui/checkbox'
import Button from './button'
import { Plus, Wifi, SprayCan, Bath, Fence, AirVent } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip as ShadcnTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

// Venus symbol (♀) as a custom icon component
const VenusIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="5" />
    <line x1="12" y1="13" x2="12" y2="21" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
)

export type RoomFeatures = {
  wifi: boolean
  cleaning_service: boolean
  toilet: boolean
  balcony: boolean
  ac: boolean
  female: boolean
}

export type RoomData = {
  title: string
  is_ready: boolean
  features: RoomFeatures
}

const ROOM_FEATURES_CONFIG = [
  { key: 'wifi', label: 'WiFi', Icon: Wifi },
  { key: 'cleaning_service', label: 'Cleaning', Icon: SprayCan },
  { key: 'toilet', label: 'Toilet', Icon: Bath },
  { key: 'balcony', label: 'Balcony', Icon: Fence },
  { key: 'ac', label: 'AC', Icon: AirVent },
  { key: 'female', label: 'Female Only', Icon: VenusIcon }
] as const

interface RoomCardProps {
  onRoomsChange?: (rooms: RoomData[]) => void
}

const defaultFeatures: RoomFeatures = {
  wifi: false,
  cleaning_service: false,
  toilet: false,
  balcony: false,
  ac: false,
  female: false
}

const RoomCard = ({ onRoomsChange }: RoomCardProps) => {
  const [rooms, setRooms] = useState<RoomData[]>([])

  useEffect(() => {
    onRoomsChange?.(rooms)
  }, [rooms, onRoomsChange])

  const handleAddRoom = () => {
    setRooms(prev => [
      ...prev,
      {
        title: '',
        is_ready: false,
        features: { ...defaultFeatures }
      }
    ])
  }

  const handleRemoveRoom = (index: number) => {
    setRooms(prev => prev.filter((_, i) => i !== index))
  }

  const handleRoomChange = (index: number, field: keyof RoomData, value: string | boolean | RoomFeatures) => {
    setRooms(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  return (
    <InnerSection title='Rooms' subtitle='Add individual rooms (optional)'>
      {rooms.length === 0 ? (
        <div className='flex items-center justify-center py-8 px-4 border border-dashed border-(--border-subtle) rounded-lg bg-(--background-secondary)'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <p className='texts-body-small text-(--text-secondary)'>
              No rooms added yet
            </p>
            <Button
              type='button'
              variant='secondary'
              icon={<Plus />}
              label='Add Room'
              isResponsive={false}
              onClick={handleAddRoom}
            />
          </div>
        </div>
      ) : (
        <>
          {rooms.map((room, index) => (
            <InputCard key={index} onRemove={() => handleRemoveRoom(index)}>
              <InputGroup
                className='w-40 sm:w-50 md:w-60 lg:w-80'
                label='Room Title'
              >
                <Input
                  className='bg-(--background-primary)'
                  placeholder='E.g. Master'
                  minLength={1}
                  maxLength={100}
                  value={room.title}
                  onChange={e => handleRoomChange(index, 'title', e.target.value)}
                />
              </InputGroup>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center gap-2.5 h-10 w-full'>
                  <Checkbox
                    className='h-5 w-5 border-(--border-strong) bg-(--background-primary)'
                    checked={room.is_ready}
                    onCheckedChange={checked =>
                      handleRoomChange(index, 'is_ready', checked as boolean)
                    }
                  />
                  <span className='texts-body-medium'>Room is ready</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {ROOM_FEATURES_CONFIG.map(({ key, label, Icon }) => {
                    const isChecked = room.features?.[key as keyof RoomFeatures] || false
                    return (
                      <TooltipProvider key={key}>
                        <ShadcnTooltip>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              onClick={() => {
                                const newFeatures = { ...(room.features || defaultFeatures), [key]: !isChecked }
                                handleRoomChange(index, 'features', newFeatures)
                              }}
                              className={cn(
                                'p-2 rounded-md border transition-colors',
                                isChecked
                                  ? 'border-(--primary-main) bg-(--primary-main)/10 text-(--primary-main)'
                                  : 'border-(--border-subtle) text-neutral-400 hover:border-(--border-strong)'
                              )}
                            >
                              <Icon size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{label}</p>
                          </TooltipContent>
                        </ShadcnTooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </div>
            </InputCard>
          ))}
          <Button
            type='button'
            variant='secondary'
            icon={<Plus />}
            label='Add Room'
            isResponsive={false}
            onClick={handleAddRoom}
          />
        </>
      )}
    </InnerSection>
  )
}

export default RoomCard
