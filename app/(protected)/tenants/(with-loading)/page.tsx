import { cn } from '@/lib/utils'
import TenantsSection from '@/components/sections/tenants-section'
import { devTenants } from '@/lib/dev-data'

export default function TenantsPage() {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      <div>
        <h1>Tenants</h1>
      </div>
      <TenantsSection
        initialData={devTenants}
        initialTotal={devTenants.length}
      />
    </div>
  )
}
