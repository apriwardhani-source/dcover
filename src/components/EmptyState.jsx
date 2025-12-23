import { Music2, Disc, Heart, Mic, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyMusic = ({ title = "Belum Ada Lagu", subtitle = "Jadilah yang pertama mengupload!", showButton = true }) => (
    <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">
            <Music2 className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">{subtitle}</p>
        {showButton && (
            <Link to="/upload" className="btn btn-primary">
                <Upload className="w-4 h-4" /> Upload Sekarang
            </Link>
        )}
    </div>
);

const EmptyAlbum = ({ title = "Belum Ada Album", subtitle = "Buat album pertamamu!", showButton = true }) => (
    <div className="empty-state animate-fade-in">
        <div className="empty-state-icon" style={{ background: 'var(--gradient-cool)' }}>
            <Disc className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">{subtitle}</p>
        {showButton && (
            <Link to="/upload" className="btn btn-primary">
                <Upload className="w-4 h-4" /> Buat Album
            </Link>
        )}
    </div>
);

const EmptyFavorites = () => (
    <div className="empty-state animate-fade-in">
        <div className="empty-state-icon" style={{ background: 'var(--gradient-warm)' }}>
            <Heart className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">Belum Ada Favorit</h3>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
            Like lagu yang kamu suka, dan mereka akan muncul di sini!
        </p>
        <Link to="/" className="btn btn-secondary">
            Jelajahi Lagu
        </Link>
    </div>
);

const EmptySearch = ({ query }) => (
    <div className="empty-state animate-fade-in">
        <div className="empty-state-icon" style={{ background: 'var(--gradient-fresh)' }}>
            <Mic className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">Tidak Ditemukan</h3>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
            Tidak ada hasil untuk "<span className="text-white">{query}</span>". Coba kata kunci lain!
        </p>
    </div>
);

export { EmptyMusic, EmptyAlbum, EmptyFavorites, EmptySearch };
