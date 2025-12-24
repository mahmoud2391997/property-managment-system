import Link from 'next/link'
import { FileKey2 } from 'lucide-react'
import UnderDevelopment from '../under-development/page'

const Testing = () => {
  return <h1>Not Found</h1>
  return (
    <div className='p-6'>
      <h1 className='texts-heading-medium mb-6'>Testing Pages</h1>
      <div className='grid gap-4 max-w-md'>
        <Link
          href='/testing/lease-ending'
          className='flex items-center gap-3 p-4 border border-(--border-default) rounded-xl bg-white hover:bg-neutral-50 transition-colors'
        >
          <div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center'>
            <FileKey2 size={20} className='text-blue-600' />
          </div>
          <div>
            <p className='texts-body-medium-medium text-(--text-primary)'>
              Lease Ending Workflow
            </p>
            <p className='texts-body-small text-(--text-secondary)'>
              Test the lease ending task flow with staff switching
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Testing
