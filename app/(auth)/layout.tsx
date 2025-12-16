import React from 'react'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className='overflow-auto h-screen'>{children}</div>
}

export default AuthLayout
