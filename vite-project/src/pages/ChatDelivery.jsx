import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Store } from 'lucide-react';
import { restaurantAPI, messageAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/ChatDelivery.css';

function ChatDelivery() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [restaurant, setRestaurant] = useState(null);
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
    }, [restaurantId, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchData = async () => {
        try {
            const [restaurantData, messagesData] = await Promise.all([
                restaurantAPI.getById(restaurantId),
                messageAPI.getRestaurantChat(restaurantId)
            ]);
            setRestaurant(restaurantData);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const messagesData = await messageAPI.getRestaurantChat(restaurantId);
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
            await messageAPI.sendRestaurantChat(restaurantId, newMessage.trim());
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
            <div className="chat-delivery-container">
                <div className="loading-container">
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-delivery-container">
            <Navbar />
            <header className="chat-delivery-header">
                <button className="back-btn" onClick={() => navigate(`/restaurant/${restaurantId}`)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="header-content">
                    <h1>{restaurant?.name}</h1>
                    <p className="header-subtitle">แชทกับผู้รับหิ้ว</p>
                </div>
            </header>

            {/* Restaurant Info Card */}
            <div className="restaurant-info-card">
                <div className="restaurant-avatar">
                    <Store size={24} />
                </div>
                <div className="restaurant-details">
                    <h3>{restaurant?.owner_name || 'ผู้รับหิ้ว'}</h3>
                    <p>นัดรับ: {restaurant?.pickup_time}</p>
                    <p className="owner-name">{restaurant?.pickup_location}</p>
                </div>
            </div>

            <main className="chat-delivery-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>เริ่มสนทนากับผู้รับหิ้วได้เลย!</p>
                        <p style={{ fontSize: '13px', opacity: 0.7 }}>สอบถามเมนู หรือนัดเวลารับของ</p>
                    </div>
                ) : (
                    messages.map((message) => (
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
                    ))
                )}
                <div ref={messagesEndRef} />
            </main>

            <form className="chat-delivery-input" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="พิมพ์ข้อความ..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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

export default ChatDelivery;
