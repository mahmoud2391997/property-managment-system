import { cn } from '@/lib/utils'
import PropertiesSection from '@/components/sections/properties-section'
import { devProperties } from '@/lib/dev-data'

export default function PropertiesPage() {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      <div>
        <h1>Properties</h1>
      </div>
      <PropertiesSection
        initialData={devProperties}
        initialTotal={devProperties.length}
      />
    </div>
  )
}
