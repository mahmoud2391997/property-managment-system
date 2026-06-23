const EnvBadge = () => {
  const env = process.env.NEXT_PUBLIC_APP_ENV

  if (env !== 'development' && env !== 'staging') return null

  const isDev = env === 'development'
  const label = isDev ? 'DEV' : 'STAGING'
  const dotColor = isDev ? 'bg-amber-400' : 'bg-sky-400'
  const ringColor = isDev ? 'ring-amber-400/30' : 'ring-sky-400/30'
  const textColor = isDev ? 'text-amber-100' : 'text-sky-100'

  return (
    <div className='fixed top-4 right-4 z-50 pointer-events-none'>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-sm ring-1 ${ringColor} shadow-lg`}>
        <span className='relative flex h-2 w-2'>
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75 animate-ping`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
        </span>
        <span className={`text-[11px] font-semibold tracking-wider ${textColor}`}>
          {label}
        </span>
      </div>
    </div>
  )
}

export default EnvBadge
