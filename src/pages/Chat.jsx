import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/url';

const Chat = () => {
    const { id: conversationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            const { messages, otherUser } = await api.getMessages(conversationId);
            setMessages(messages || []);
            setOtherUser(otherUser);
        } catch (error) {
            console.error('Load messages error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !otherUser) return;

        setSending(true);
        try {
            const msg = await api.sendMessage(otherUser.id, newMessage.trim());
            setMessages([...messages, {
                ...msg,
                senderName: user.name,
                senderPhoto: user.photoURL
            }]);
            setNewMessage('');
        } catch (error) {
            console.error('Send message error:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeader = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hari ini';
        if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <button onClick={() => navigate('/notifications')} className="p-2 -ml-2 hover:bg-[var(--color-surface-hover)] rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                {otherUser && (
                    <div className="flex items-center gap-3 flex-1">
                        {otherUser.photo ? (
                            <img src={getImageUrl(otherUser.photo)} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                                <span className="font-bold text-black">{otherUser.name?.charAt(0)}</span>
                            </div>
                        )}
                        <div>
                            <p className="font-semibold">{otherUser.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Online</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                        <p>Mulai percakapan dengan mengirim pesan</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.id;
                        const showDateHeader = index === 0 ||
                            formatDateHeader(msg.createdAt) !== formatDateHeader(messages[index - 1].createdAt);

                        return (
                            <div key={msg.id}>
                                {showDateHeader && (
                                    <div className="text-center my-4">
                                        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-1 rounded-full">
                                            {formatDateHeader(msg.createdAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl ${isMe
                                            ? 'bg-[var(--color-primary)] text-black rounded-br-md'
                                            : 'bg-[var(--color-surface-hover)] rounded-bl-md'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <p className={`text-[10px] text-[var(--color-text-muted)] mt-1 ${isMe ? 'text-right' : ''}`}>
                                            {formatTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] safe-bottom">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tulis pesan..."
                        className="input flex-1"
                        style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
