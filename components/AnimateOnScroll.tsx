'use client'

import { useEffect, useRef, useState, type ReactNode } from "react"

type Animation = "fade-up" | "fade-down" | "fade-left" | "fade-right"

interface AnimateOnScrollProps {
  children: ReactNode
  animation?: Animation
  delay?: number       // en ms
  threshold?: number   // 0 à 1, % visible avant déclenchement
  className?: string
}

export default function AnimateOnScroll({
  children,
  animation = "fade-up",
  delay = 0,
  threshold = 0.2,
  className = "",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // ne se déclenche qu'une seule fois
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={`${isVisible ? `animate-${animation}` : "opacity-0"} ${className}`}
      style={{ animationDelay: isVisible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}