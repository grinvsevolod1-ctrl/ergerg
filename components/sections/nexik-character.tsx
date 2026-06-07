"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface NexikCharacterProps {
  className?: string
}

/** Intrinsic dimensions of the source clip (used to reserve space → zero layout shift). */
const VIDEO_W = 1108
const VIDEO_H = 732

/**
 * Animated Nexik mascot for the hero.
 *
 * The source is an mp4 on a pure-black background. It is never presented as a
 * "video": no controls, no chrome, pointer-events disabled, and
 * `mix-blend-mode: screen` makes the black background fully transparent so the
 * character appears to float natively inside the hero. The clip plays once
 * (the mascot walks in and settles) and holds its final rest pose.
 *
 * Loading is engineered for slow connections:
 * - The container reserves the exact aspect ratio, so there is **no layout
 *   shift** (CLS) whether the video arrives in 50ms or 5s.
 * - The element stays fully transparent until the first frame is decoded, then
 *   fades in — so users never see a half-loaded or popping video.
 * - `prefers-reduced-motion` skips the walk-in and shows the rest pose.
 * - If the video fails to load, the element stays invisible (it is decorative).
 */
export function NexikCharacter({ className }: NexikCharacterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const handleReady = () => {
      setStatus("ready")
      if (prefersReduced) {
        // Jump straight to the settled pose, no walk-in.
        try {
          video.currentTime = video.duration || 0
        } catch {
          /* duration may not be known yet; harmless */
        }
        return
      }
      void video.play().catch(() => {
        // Autoplay can be blocked (rare for muted+playsInline). The first frame
        // is already painted, so the hero still looks intact.
      })
    }

    const handleError = () => setStatus("error")

    if (video.readyState >= 2) {
      handleReady()
    } else {
      video.addEventListener("loadeddata", handleReady, { once: true })
      video.addEventListener("error", handleError, { once: true })
    }

    return () => {
      video.removeEventListener("loadeddata", handleReady)
      video.removeEventListener("error", handleError)
    }
  }, [])

  return (
    <div
      className={cn(
        "relative flex items-end justify-center select-none pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* Aspect-ratio box reserves the exact space up-front → no layout shift. */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VIDEO_W} / ${VIDEO_H}` }}
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
          className={cn(
            "absolute inset-0 h-full w-full object-contain [mix-blend-mode:screen] [transform:translateZ(0)]",
            "transition-opacity duration-700 ease-out",
            status === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  )
}
