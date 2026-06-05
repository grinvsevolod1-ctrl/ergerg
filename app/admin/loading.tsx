export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="relative" role="status" aria-label="Загрузка">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
        <span className="sr-only">Загрузка...</span>
      </div>
    </div>
  )
}
