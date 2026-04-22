export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ minHeight: '56px' }}>
      {/* Image placeholder */}
      <div className="shimmer rounded-xl flex-shrink-0" style={{ width: 36, height: 36 }} />
      {/* Text */}
      <div className="flex-1 space-y-2">
        <div className="shimmer rounded-full h-4 w-2/3" />
        <div className="shimmer rounded-full h-3 w-1/3" />
      </div>
      {/* Amount */}
      <div className="shimmer rounded-full h-4 w-14" />
    </div>
  )
}

export function SkeletonSection() {
  return (
    <div className="mb-2">
      <div className="px-4 pt-6 pb-3">
        <div className="shimmer rounded-full h-3 w-28" />
      </div>
      <SkeletonRow />
      <div className="border-t border-dashed border-divider" style={{ marginLeft: 52 }} />
      <SkeletonRow />
      <div className="border-t border-dashed border-divider" style={{ marginLeft: 52 }} />
      <SkeletonRow />
    </div>
  )
}
