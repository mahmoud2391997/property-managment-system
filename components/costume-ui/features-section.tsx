'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Wifi, SprayCan, Bath, Fence, AirVent } from 'lucide-react'
import InnerSection from './collapsible-inner-section'

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

// Feature definitions with icons and labels
export const PROPERTY_FEATURES = [
  { key: 'wifi', label: 'WiFi', description: 'WiFi internet available', Icon: Wifi },
  { key: 'cleaning_service', label: 'Cleaning Service', description: 'Cleaning service included', Icon: SprayCan },
  { key: 'female', label: 'Female Only', description: 'For female tenants only', Icon: VenusIcon }
] as const

export const ROOM_FEATURES = [
  { key: 'wifi', label: 'WiFi', description: 'WiFi internet available', Icon: Wifi },
  { key: 'cleaning_service', label: 'Cleaning Service', description: 'Cleaning service included', Icon: SprayCan },
  { key: 'toilet', label: 'Private Toilet', description: 'Private toilet/bathroom', Icon: Bath },
  { key: 'balcony', label: 'Balcony', description: 'Has a balcony', Icon: Fence },
  { key: 'ac', label: 'Air Conditioner', description: 'Air conditioning available', Icon: AirVent },
  { key: 'female', label: 'Female Only', description: 'For female tenants only', Icon: VenusIcon }
] as const

export type PropertyFeatures = {
  wifi: boolean
  cleaning_service: boolean
  female: boolean
}

export type RoomFeatures = {
  wifi: boolean
  cleaning_service: boolean
  toilet: boolean
  balcony: boolean
  ac: boolean
  female: boolean
}

type FeaturesSectionProps = {
  type: 'property' | 'room'
  features: PropertyFeatures | RoomFeatures
  onFeaturesChange: (features: PropertyFeatures | RoomFeatures) => void
}

const FeaturesSection = ({ type, features, onFeaturesChange }: FeaturesSectionProps) => {
  const featuresList = type === 'property' ? PROPERTY_FEATURES : ROOM_FEATURES

  const handleFeatureChange = (key: string, checked: boolean) => {
    onFeaturesChange({
      ...features,
      [key]: checked
    })
  }

  return (
    <InnerSection
      title='Features'
      subtitle={`Select features for this ${type}`}
    >
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {featuresList.map((feature) => {
          const isChecked = features[feature.key as keyof typeof features] || false
          const Icon = feature.Icon

          return (
            <div
              key={feature.key}
              className={cn(
                'relative border rounded-md overflow-hidden transition-colors',
                isChecked ? 'border-(--primary-main) bg-(--primary-main)/5' : 'border-(--border-strong)'
              )}
            >
              <Checkbox
                checked={isChecked}
                className={cn(
                  'absolute top-1/2 left-3 -translate-y-1/2',
                  'h-5 w-5 border-(--border-strong)'
                )}
                onCheckedChange={(checked) => handleFeatureChange(feature.key, checked as boolean)}
              />
              <button
                type='button'
                onClick={() => handleFeatureChange(feature.key, !isChecked)}
                className={cn(
                  'flex items-center gap-3',
                  'hover:bg-neutral-50',
                  'h-16 w-full px-4 pl-10',
                  'cursor-pointer'
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    isChecked ? 'text-(--primary-main)' : 'text-neutral-400'
                  )}
                />
                <div className='flex flex-col items-start'>
                  <span className='texts-body-medium'>{feature.label}</span>
                  <span className='texts-caption text-(--text-secondary)'>
                    {feature.description}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </InnerSection>
  )
}

export default FeaturesSection
