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
      {/* Ambient glow grounding the character into the hero */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] w-[78%] aspect-square rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(79,209,197,0.20) 0%, rgba(99,179,237,0.12) 45%, transparent 70%)",
        }}
      />

      {/* Soft floor reflection / shadow */}
      <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[55%] h-6 rounded-[100%] bg-primary/15 blur-xl" />

      <div
        className={cn(
          "relative w-full transition-all duration-700 ease-out will-change-transform",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <video
          ref={videoRef}
          src="/videos/hero-nexik.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          tabIndex={-1}
          className="w-full h-auto [mix-blend-mode:screen] [transform:translateZ(0)] motion-safe:animate-[nexik-float_6s_ease-in-out_infinite]"
        />
      </div>
    </div>
  )
}
