"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({
  children,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      const resistance = Math.min(diff * 0.4, threshold * 1.5);
      setPullDistance(resistance);
      
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      window.location.reload();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-opacity",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ top: Math.max(pullDistance - 40, -40) }}
      >
        <div className={cn("rounded-full bg-background border shadow-sm p-2", isRefreshing && "animate-pulse")}>
          <Loader2
            className={cn("h-5 w-5 text-muted-foreground", isRefreshing && "animate-spin")}
            style={{ transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)` }}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("h-full overflow-y-auto", className)}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}