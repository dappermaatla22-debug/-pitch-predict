export function SkeletonCard() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="skeleton h-6 w-12" />
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPickCard() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-8 w-16" />
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-10 rounded-full" />
        </div>
      </div>
      <div className="border-t border-white/5 pt-3 flex items-center justify-between">
        <div className="skeleton h-3 w-36" />
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="glass-card p-4">
      <div className="skeleton h-7 w-16 mb-1" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPickList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPickCard key={i} />
      ))}
    </div>
  );
}
