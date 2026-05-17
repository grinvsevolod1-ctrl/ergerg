"use client"

import { ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  onRefresh?: () => void
  loading?: boolean
  actions?: ReactNode
}

export function PageHeader({ 
  title, 
  description, 
  onRefresh, 
  loading,
  actions 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-[#888] mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="bg-transparent border-[#222] text-[#888] hover:text-white hover:bg-[#111] hover:border-[#333]"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Обновить
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
