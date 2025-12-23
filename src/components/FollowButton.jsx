import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

const FollowButton = ({ userId, userName, onFollowChange }) => {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user && userId && user.id !== userId) {
            checkFollowStatus();
        } else {
            setLoading(false);
        }
    }, [user, userId]);

    const checkFollowStatus = async () => {
        try {
            const result = await api.checkFollowing(userId);
            setIsFollowing(result.following);
        } catch (error) {
            console.error('Check follow error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!user) {
            toast.error('Login untuk follow artist');
            return;
        }

        setProcessing(true);
        try {
            if (isFollowing) {
                await api.unfollowUser(userId);
                setIsFollowing(false);
                toast.success(`Unfollow ${userName}`);
            } else {
                await api.followUser(userId);
                setIsFollowing(true);
                toast.success(`Mengikuti ${userName}`);
            }
            onFollowChange?.();
        } catch (error) {
            toast.error('Gagal mengubah status follow');
        } finally {
            setProcessing(false);
        }
    };

    // Don't show button if viewing own profile or not logged in
    if (!user || user.id === userId) return null;

    if (loading) {
        return (
            <button className="btn btn-secondary" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
            </button>
        );
    }

    return (
        <button
            onClick={handleToggleFollow}
            disabled={processing}
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
        >
            {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <><UserMinus className="w-4 h-4" /> Unfollow</>
            ) : (
                <><UserPlus className="w-4 h-4" /> Follow</>
            )}
        </button>
    );
};

export default FollowButton;
