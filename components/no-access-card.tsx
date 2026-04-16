'use client'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

interface NoAccessCardProps {
  label: string
  className?: string
}

export function NoAccessCard({ label, className }: NoAccessCardProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]',
        className
      )}
    >
      <Lock className="w-6 h-6 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 text-center font-medium">{label}</p>
      <p className="text-xs text-gray-400 text-center mt-1">You don't have access</p>
    </div>
  )
}
