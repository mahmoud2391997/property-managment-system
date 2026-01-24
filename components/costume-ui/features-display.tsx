'use client'

import { useState } from 'react'
import { Wifi, Bath, AirVent, Fence, SprayCan } from 'lucide-react'
import {
  Tooltip as ShadcnTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

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

// Feature configuration with icons, labels, and colors
const FEATURE_CONFIG = {
  wifi: { label: 'WiFi', Icon: Wifi, bg: 'bg-blue-50', text: 'text-blue-600' },
  cleaning_service: { label: 'Cleaning Service', Icon: SprayCan, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  female: { label: 'Female Only', Icon: VenusIcon, bg: 'bg-pink-50', text: 'text-pink-600' },
  toilet: { label: 'Private Toilet', Icon: Bath, bg: 'bg-cyan-50', text: 'text-cyan-600' },
  balcony: { label: 'Balcony', Icon: Fence, bg: 'bg-amber-50', text: 'text-amber-600' },
  ac: { label: 'Air Conditioner', Icon: AirVent, bg: 'bg-sky-50', text: 'text-sky-600' }
} as const

type FeatureKey = keyof typeof FEATURE_CONFIG

type Features = {
  wifi?: boolean
  cleaning_service?: boolean
  female?: boolean
  toilet?: boolean
  balcony?: boolean
  ac?: boolean
}

type FeaturesDisplayProps = {
  features: Features
  maxVisible?: number
}

const FeatureIcon = ({ featureKey, showTooltip = true }: { featureKey: FeatureKey; showTooltip?: boolean }) => {
  const config = FEATURE_CONFIG[featureKey]
  const [isOpen, setIsOpen] = useState(false)

  if (!config) return null

  const Icon = config.Icon

  if (!showTooltip) {
    return (
      <div className='flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-neutral-50'>
        <div className={`p-1 rounded ${config.bg}`}>
          <Icon size={14} className={config.text} />
        </div>
        <span className='texts-body-small text-(--text-primary)'>{config.label}</span>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ShadcnTooltip open={isOpen}>
        <TooltipTrigger
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(!isOpen)}
          asChild
        >
          <div className={`p-1.5 rounded-md ${config.bg} hover:opacity-80 transition-opacity cursor-default`}>
            <Icon size={16} className={config.text} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  )
}

const FeaturesDisplay = ({ features, maxVisible = 3 }: FeaturesDisplayProps) => {
  // Get active features - only show features that are truthy AND exist in our config
  const activeFeatures = Object.entries(features)
    .filter(([key, value]) => value && key in FEATURE_CONFIG)
    .map(([key]) => key as FeatureKey)

  if (activeFeatures.length === 0) {
    return <span className='text-(--text-tertiary) texts-body-small'>-</span>
  }

  const visibleFeatures = activeFeatures.slice(0, maxVisible)
  const hiddenFeatures = activeFeatures.slice(maxVisible)
  const hasMore = hiddenFeatures.length > 0

  return (
    <div className='flex items-center gap-1'>
      {visibleFeatures.map((featureKey) => (
        <FeatureIcon key={featureKey} featureKey={featureKey} />
      ))}

      {hasMore && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='p-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer'
            >
              <span className='text-xs font-semibold text-neutral-600'>
                +{hiddenFeatures.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-1.5' align='start'>
            <div className='flex flex-col'>
              {hiddenFeatures.map((featureKey) => (
                <FeatureIcon key={featureKey} featureKey={featureKey} showTooltip={false} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default FeaturesDisplay
