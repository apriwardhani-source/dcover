import { useState } from 'react';
import { Search, X, SlidersHorizontal, Calendar, Music2 } from 'lucide-react';

const SearchFilters = ({ onSearch, onFilterChange, totalResults = 0 }) => {
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        sortBy: 'newest',
        hasLyrics: false
    });

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch?.(value);
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    const clearSearch = () => {
        setQuery('');
        onSearch?.('');
    };

    const sortOptions = [
        { value: 'newest', label: 'Terbaru' },
        { value: 'oldest', label: 'Terlama' },
        { value: 'popular', label: 'Terpopuler' },
        { value: 'az', label: 'A-Z' },
        { value: 'za', label: 'Z-A' }
    ];

    return (
        <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Cari lagu, artist..."
                        value={query}
                        onChange={handleSearchChange}
                        className="input"
                        style={{ paddingLeft: '3rem', paddingRight: '2.5rem' }}
                    />
                    {query && (
                        <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-hover)] text-white'}`}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span className="hidden sm:inline">Filter</span>
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-[var(--color-surface)] rounded-lg p-4 animate-fade-in">
                    <div className="flex flex-wrap gap-4">
                        {/* Sort By */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Urutkan
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="input"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Has Lyrics */}
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[var(--color-surface-hover)] rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={filters.hasLyrics}
                                    onChange={(e) => handleFilterChange('hasLyrics', e.target.checked)}
                                    className="w-5 h-5 rounded accent-[var(--color-primary)]"
                                />
                                <span className="flex items-center gap-2">
                                    <Music2 className="w-4 h-4" /> Dengan Lirik
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Results count */}
            {query && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {totalResults} hasil untuk "{query}"
                </p>
            )}
        </div>
    );
};

export default SearchFilters;
