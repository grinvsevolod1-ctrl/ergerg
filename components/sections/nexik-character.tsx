"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface NexikCharacterProps {
  className?: string
}

/**
 * Animated Nexik mascot for the hero.
 *
 * The source is an mp4 on a pure-black background. We never expose it as a
 * "video": no controls, no chrome, pointer-events disabled, and
 * `mix-blend-mode: screen` makes the black background fully transparent so the
 * character appears to float natively inside the hero. The clip plays once
 * (the mascot walks in and settles) and holds the final rest pose.
 */
export function NexikCharacter({ className }: NexikCharacterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Respect reduced-motion: jump straight to the rest pose, no walk-in.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const handleReady = () => {
      setReady(true)
      if (prefersReduced) {
        video.currentTime = video.duration || 0
        return
      }
      video.play().catch(() => {
        // Autoplay can be blocked; the static last frame still looks correct.
        setReady(true)
      })
    }

    if (video.readyState >= 2) {
      handleReady()
    } else {
      video.addEventListener("loadeddata", handleReady, { once: true })
    }

    return () => video.removeEventListener("loadeddata", handleReady)
  }, [])

  return (
    <div
      className={cn(
        "relative flex items-end justify-center select-none pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "relative w-full transition-opacity duration-700 ease-out",
          ready ? "opacity-100" : "opacity-0",
        )}
      >
        <video
          ref={videoRef}
          src="/videos/hero-nexik-cut.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          tabIndex={-1}
          className="block w-full h-auto [mix-blend-mode:screen] [transform:translateZ(0)]"
        />
      </div>
    </div>
  )
}
