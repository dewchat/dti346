import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { messageAPI, orderAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/Chat.css';

function Chat() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/');
            return;
        }
        fetchData();

        // Poll for new messages every 3 seconds
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [orderId, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchData = async () => {
        try {
            const [orderData, messagesData] = await Promise.all([
                orderAPI.getById(orderId),
                messageAPI.get(orderId)
            ]);
            setOrder(orderData);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const messagesData = await messageAPI.get(orderId);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await messageAPI.send(orderId, newMessage.trim());
            setNewMessage('');
            await fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('ส่งข้อความไม่สำเร็จ');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="chat-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <Navbar />
            <header className="chat-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="header-info">
                    <h1>{order?.restaurant_name}</h1>
                    <p className="order-id">ออเดอร์ #{orderId}</p>
                </div>
            </header>

            <main className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>เริ่มแชทกับผู้รับหิ้วได้เลย!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.is_mine ? 'mine' : 'theirs'}`}
                            >
                                {!message.is_mine && (
                                    <span className="sender-name">{message.sender_name}</span>
                                )}
                                <div className="message-bubble">
                                    <p>{message.content}</p>
                                    <span className="message-time">{formatTime(message.created_at)}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </main>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="พิมพ์ข้อความ..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="chat-input"
                    disabled={sending}
                />
                <button
                    type="submit"
                    className="send-btn"
                    disabled={!newMessage.trim() || sending}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}

export default Chat;
