import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Music2, Disc, Heart, Play, Pause, Users, UserPlus, UserMinus, X } from 'lucide-react';
import { API_URL } from '../config';

const UserProfile = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const { playSong, currentSong, isPlaying } = usePlayer();

    const [profile, setProfile] = useState(null);
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showModal, setShowModal] = useState(null);
    const [modalUsers, setModalUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('songs');

    useEffect(() => {
        if (userId) {
            loadProfile();
        }
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profileData, songsData, albumsData, followersData, followingData] = await Promise.all([
                api.getUserProfile(userId),
                api.getUserSongs(userId),
                api.getUserAlbums(userId),
                api.getFollowers(userId),
                api.getFollowing(userId)
            ]);

            setProfile(profileData);
            setSongs(songsData);
            setAlbums(albumsData);
            setFollowersCount(followersData.count || 0);
            setFollowingCount(followingData.count || 0);

            // Check if current user follows this user
            if (currentUser && currentUser.id !== parseInt(userId)) {
                const followCheck = await api.checkFollowing(userId);
                setIsFollowing(followCheck.following);
            }
        } catch (error) {
            console.error('Load profile error:', error);
            toast.error('Gagal memuat profil');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await api.unfollowUser(userId);
                setIsFollowing(false);
                setFollowersCount(c => c - 1);
                toast.success('Berhenti mengikuti');
            } else {
                await api.followUser(userId);
                setIsFollowing(true);
                setFollowersCount(c => c + 1);
                toast.success('Berhasil mengikuti!');
            }
        } catch (error) {
            toast.error('Gagal');
        }
    };

    const handleShowModal = async (type) => {
        setShowModal(type);
        try {
            const data = type === 'followers'
                ? await api.getFollowers(userId)
                : await api.getFollowing(userId);
            setModalUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const totalLikes = songs.reduce((acc, s) => acc + (s.likes || 0), 0);

    const getPhotoUrl = () => {
        if (profile?.photoURL?.startsWith('http')) return profile.photoURL;
        if (profile?.photoURL) return `${API_URL}${profile.photoURL}`;
        return '/default-avatar.png';
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    if (!profile) return <div className="text-center py-16">User tidak ditemukan</div>;

    const isOwnProfile = currentUser?.id === parseInt(userId);

    return (
        <div className="pb-player">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <img src={getPhotoUrl()} alt={profile?.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-xl" />

                <div className="text-center md:text-left flex-1">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] uppercase">Cover Artist</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-1">{profile?.name}</h1>
                    {profile?.bio && <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">{profile.bio}</p>}

                    <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1"><Music2 className="w-4 h-4" />{songs.length} Lagu</span>
                        <span className="flex items-center gap-1"><Disc className="w-4 h-4" />{albums.length} Album</span>
                        <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{totalLikes} Likes</span>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                        <button onClick={() => handleShowModal('followers')} className="text-[var(--color-text-secondary)] hover:text-white">
                            <strong className="text-white">{followersCount}</strong> Pengikut
                        </button>
                        <button onClick={() => handleShowModal('following')} className="text-[var(--color-text-secondary)] hover:text-white">
                            <strong className="text-white">{followingCount}</strong> Mengikuti
                        </button>
                    </div>

                    {!isOwnProfile && currentUser && (
                        <button
                            onClick={handleFollow}
                            className={`mt-4 flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors ${isFollowing
                                    ? 'bg-[var(--color-surface-hover)] text-white hover:bg-red-500/20 hover:text-red-400'
                                    : 'bg-[var(--color-primary)] text-black hover:opacity-90'
                                }`}
                        >
                            {isFollowing ? <><UserMinus className="w-5 h-5" /> Berhenti Ikuti</> : <><UserPlus className="w-5 h-5" /> Ikuti</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--color-border)]">
                {['songs', 'albums'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium relative ${activeTab === tab ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                        {tab === 'songs' ? 'Lagu' : 'Album'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />}
                    </button>
                ))}
            </div>

            {/* Songs */}
            {activeTab === 'songs' && (
                songs.length > 0 ? (
                    <div className="space-y-2">
                        {songs.map((song, index) => {
                            const isCurrent = currentSong?.songId === song.songId;
                            const cover = song.coverImage || song.albumCover;
                            const coverUrl = cover?.startsWith('http') ? cover : `${API_URL}${cover}`;

                            return (
                                <div key={song.songId} className={`flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors ${isCurrent ? 'bg-[var(--color-surface-hover)]' : ''}`}>
                                    <button onClick={() => playSong(song, songs, index)} className="relative w-14 h-14 flex-shrink-0">
                                        {cover ? (
                                            <img src={coverUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-lg bg-[var(--color-surface-hover)] flex items-center justify-center">
                                                <Music2 className="w-6 h-6 text-[var(--color-text-muted)]" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                            {isCurrent && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                        </div>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${isCurrent ? 'text-[var(--color-primary)]' : ''}`}>{song.title}</p>
                                        <p className="text-sm text-[var(--color-text-secondary)] truncate">Original: {song.originalArtist}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                                        <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {song.likes || 0}</span>
                                        <span className="flex items-center gap-1"><Play className="w-4 h-4" /> {song.plays || 0}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Music2 className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                        <p className="text-[var(--color-text-secondary)]">Belum ada lagu</p>
                    </div>
                )
            )}

            {/* Albums */}
            {activeTab === 'albums' && (
                albums.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {albums.map(album => {
                            const coverUrl = album.coverImage?.startsWith('http') ? album.coverImage : `${API_URL}${album.coverImage}`;
                            return (
                                <Link key={album.albumId} to={`/album/${album.albumId}`} className="group">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-[var(--color-surface-hover)] mb-2">
                                        {album.coverImage ? (
                                            <img src={coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Disc className="w-12 h-12 text-[var(--color-text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold truncate">{album.title}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{album.songCount || 0} lagu</p>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Disc className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
                        <p className="text-[var(--color-text-secondary)]">Belum ada album</p>
                    </div>
                )
            )}

            {/* Followers/Following Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowModal(null)}>
                    <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-[var(--color-primary)]" />
                                {showModal === 'followers' ? 'Pengikut' : 'Mengikuti'}
                            </h3>
                            <button onClick={() => setShowModal(null)} className="p-2 hover:bg-[var(--color-surface-hover)] rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-96 p-2">
                            {modalUsers.length === 0 ? (
                                <p className="text-center py-8 text-[var(--color-text-secondary)]">
                                    {showModal === 'followers' ? 'Belum ada pengikut' : 'Belum mengikuti siapapun'}
                                </p>
                            ) : (
                                modalUsers.map(u => (
                                    <Link key={u.id} to={`/user/${u.id}`} onClick={() => setShowModal(null)}
                                        className="flex items-center gap-3 p-3 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                                    >
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center">
                                                <span className="text-lg font-bold">{u.name?.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{u.name}</p>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{u.songCount} lagu</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
