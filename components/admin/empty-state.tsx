"use client"

import { type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Consistent empty-state placeholder for admin lists/tables.
 * Use when a fetch succeeded but returned no rows.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-48 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl px-6">
      <Icon className="w-10 h-10 text-[#555] mb-3" />
      <p className="text-white font-medium">{title}</p>
      {description && <p className="text-sm text-[#888] mt-1 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
