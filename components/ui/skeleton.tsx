import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-accent",
        "after:absolute after:top-0 after:bottom-0 after:left-0 after:w-[200%] after:animate-shimmer",
        "after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
