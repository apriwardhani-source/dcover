// Skeleton Loading Components

export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[var(--color-surface-hover)] rounded ${className}`} />
);

export const SkeletonCard = () => (
    <div className="card">
        <Skeleton className="aspect-square rounded-md mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
    </div>
);

export const SkeletonSongRow = () => (
    <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-lg">
        <Skeleton className="w-12 h-12 rounded" />
        <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
    </div>
);

export const SkeletonProfile = () => (
    <div className="flex items-center gap-6 mb-8">
        <Skeleton className="w-32 h-32 rounded-full" />
        <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-3" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
        </div>
    </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

export const SkeletonList = ({ count = 5 }) => (
    <div className="space-y-2">
        {[...Array(count)].map((_, i) => <SkeletonSongRow key={i} />)}
    </div>
);

export const SkeletonBanner = () => (
    <div className="relative mb-8 rounded-xl overflow-hidden">
        <Skeleton className="h-40 sm:h-52 md:h-64 w-full" />
    </div>
);

export default Skeleton;
