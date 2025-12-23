import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

const Login = () => {
    const { user, loading, setUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const googleButtonRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Load Google script
    useEffect(() => {
        if (window.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        document.head.appendChild(script);
    }, []);

    // Initialize Google button when script is loaded
    useEffect(() => {
        if (!scriptLoaded || !googleButtonRef.current || initializedRef.current) return;

        const handleCredentialResponse = async (response) => {
            try {
                setError('');
                const payload = JSON.parse(atob(response.credential.split('.')[1]));

                const { default: api } = await import('../services/api');
                const result = await api.loginWithGoogle({
                    googleId: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    photoURL: payload.picture
                });

                setUser(result.user);
                navigate('/');
            } catch (err) {
                console.error('Login error:', err);
                setError(err.message || 'Login gagal');
            }
        };

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 300
        });

        initializedRef.current = true;
    }, [scriptLoaded, navigate, setUser]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
            {/* Logo & Title */}
            <div className="mb-12 text-center">
                <img
                    src="/logo.jpg"
                    alt="dcover"
                    className="w-16 h-16 rounded-xl mx-auto mb-6"
                />
                <h1 className="text-3xl font-bold text-white mb-2">
                    Masuk ke dcover
                </h1>
                <p className="text-gray-400">
                    Platform berbagi cover musik
                </p>
            </div>

            {/* Login Box */}
            <div className="w-full max-w-sm flex flex-col items-center">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 w-full p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Google Button Container */}
                <div ref={googleButtonRef} className="mb-4" />

                {!scriptLoaded && (
                    <div className="w-[300px] h-[44px] bg-gray-800 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                <p className="text-gray-500 text-xs text-center mt-4">
                    Login otomatis mendaftarkan akun baru
                </p>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center">
                <p className="text-gray-600 text-xs">
                    Dengan login, Anda menyetujui Syarat & Ketentuan dcover
                </p>
            </div>
        </div>
    );
};

export default Login;
