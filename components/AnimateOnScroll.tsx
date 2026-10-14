'use client'

import { useEffect, useRef, useState, type ReactNode } from "react"

type Animation = "fade-up" | "fade-down" | "fade-left" | "fade-right"

// Classes écrites en entier : Tailwind ne génère pas les classes construites dynamiquement
const animationClasses: Record<Animation, string> = {
  "fade-up": "animate-fade-up",
  "fade-down": "animate-fade-down",
  "fade-left": "animate-fade-left",
  "fade-right": "animate-fade-right",
}

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
      className={`${isVisible ? `${animationClasses[animation]} motion-reduce:animate-none` : "opacity-0 motion-reduce:opacity-100"} ${className}`}
      style={{ animationDelay: isVisible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}