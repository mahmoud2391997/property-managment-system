"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  value?: number
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  // Determine color based on value
  let indicatorColor = "bg-(--error-main)" // default: low
  if (value >= 75) indicatorColor = "bg-(--success-main)"
  else if (value >= 50) indicatorColor = "bg-(--warning-main)"
  else if (value >= 25) indicatorColor = "bg-orange-500"

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-neutral-300 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 transition-all", indicatorColor)}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
