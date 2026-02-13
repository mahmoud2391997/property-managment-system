import { Suspense } from 'react'
import TenantLoginForm from '@/components/tenant-login-form'
import Image from 'next/image'

const TenantLogin = async () => {
  return (
    <div className='flex min-h-svh'>
      {/* Left — Image */}
      <div className='hidden lg:block lg:w-[45%] xl:w-1/2 relative'>
        <Image
          src='/images/Login page image.jpg'
          alt=''
          fill
          className='object-cover'
          priority
        />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-black/70 via-black/30 to-transparent" />

        {/* Logo top-left */}
        <div className='absolute top-8 left-8 flex items-center gap-2.5'>
          <Image src='/icons/logo.png' alt='TenancyPilot' width={32} height={32} className='brightness-0 invert' />
          <span className='text-white text-[15px] font-semibold'>TenancyPilot</span>
        </div>

        {/* Bottom text */}
        <div className='absolute bottom-10 left-8 right-8'>
          <h2 className='text-white text-[28px] xl:text-[32px] font-semibold leading-tight'>
            Property management<br />made simple
          </h2>
          <p className='text-white/60 text-[14px] mt-2.5'>
            Rentals, tenants, and operations — all in one place.
          </p>

          {/* Dot indicators */}
          <div className='flex items-center gap-2 mt-5'>
            <div className='w-8 h-2 rounded-full bg-white' />
            <div className='w-2 h-2 rounded-full bg-white/40' />
            <div className='w-2 h-2 rounded-full bg-white/40' />
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className='flex flex-1 flex-col items-center justify-center px-6 py-10 bg-white'>
        {/* Mobile logo */}
        <div className='flex items-center gap-2.5 mb-10 lg:hidden'>
          <Image src='/icons/logo.png' alt='TenancyPilot' width={32} height={32} />
          <span className='text-[18px] font-semibold text-[#1a1a1a]'>TenancyPilot</span>
        </div>

        <div className='w-full max-w-[400px]'>
          <Suspense fallback={<div className="h-72" />}>
            <TenantLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default TenantLogin
