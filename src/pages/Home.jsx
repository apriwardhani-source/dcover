import { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SongCard from '../components/SongCard';
import { HomeSkeleton } from '../components/Skeletons';
import SearchFilters from '../components/SearchFilters';
import SuggestedUsers from '../components/SuggestedUsers';
import { Music2, TrendingUp, Clock, Heart, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { API_URL } from '../config';

const Home = () => {
    const { user } = useAuth();
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [banners, setBanners] = useState([]);
    const [likedSongIds, setLikedSongIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ sortBy: 'newest', hasLyrics: false });
    const [activeTab, setActiveTab] = useState('all');
    const [currentBanner, setCurrentBanner] = useState(0);

    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const loadData = async () => {
        try {
            const [songsData, albumsData, bannersData] = await Promise.all([
                api.getSongs(),
                api.getAlbums(),
                api.getBanners().catch(() => [])
            ]);
            setSongs(songsData);
            setAlbums(albumsData);
            setBanners(bannersData);

            if (user) {
                const liked = await api.getLikedSongs(user.id);
                setLikedSongIds(liked);
            }
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const songsWithLikes = songs.map(song => ({
        ...song,
        likedBy: likedSongIds.includes(song.songId) ? [user?.id] : []
    }));

    const filteredSongs = useMemo(() => {
        let result = songsWithLikes.filter(song => {
            const matchesSearch =
                song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.coverArtist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.originalArtist?.toLowerCase().includes(searchQuery.toLowerCase());

            if (activeTab === 'liked' && user) {
                return matchesSearch && likedSongIds.includes(song.songId);
            }

            if (filters.hasLyrics) {
                return matchesSearch && song.lyrics;
            }

            return matchesSearch;
        });

        // Apply sorting
        switch (filters.sortBy) {
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'popular':
                result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'az':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'za':
                result.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default: // newest
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return result;
    }, [songsWithLikes, searchQuery, filters, activeTab, likedSongIds, user]);

    const recentSongs = [...songsWithLikes].slice(0, 6);
    const popularSongs = [...songsWithLikes].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 6);

    if (loading) {
        return (
            <div className="pb-player">
                <HomeSkeleton />
            </div>
        );
    }

    return (
        <div className="pb-player">
            {/* Banner Carousel */}
            {banners.length > 0 && (
                <div className="relative mb-8 rounded-xl overflow-hidden">
                    <div className="relative h-40 sm:h-52 md:h-64">
                        {banners.map((banner, index) => (
                            <a key={banner.id} href={banner.link_url || '#'} target={banner.link_url ? '_blank' : '_self'} rel="noopener noreferrer"
                                className={`absolute inset-0 transition-opacity duration-500 ${index === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                {banner.image_url ? (
                                    <img src={getImageUrl(banner.image_url)} alt={banner.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{banner.title}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{banner.title}</h3>
                                    {banner.description && <p className="text-sm text-white/80 line-clamp-2">{banner.description}</p>}
                                    {banner.link_url && <span className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] mt-2"><ExternalLink className="w-4 h-4" /> Lihat detail</span>}
                                </div>
                            </a>
                        ))}
                    </div>
                    {banners.length > 1 && (
                        <>
                            <button onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                {banners.map((_, index) => (
                                    <button key={index} onClick={() => setCurrentBanner(index)} className={`w-2 h-2 rounded-full ${index === currentBanner ? 'bg-white' : 'bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold mb-6">
                {getGreeting()}, <span className="text-[var(--color-primary)]">{user?.name?.split(' ')[0] || 'Artist'}!</span>
            </h1>

            {/* Search & Filters */}
            <SearchFilters
                onSearch={setSearchQuery}
                onFilterChange={setFilters}
                totalResults={searchQuery ? filteredSongs.length : 0}
            />

            {/* Suggested Users - horizontal scroll */}
            {user && <SuggestedUsers />}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>Semua</TabButton>
                {user && (
                    <TabButton active={activeTab === 'liked'} onClick={() => setActiveTab('liked')}>
                        <Heart className="w-4 h-4" /> Favorit
                    </TabButton>
                )}
            </div>

            {/* Content */}
            {searchQuery || filters.hasLyrics ? (
                <div>
                    <h2 className="text-xl font-bold mb-4">Hasil Pencarian ({filteredSongs.length})</h2>
                    {filteredSongs.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredSongs.map((song, index) => (
                                <SongCard key={song.songId} song={song} songs={filteredSongs} index={index} onLikeChange={loadData} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Music2 className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                            <p className="text-[var(--color-text-secondary)]">Tidak ada hasil</p>
                        </div>
                    )}
                </div>
            ) : activeTab === 'liked' ? (
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-[var(--color-primary)]" /> Lagu Favorit
                    </h2>
                    {filteredSongs.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredSongs.map((song, index) => (
                                <SongCard key={song.songId} song={song} songs={filteredSongs} index={index} onLikeChange={loadData} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Heart className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                            <p className="text-[var(--color-text-secondary)]">Belum ada lagu favorit</p>
                        </div>
                    )}
                </div>
            ) : songs.length === 0 ? (
                <div className="text-center py-20">
                    <Music2 className="w-20 h-20 mx-auto text-[var(--color-text-muted)] mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Belum Ada Cover Lagu</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6">Jadilah yang pertama mengupload!</p>
                    <Link to="/upload" className="btn btn-primary">Upload Sekarang</Link>
                </div>
            ) : (
                <>
                    {albums.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-xl font-bold mb-4">💿 Album Terbaru</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {albums.slice(0, 5).map((album) => (
                                    <Link key={album.albumId} to={`/album/${album.albumId}`} className="card hover-lift">
                                        <div className="aspect-square rounded-md overflow-hidden mb-4 bg-[var(--color-surface-hover)]">
                                            {album.coverImage ? (
                                                <img src={getImageUrl(album.coverImage)} alt={album.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Music2 className="w-12 h-12 text-[var(--color-text-muted)]" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold truncate">{album.title}</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)] truncate">oleh {album.artistName}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {recentSongs.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[var(--color-primary)]" /> Baru Ditambahkan
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {recentSongs.map((song, index) => (
                                    <SongCard key={song.songId} song={song} songs={recentSongs} index={index} onLikeChange={loadData} />
                                ))}
                            </div>
                        </section>
                    )}

                    {popularSongs.length > 0 && songs.some(s => s.likes > 0) && (
                        <section className="mb-10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" /> Paling Disukai
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {popularSongs.map((song, index) => (
                                    <SongCard key={song.songId} song={song} songs={popularSongs} index={index} onLikeChange={loadData} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

const TabButton = ({ children, active, onClick }) => (
    <button onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${active ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-hover)] text-white hover:bg-[var(--color-surface-active)]'}`}>
        {children}
    </button>
);

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Siang';
    return 'Selamat Malam';
};

export default Home;
