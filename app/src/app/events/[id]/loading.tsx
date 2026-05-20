import Skeleton, { SkeletonText } from "@/components/ui/Skeleton";

export default function EventLoading() {
  return (
    <div className="event-page">
      <div className="fixed top-0 left-0 right-0 h-12 bg-dark-bg/95 border-b border-dark-border z-50" />

      <main className="pt-16 pb-24">
        <div className="max-w-[1080px] mx-auto px-6 mt-8">
          <div className="flex flex-col gap-10">
            {/* Header skeleton */}
            <div className="panel-reveal border-b border-light-border pb-8" style={{ animationDelay: "0ms" }}>
              <Skeleton height="12px" width="80px" className="mb-6" light />
              <div className="flex gap-2 mb-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height="22px" width="70px" className="rounded" light />
                ))}
              </div>
              <Skeleton height="32px" width="70%" className="mb-3" light />
              <SkeletonText lines={2} light />
            </div>

            {/* AI summary skeleton */}
            <div className="panel-reveal rounded-lg border border-sky-edge bg-sky-bg p-5" style={{ animationDelay: "60ms" }}>
              <SkeletonText lines={3} light />
            </div>

            {/* Map + metadata skeleton */}
            <div className="panel-reveal grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: "120ms" }}>
              <Skeleton height="400px" className="rounded-lg" light />
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="py-3 border-b border-light-divider space-y-1">
                    <Skeleton height="10px" width="40%" light />
                    <Skeleton height="14px" width="65%" light />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom panels skeleton */}
            <div className="panel-reveal grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: "180ms" }}>
              <Skeleton height="180px" className="rounded-lg" light />
              <Skeleton height="180px" className="rounded-lg" light />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
