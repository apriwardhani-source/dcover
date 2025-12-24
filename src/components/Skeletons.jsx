// Skeleton Components for different pages

// Base skeleton pulse animation styles use CSS animate-pulse from Tailwind

// Skeleton Box - reusable
export const SkeletonBox = ({ className = '' }) => (
    <div className={`bg-[var(--color-surface-hover)] rounded animate-pulse ${className}`} />
);

// Skeleton Circle
export const SkeletonCircle = ({ size = 'w-10 h-10' }) => (
    <div className={`${size} rounded-full bg-[var(--color-surface-hover)] animate-pulse`} />
);

// Home Page Skeleton
export const HomeSkeleton = () => (
    <div className="space-y-6">
        {/* Search bar */}
        <SkeletonBox className="h-12 w-full max-w-md" />

        {/* Suggested users */}
        <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <SkeletonCircle size="w-16 h-16" />
                    <SkeletonBox className="h-3 w-14" />
                </div>
            ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-8 w-20" />
        </div>

        {/* Song list */}
        <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <SkeletonBox className="w-14 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-3/4" />
                        <SkeletonBox className="h-3 w-1/2" />
                    </div>
                    <SkeletonBox className="h-8 w-8 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
    <div className="space-y-6">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-center gap-6">
            <SkeletonCircle size="w-32 h-32 md:w-40 md:h-40" />
            <div className="text-center md:text-left space-y-3 flex-1">
                <SkeletonBox className="h-4 w-20 mx-auto md:mx-0" />
                <SkeletonBox className="h-8 w-48 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-16" />
                </div>
                <div className="flex gap-4 justify-center md:justify-start">
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-4 w-24" />
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
            <SkeletonBox className="h-8 w-16" />
            <SkeletonBox className="h-8 w-16" />
        </div>

        {/* Song list */}
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <SkeletonBox className="w-14 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-3/4" />
                        <SkeletonBox className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Album Detail Skeleton
export const AlbumDetailSkeleton = () => (
    <div className="space-y-6">
        {/* Back button */}
        <SkeletonBox className="h-6 w-24" />

        {/* Album header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <SkeletonBox className="w-48 h-48 md:w-56 md:h-56 rounded-lg mx-auto md:mx-0" />
            <div className="flex flex-col justify-end space-y-3 text-center md:text-left">
                <SkeletonBox className="h-3 w-12 mx-auto md:mx-0" />
                <SkeletonBox className="h-10 w-64 mx-auto md:mx-0" />
                <SkeletonBox className="h-4 w-40 mx-auto md:mx-0" />
            </div>
        </div>

        {/* Play button */}
        <SkeletonCircle size="w-14 h-14" />

        {/* Song list */}
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <SkeletonBox className="w-4 h-4" />
                    <SkeletonBox className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-2/3" />
                        <SkeletonBox className="h-3 w-1/3" />
                    </div>
                    <SkeletonBox className="h-4 w-10" />
                </div>
            ))}
        </div>
    </div>
);

// Song Detail Skeleton
export const SongDetailSkeleton = () => (
    <div className="space-y-6">
        {/* Back button */}
        <SkeletonBox className="h-6 w-24" />

        {/* Song info */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <SkeletonBox className="w-64 h-64 md:w-80 md:h-80 rounded-xl mx-auto md:mx-0" />
            <div className="flex flex-col justify-end space-y-4 text-center md:text-left flex-1">
                <SkeletonBox className="h-3 w-12 mx-auto md:mx-0" />
                <SkeletonBox className="h-10 w-3/4 mx-auto md:mx-0" />
                <SkeletonBox className="h-5 w-1/2 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                    <SkeletonBox className="h-4 w-20" />
                    <SkeletonBox className="h-4 w-20" />
                </div>
                <div className="flex gap-3 justify-center md:justify-start">
                    <SkeletonCircle size="w-14 h-14" />
                    <SkeletonCircle size="w-10 h-10" />
                    <SkeletonCircle size="w-10 h-10" />
                </div>
            </div>
        </div>

        {/* Comments */}
        <div className="space-y-4 mt-8">
            <SkeletonBox className="h-6 w-32" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <SkeletonCircle size="w-10 h-10" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-3 w-full" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Notifications Skeleton
export const NotificationsSkeleton = () => (
    <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <SkeletonCircle size="w-10 h-10" />
            <SkeletonBox className="h-7 w-32" />
        </div>

        {/* Notification items */}
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-3 w-20" />
                </div>
            </div>
        ))}
    </div>
);

// User Profile Skeleton (same as Profile but without edit button area)
export const UserProfileSkeleton = () => (
    <div className="space-y-6">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-center gap-6">
            <SkeletonCircle size="w-32 h-32 md:w-40 md:h-40" />
            <div className="text-center md:text-left space-y-3 flex-1">
                <SkeletonBox className="h-4 w-24 mx-auto md:mx-0" />
                <SkeletonBox className="h-8 w-48 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-16" />
                </div>
                <div className="flex gap-4 justify-center md:justify-start">
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-4 w-24" />
                </div>
                <SkeletonBox className="h-10 w-28 rounded-full mx-auto md:mx-0" />
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
            <SkeletonBox className="h-8 w-16" />
            <SkeletonBox className="h-8 w-16" />
        </div>

        {/* Song list */}
        <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <SkeletonBox className="w-14 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-3/4" />
                        <SkeletonBox className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Admin Skeleton
export const AdminSkeleton = () => (
    <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 space-y-2">
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-8 w-12" />
                </div>
            ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-8 w-20" />
        </div>

        {/* Table */}
        <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <SkeletonCircle size="w-10 h-10" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBox className="h-4 w-1/3" />
                        <SkeletonBox className="h-3 w-1/4" />
                    </div>
                    <SkeletonBox className="h-8 w-20" />
                </div>
            ))}
        </div>
    </div>
);

// Upload Skeleton
export const UploadSkeleton = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
        <SkeletonBox className="h-8 w-40" />

        {/* Tabs */}
        <div className="flex gap-2">
            <SkeletonBox className="h-10 w-24 rounded-full" />
            <SkeletonBox className="h-10 w-24 rounded-full" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
            <SkeletonBox className="h-12 w-full rounded-lg" />
            <SkeletonBox className="h-12 w-full rounded-lg" />
            <SkeletonBox className="h-12 w-full rounded-lg" />
            <SkeletonBox className="h-32 w-full rounded-lg" />
            <SkeletonBox className="h-12 w-32 rounded-lg" />
        </div>
    </div>
);

export default {
    HomeSkeleton,
    ProfileSkeleton,
    AlbumDetailSkeleton,
    SongDetailSkeleton,
    NotificationsSkeleton,
    UserProfileSkeleton,
    AdminSkeleton,
    UploadSkeleton
};
