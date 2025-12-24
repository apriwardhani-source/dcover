import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/url';

import { API_URL } from '../config';

const Comments = ({ songId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [songId]);

    const loadComments = async () => {
        try {
            const data = await api.getComments(songId);
            setComments(data);
        } catch (error) {
            console.error('Load comments error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        try {
            const comment = await api.addComment(songId, newComment.trim());
            setComments([comment, ...comments]);
            setNewComment('');
            toast.success('Komentar ditambahkan!');
        } catch (error) {
            toast.error('Gagal menambahkan komentar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!confirm('Hapus komentar ini?')) return;
        try {
            await api.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
            toast.success('Komentar dihapus');
        } catch (error) {
            toast.error('Gagal menghapus komentar');
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = (now - d) / 1000;

        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />
                Komentar ({comments.length})
            </h3>

            {/* Add Comment Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
                    <img
                        src={getImageUrl(user.photoURL, '/logo.jpg')}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tulis komentar..."
                            className="input flex-1"
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="btn btn-primary px-4"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-[var(--color-text-secondary)] text-center py-4 mb-4 bg-[var(--color-surface-hover)] rounded-lg">
                    Login untuk menambahkan komentar
                </p>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-primary)]" />
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                            <img
                                src={getImageUrl(comment.userPhoto, '/logo.jpg')}
                                alt={comment.userName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{comment.userName}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">{formatDate(comment.created_at)}</span>
                                </div>
                                <p className="text-[var(--color-text-secondary)] break-words">{comment.content}</p>
                            </div>
                            {(user?.id === comment.user_id || user?.role === 'admin') && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="p-2 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-[var(--color-text-secondary)] py-8">
                    Belum ada komentar. Jadilah yang pertama!
                </p>
            )}
        </div>
    );
};

export default Comments;
