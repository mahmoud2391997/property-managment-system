import { cn } from '@/lib/utils'
export default function MobileCardContainer ({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div
      className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3 shadow-md',
        ''
      )}
    >
      {children}
    </div>
  )
}
