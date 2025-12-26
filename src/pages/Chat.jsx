import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Send, Loader2, Paperclip, Smile, Mic } from 'lucide-react';
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
    }, [messages, loading]);

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
            <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0f0f0f] z-50 flex flex-col font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
                }}
            />

            {/* Header - Glassmorphism */}
            <div className="relative flex items-center gap-3 p-4 backdrop-blur-md bg-[#1c1c1e]/80 border-b border-white/10 z-10 shadow-sm">
                <button onClick={() => navigate('/notifications')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                {otherUser && (
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {otherUser.photo ? (
                            <img src={getImageUrl(otherUser.photo)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-transparent" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                                <span className="font-bold text-black text-lg">{otherUser.name?.charAt(0)}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate text-base leading-none mb-1">{otherUser.name}</p>
                            <p className="text-xs text-blue-400 font-medium">Online</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-0">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="bg-[#1c1c1e] text-white/50 px-6 py-3 rounded-full text-sm backdrop-blur-sm">
                            Belum ada pesan. Sapa sekarang! 👋
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.id;
                        const showDateHeader = index === 0 ||
                            formatDateHeader(msg.createdAt) !== formatDateHeader(messages[index - 1].createdAt);

                        return (
                            <div key={msg.id} className="flex flex-col">
                                {showDateHeader && (
                                    <div className="self-center my-4 sticky top-2 z-10">
                                        <span className="text-[11px] font-medium text-white/80 bg-[#000000]/40 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                                            {formatDateHeader(msg.createdAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] relative group flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {/* Message Bubble */}
                                        <div className={`
                                            px-4 py-2 rounded-2xl relative shadow-sm
                                            ${isMe
                                                ? 'bg-[var(--color-primary)] text-black rounded-tr-sm'
                                                : 'bg-[#252525] text-white rounded-tl-sm border border-white/5'
                                            }
                                        `}>
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>

                                            {/* Timestamp & Status */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 select-none ${isMe ? 'opacity-70 text-black' : 'opacity-60 text-white'}`}>
                                                <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    <span className="text-[10px]">
                                                        {msg.isRead ? (
                                                            <div className="flex -space-x-1">
                                                                <span className="text-black">✓</span>
                                                                <span className="text-black">✓</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-black">✓</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Small tail SVG would go here for extra detail */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-2 pb-8 bg-[#1c1c1e] border-t border-white/5 backdrop-blur-lg z-10">
                <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
                    {/* Attachment Button */}
                    <button
                        type="button"
                        className="w-10 h-10 rounded-full text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors hover:bg-white/5 shrink-0"
                    >
                        <Paperclip className="w-6 h-6 transform -rotate-45" />
                    </button>

                    {/* Input Wrapper */}
                    <div className="flex-1 bg-[#2c2c2e] rounded-2xl flex items-center min-h-[42px] px-1 border border-transparent focus-within:border-[var(--color-primary)]/30 transition-all">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Pesan"
                            className="flex-1 bg-transparent text-white px-3 py-2 outline-none placeholder:text-[#9ca3af] min-w-0"
                            disabled={sending}
                        />
                        {/* Sticker Button */}
                        <button
                            type="button"
                            className="p-2 text-[#9ca3af] hover:text-white transition-colors rounded-full hover:bg-white/5 shrink-0"
                        >
                            <Smile className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Send / Mic Button */}
                    {newMessage.trim() ? (
                        <button
                            type="submit"
                            disabled={sending}
                            className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--color-primary)]/20 shrink-0"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 ml-0.5" fill="currentColor" />
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="w-10 h-10 rounded-full bg-[#2c2c2e] text-white flex items-center justify-center hover:bg-[#3c3c3e] transition-all active:scale-95 shrink-0"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Chat;
