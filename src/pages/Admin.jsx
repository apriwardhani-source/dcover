import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/url';
import api from '../services/api';
import { AdminSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import { Users, Music2, Disc, BarChart3, Trash2, Ban, CheckCircle, Search, X, Shield, ShieldOff, Image as ImageIcon, Plus, Eye, EyeOff, TrendingUp, Heart } from 'lucide-react';

import { API_URL } from '../config';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats');
    const [searchQuery, setSearchQuery] = useState('');

    // Banner form state
    const [showBannerForm, setShowBannerForm] = useState(false);
    const [bannerForm, setBannerForm] = useState({ title: '', description: '', link_url: '' });
    const [bannerImage, setBannerImage] = useState(null);
    const bannerImageRef = useRef(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [usersData, songsData, albumsData, bannersData] = await Promise.all([
                api.getUsers(),
                api.getSongs(),
                api.getAlbums(),
                api.getAllBanners().catch(() => [])
            ]);
            setUsers(usersData);
            setSongs(songsData);
            setAlbums(albumsData);
            setBanners(bannersData);
        } catch (error) {
            console.error('Load error:', error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspendUser = async (user) => {
        const action = user.suspended ? 'aktifkan' : 'suspend';
        if (!confirm(`${action} user "${user.name}"?`)) return;
        try {
            await api.suspendUser(user.id, !user.suspended);
            toast.success(`User di-${action}`);
            loadData();
        } catch (error) { toast.error('Gagal update user'); }
    };

    const handleChangeRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const action = newRole === 'admin' ? 'jadikan Admin' : 'hapus dari Admin';
        if (!confirm(`${action} "${user.name}"?`)) return;
        try {
            await api.changeUserRole(user.id, newRole);
            toast.success(`User berhasil di-${action}`);
            loadData();
        } catch (error) { toast.error(error.message || 'Gagal update role'); }
    };

    const handleDeleteSong = async (song) => {
        if (!confirm(`Hapus "${song.title}"?`)) return;
        try {
            await api.deleteSong(song.songId);
            toast.success('Lagu dihapus');
            loadData();
        } catch (error) { toast.error('Gagal menghapus'); }
    };

    const handleDeleteAlbum = async (album) => {
        const albumSongs = songs.filter(s => s.albumId === album.albumId);
        if (albumSongs.length > 0) { toast.error('Hapus lagu dulu'); return; }
        if (!confirm(`Hapus "${album.title}"?`)) return;
        try {
            await api.deleteAlbum(album.albumId);
            toast.success('Album dihapus');
            loadData();
        } catch (error) { toast.error('Gagal menghapus'); }
    };

    const handleCreateBanner = async (e) => {
        e.preventDefault();
        if (!bannerForm.title) { toast.error('Judul banner wajib diisi'); return; }
        try {
            await api.createBanner({
                title: bannerForm.title,
                description: bannerForm.description,
                link_url: bannerForm.link_url
            });
            toast.success('Banner dibuat!');
            setShowBannerForm(false);
            setBannerForm({ title: '', description: '', link_url: '' });
            setBannerImage(null);
            loadData();
        } catch (error) { toast.error('Gagal membuat banner'); }
    };

    const handleToggleBanner = async (banner) => {
        try {
            await api.toggleBanner(banner.id);
            toast.success(banner.is_active ? 'Banner dinonaktifkan' : 'Banner diaktifkan');
            loadData();
        } catch (error) { toast.error('Gagal update banner'); }
    };

    const handleDeleteBanner = async (banner) => {
        if (!confirm(`Hapus banner "${banner.title}"?`)) return;
        try {
            await api.deleteBanner(banner.id);
            toast.success('Banner dihapus');
            loadData();
        } catch (error) { toast.error('Gagal menghapus banner'); }
    };

    const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredSongs = songs.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || s.coverArtist?.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredAlbums = albums.filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.artistName?.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalLikes = songs.reduce((acc, s) => acc + (s.likes || 0), 0);
    const topSongs = [...songs].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);

    if (loading) return <div className="pb-player"><AdminSkeleton /></div>;

    return (
        <div className="pb-player">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">🛠️ Admin Panel</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {[
                    { id: 'stats', icon: BarChart3, label: 'Dashboard' },
                    { id: 'users', icon: Users, label: 'Users' },
                    { id: 'songs', icon: Music2, label: 'Lagu' },
                    { id: 'albums', icon: Disc, label: 'Album' },
                    { id: 'banners', icon: ImageIcon, label: 'Banner' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-hover)] text-white'
                            }`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            {activeTab !== 'stats' && activeTab !== 'banners' && (
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-12" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-5 h-5" /></button>}
                </div>
            )}

            {/* Dashboard Stats */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Users" value={users.length} color="blue" />
                        <StatCard icon={Music2} label="Total Lagu" value={songs.length} color="green" />
                        <StatCard icon={Disc} label="Total Album" value={albums.length} color="purple" />
                        <StatCard icon={Heart} label="Total Likes" value={totalLikes} color="pink" />
                    </div>

                    {/* Top Songs */}
                    <div className="bg-[var(--color-surface)] rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[var(--color-primary)]" /> Lagu Terpopuler</h3>
                        {topSongs.length > 0 ? (
                            <div className="space-y-3">
                                {topSongs.map((song, i) => (
                                    <div key={song.songId} className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-[var(--color-text-muted)] w-8">{i + 1}</span>
                                        <div className="w-10 h-10 rounded bg-[var(--color-surface-hover)] overflow-hidden">
                                            {(song.coverImage || song.albumCover) && <img src={getImageUrl(song.coverImage || song.albumCover)} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0"><p className="font-medium truncate">{song.title}</p><p className="text-sm text-[var(--color-text-secondary)] truncate">{song.coverArtist}</p></div>
                                        <span className="text-[var(--color-primary)]">❤️ {song.likes || 0}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-[var(--color-text-secondary)]">Belum ada lagu</p>}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-2">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-lg">
                            <img src={getImageUrl(user.photoURL, '/logo.jpg')} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user.name} {user.suspended && <span className="text-red-500 text-sm">(Suspended)</span>}</p>
                                <p className="text-sm text-[var(--color-text-secondary)] truncate">{user.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'}`}>{user.role || 'user'}</span>
                            <button onClick={() => handleChangeRole(user)} className={`p-2 rounded-lg ${user.role === 'admin' ? 'text-yellow-500' : 'text-[var(--color-primary)]'}`} title={user.role === 'admin' ? 'Hapus Admin' : 'Jadikan Admin'}>
                                {user.role === 'admin' ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                            </button>
                            {user.role !== 'admin' && (
                                <button onClick={() => handleSuspendUser(user)} className={`p-2 rounded-lg ${user.suspended ? 'text-green-500' : 'text-red-500'}`}>
                                    {user.suspended ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                    ))}
                    {filteredUsers.length === 0 && <p className="text-center text-[var(--color-text-secondary)] py-8">Tidak ada user</p>}
                </div>
            )}

            {/* Songs Tab */}
            {activeTab === 'songs' && (
                <div className="space-y-2">
                    {filteredSongs.map(song => (
                        <div key={song.songId} className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-lg">
                            <div className="w-12 h-12 rounded bg-[var(--color-surface-hover)] overflow-hidden flex items-center justify-center">
                                {song.coverImage || song.albumCover ? <img src={getImageUrl(song.coverImage || song.albumCover)} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-[var(--color-text-muted)]" />}
                            </div>
                            <div className="flex-1 min-w-0"><p className="font-medium truncate">{song.title}</p><p className="text-sm text-[var(--color-text-secondary)] truncate">by {song.coverArtist}</p></div>
                            <span className="hidden sm:block text-sm text-[var(--color-text-secondary)]">{song.likes || 0} ❤️</span>
                            <button onClick={() => handleDeleteSong(song)} className="p-2 text-red-500"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    ))}
                    {filteredSongs.length === 0 && <p className="text-center text-[var(--color-text-secondary)] py-8">Tidak ada lagu</p>}
                </div>
            )}

            {/* Albums Tab */}
            {activeTab === 'albums' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAlbums.map(album => (
                        <div key={album.albumId} className="card group relative">
                            <div className="aspect-square rounded-md overflow-hidden mb-4 bg-[var(--color-surface-hover)] flex items-center justify-center">
                                {album.coverImage ? <img src={getImageUrl(album.coverImage)} className="w-full h-full object-cover" /> : <Disc className="w-12 h-12 text-[var(--color-text-muted)]" />}
                            </div>
                            <h3 className="font-bold truncate">{album.title}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] truncate">by {album.artistName}</p>
                            <button onClick={() => handleDeleteAlbum(album)} className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {filteredAlbums.length === 0 && <p className="col-span-full text-center text-[var(--color-text-secondary)] py-8">Tidak ada album</p>}
                </div>
            )}

            {/* Banners Tab */}
            {activeTab === 'banners' && (
                <div className="space-y-4">
                    <button onClick={() => setShowBannerForm(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> Tambah Banner</button>

                    {showBannerForm && (
                        <div className="bg-[var(--color-surface)] rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4">Buat Banner Baru</h3>
                            <form onSubmit={handleCreateBanner} className="space-y-4">
                                <input type="text" placeholder="Judul Banner" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className="input" />
                                <textarea placeholder="Deskripsi (opsional)" value={bannerForm.description} onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })} className="input resize-none" rows={2} />
                                <input type="text" placeholder="Link URL (opsional)" value={bannerForm.link_url} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} className="input" />
                                <div>
                                    <input ref={bannerImageRef} type="file" accept="image/*" onChange={(e) => setBannerImage(e.target.files[0])} className="hidden" />
                                    <button type="button" onClick={() => bannerImageRef.current?.click()} className="btn btn-secondary"><ImageIcon className="w-4 h-4" />{bannerImage ? bannerImage.name : 'Pilih Gambar'}</button>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn btn-primary">Simpan</button>
                                    <button type="button" onClick={() => { setShowBannerForm(false); setBannerForm({ title: '', description: '', link_url: '' }); setBannerImage(null); }} className="btn btn-secondary">Batal</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-2">
                        {banners.map(banner => (
                            <div key={banner.id} className={`flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-lg ${!banner.is_active && 'opacity-50'}`}>
                                <div className="w-20 h-12 rounded bg-[var(--color-surface-hover)] overflow-hidden flex items-center justify-center">
                                    {banner.image_url ? <img src={getImageUrl(banner.image_url)} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-[var(--color-text-muted)]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{banner.title}</p>
                                    <p className="text-sm text-[var(--color-text-secondary)] truncate">{banner.description || 'Tanpa deskripsi'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                <button onClick={() => handleToggleBanner(banner)} className="p-2 text-[var(--color-text-secondary)]">{banner.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                                <button onClick={() => handleDeleteBanner(banner)} className="p-2 text-red-500"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                        {banners.length === 0 && <p className="text-center text-[var(--color-text-secondary)] py-8">Belum ada banner</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = { blue: 'from-blue-500 to-blue-600', green: 'from-emerald-500 to-emerald-600', purple: 'from-purple-500 to-purple-600', pink: 'from-pink-500 to-pink-600' };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-xl`}>
            <Icon className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </div>
    );
};

export default Admin;
