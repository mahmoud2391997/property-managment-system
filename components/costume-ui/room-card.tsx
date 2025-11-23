import React, { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import InputCard from './input-card'
import InputGroup from './input-group'
import Input from './input'
import { Checkbox } from '@/components/ui/checkbox'
import Button from './button'
import { Plus } from 'lucide-react'

export type RoomData = {
  title: string
  is_ready: boolean
}

interface RoomCardProps {
  onRoomsChange?: (rooms: RoomData[]) => void
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
        is_ready: false
      }
    ])
  }

  const handleRemoveRoom = (index: number) => {
    setRooms(prev => prev.filter((_, i) => i !== index))
  }

  const handleRoomChange = (index: number, field: keyof RoomData, value: string | boolean) => {
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
              <div className='flex '>
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
