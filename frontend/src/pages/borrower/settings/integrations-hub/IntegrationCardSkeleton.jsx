/**
 * Skeleton placeholder for integration card during loading.
 */
export default function IntegrationCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col h-full animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-200" />
        <div className="w-16 h-5 rounded bg-slate-200" />
      </div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-full mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 rounded bg-slate-200" />
        <div className="h-5 w-20 rounded bg-slate-200" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="mt-auto pt-3 flex gap-2">
        <div className="h-9 w-24 rounded bg-slate-200" />
        <div className="h-9 w-20 rounded bg-slate-200" />
      </div>
    </div>
  )
}
