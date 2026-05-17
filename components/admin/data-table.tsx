"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (item: T) => void
  getRowKey: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyIcon,
  emptyTitle = "Нет данных",
  emptyDescription,
  pagination,
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0a0a0a]/50 rounded-xl border border-[#1a1a1a]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-[#888]">Загрузка данных...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0a0a0a]/50 rounded-xl border border-[#1a1a1a]">
        {emptyIcon}
        <p className="text-base font-medium text-white mt-4">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-[#888] mt-1">{emptyDescription}</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a]/50 rounded-xl border border-[#1a1a1a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={cn(
                    "text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {data.map((item) => (
              <tr 
                key={getRowKey(item)}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[#111]"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td 
                    key={col.key}
                    className={cn("px-5 py-4", col.className)}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="text-[#888] hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                    pagination.page === pageNum
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
            className="text-[#888] hover:text-white"
          >
            Далее
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
