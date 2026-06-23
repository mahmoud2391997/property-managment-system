import { Skeleton } from '@/components/ui/skeleton'

export default function PaymentDetailsLoading() {
  return (
    <div className='flex flex-col gap-5'>
      {/* Breadcrumb Skeleton */}
      <Skeleton className='h-4 w-40 bg-neutral-200' />

      {/* Header Skeleton */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-8 w-48 bg-neutral-200' />
            <Skeleton className='h-6 w-20 rounded-md bg-neutral-200' />
          </div>
          <Skeleton className='h-5 w-32 bg-neutral-100' />
        </div>
        <div className='flex items-center gap-2.5'>
          <Skeleton className='h-9 w-32 rounded-md bg-neutral-200' />
          <Skeleton className='h-9 w-9 rounded-md bg-neutral-200' />
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-5'>
        {/* Left Column */}
        <div className='flex-1 flex flex-col gap-5'>
          {/* Payment Summary Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <div className='flex flex-col gap-1'>
                <Skeleton className='h-5 w-36 bg-neutral-200' />
                <Skeleton className='h-4 w-48 bg-neutral-100' />
              </div>
            </div>
            <div className='flex flex-col gap-4 pt-4'>
              <div className='flex items-baseline justify-between'>
                <div className='flex flex-col gap-1'>
                  <Skeleton className='h-4 w-24 bg-neutral-100' />
                  <Skeleton className='h-9 w-32 bg-neutral-200' />
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <Skeleton className='h-4 w-20 bg-neutral-100' />
                  <Skeleton className='h-6 w-24 bg-neutral-200' />
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-20 bg-neutral-100' />
                  <Skeleton className='h-4 w-32 bg-neutral-100' />
                </div>
                <Skeleton className='h-2.5 w-full rounded-full bg-neutral-200' />
              </div>
            </div>
          </div>

          {/* Charges Breakdown Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <div className='flex flex-col gap-1'>
                <Skeleton className='h-5 w-40 bg-neutral-200' />
                <Skeleton className='h-4 w-20 bg-neutral-100' />
              </div>
            </div>
            <div className='flex flex-col pt-4 divide-y divide-(--border-light)'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center justify-between py-3 first:pt-0'>
                  <div className='flex flex-col gap-1'>
                    <Skeleton className='h-5 w-32 bg-neutral-200' />
                    <Skeleton className='h-4 w-16 rounded bg-neutral-100' />
                  </div>
                  <Skeleton className='h-5 w-24 bg-neutral-200' />
                </div>
              ))}
              <div className='flex items-center justify-between pt-4'>
                <Skeleton className='h-5 w-12 bg-neutral-200' />
                <Skeleton className='h-5 w-28 bg-neutral-200' />
              </div>
            </div>
          </div>

          {/* Payment History Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <div className='flex flex-col gap-1'>
                <Skeleton className='h-5 w-36 bg-neutral-200' />
                <Skeleton className='h-4 w-24 bg-neutral-100' />
              </div>
            </div>
            <div className='pt-4'>
              <table className='w-full'>
                <thead>
                  <tr>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <th key={i} className='pb-3'>
                        <Skeleton className='h-4 w-16 bg-neutral-100' />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-(--border-light)'>
                  {[1, 2].map((i) => (
                    <tr key={i}>
                      <td className='py-3'><Skeleton className='h-4 w-6 bg-neutral-200' /></td>
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <Skeleton className='h-4 w-4 rounded bg-neutral-200' />
                          <Skeleton className='h-4 w-24 bg-neutral-200' />
                        </div>
                      </td>
                      <td className='py-3'><Skeleton className='h-4 w-20 bg-neutral-200' /></td>
                      <td className='py-3'><Skeleton className='h-4 w-20 bg-neutral-100' /></td>
                      <td className='py-3'><Skeleton className='h-5 w-16 rounded-full bg-neutral-200' /></td>
                      <td className='py-3'><Skeleton className='h-4 w-24 bg-neutral-100' /></td>
                      <td className='py-3'><Skeleton className='h-4 w-10 bg-neutral-100' /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className='w-full lg:w-80 flex flex-col gap-5'>
          {/* Dates Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <Skeleton className='h-5 w-16 bg-neutral-200' />
            </div>
            <div className='flex flex-col gap-3 pt-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-20 bg-neutral-100' />
                  <Skeleton className='h-4 w-24 bg-neutral-200' />
                </div>
              ))}
            </div>
          </div>

          {/* Property Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <Skeleton className='h-5 w-20 bg-neutral-200' />
            </div>
            <div className='flex flex-col gap-2 pt-4'>
              <Skeleton className='h-5 w-24 bg-neutral-200' />
              <Skeleton className='h-4 w-full bg-neutral-100' />
            </div>
          </div>

          {/* Tenant Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <Skeleton className='h-5 w-16 bg-neutral-200' />
            </div>
            <div className='flex items-center gap-3 pt-4'>
              <Skeleton className='h-10 w-10 rounded-full bg-neutral-200' />
              <div className='flex flex-col gap-1'>
                <Skeleton className='h-5 w-28 bg-neutral-200' />
                <Skeleton className='h-4 w-20 bg-neutral-100' />
              </div>
            </div>
          </div>

          {/* Lease Card Skeleton */}
          <div className='flex flex-col p-5 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
              <Skeleton className='h-5 w-14 bg-neutral-200' />
            </div>
            <div className='flex flex-col gap-3 pt-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-24 bg-neutral-100' />
                  <Skeleton className='h-4 w-20 bg-neutral-200' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
