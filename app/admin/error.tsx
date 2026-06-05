"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Admin section error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Что-то пошло не так</h2>
        <p className="mt-2 text-sm text-[#888] leading-relaxed">
          Не удалось загрузить этот раздел. Попробуйте обновить — если ошибка
          повторяется, проверьте подключение к базе данных.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-[#555] font-mono">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
        >
          <RotateCcw className="h-4 w-4" />
          Повторить
        </button>
      </div>
    </div>
  )
}
