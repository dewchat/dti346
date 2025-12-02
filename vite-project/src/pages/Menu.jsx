import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Plus, Minus, ShoppingCart, Check, MessageCircle, User } from 'lucide-react';
import { menuAPI, cartAPI, restaurantAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/Menu.css';

function Menu() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [addedItems, setAddedItems] = useState({});

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/');
            return;
        }
        fetchMenuData();
    }, [restaurantId, navigate]);

    const fetchMenuData = async () => {
        try {
            const data = await menuAPI.getByRestaurant(restaurantId);
            setRestaurant(data.restaurant);
            setMenuItems(data.menu);

            // Initialize quantities
            const initialQuantities = {};
            data.menu.forEach(item => {
                initialQuantities[item.id] = 1;
            });
            setQuantities(initialQuantities);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (itemId, delta) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
        }));
    };

    const handleAddToCart = async (item) => {
        try {
            await cartAPI.add(item.id, quantities[item.id] || 1);
            setAddedItems(prev => ({ ...prev, [item.id]: true }));

            // Reset after animation
            setTimeout(() => {
                setAddedItems(prev => ({ ...prev, [item.id]: false }));
            }, 2000);
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('เพิ่มลงตะกร้าไม่สำเร็จ');
        }
    };

    const handleChatWithDelivery = () => {
        // Navigate to a pre-order chat or contact page
        navigate(`/chat-delivery/${restaurantId}`);
    };

    if (loading) {
        return (
            <div className="menu-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-container">
            <Navbar />
            <header className="menu-header">
                <button className="back-button" onClick={() => navigate('/home')}>
                    <ArrowLeft size={24} />
                </button>
                <h1>{restaurant?.name}</h1>
                <button className="cart-button" onClick={() => navigate('/cart')}>
                    <ShoppingCart size={24} />
                </button>
            </header>

            <div className="restaurant-banner">
                <div className="banner-info">
                    <div className="info-row">
                        <Clock size={16} />
                        <span>นัดรับ: {restaurant?.pickup_time}</span>
                    </div>
                    <div className="info-row">
                        <MapPin size={16} />
                        <span>{restaurant?.pickup_location}</span>
                    </div>
                </div>

                {/* Chat with Delivery Person Button */}
                <button
                    className="chat-delivery-btn"
                    onClick={handleChatWithDelivery}
                >
                    <MessageCircle size={18} />
                    <span>แชทกับผู้รับหิ้ว</span>
                </button>
            </div>

            <main className="menu-content">
                <h2 className="menu-title">เมนูทั้งหมด</h2>

                {menuItems.length === 0 ? (
                    <div className="empty-menu">
                        <p>ยังไม่มีเมนูในร้านนี้</p>
                        <p className="empty-hint">ลองแชทสอบถามผู้รับหิ้วได้เลย!</p>
                    </div>
                ) : (
                    <div className="menu-grid">
                        {menuItems.map((item) => (
                            <div key={item.id} className="menu-card">
                                <div className="menu-image">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} />
                                    ) : (
                                        <div className="placeholder-image">🍽️</div>
                                    )}
                                </div>
                                <div className="menu-info">
                                    <h3 className="menu-name">{item.name}</h3>
                                    <p className="menu-description">{item.description}</p>
                                    <p className="menu-price">฿{item.price}</p>

                                    <div className="menu-actions">
                                        <div className="quantity-control">
                                            <button
                                                className="qty-btn"
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="qty-value">{quantities[item.id] || 1}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            className={`add-to-cart-btn ${addedItems[item.id] ? 'added' : ''}`}
                                            onClick={() => handleAddToCart(item)}
                                            disabled={addedItems[item.id]}
                                        >
                                            {addedItems[item.id] ? (
                                                <>
                                                    <Check size={16} />
                                                    <span>เพิ่มแล้ว</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={16} />
                                                    <span>เพิ่ม</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <div className="view-cart-fab" onClick={() => navigate('/cart')}>
                <ShoppingCart size={24} />
                <span>ดูตะกร้า</span>
            </div>
        </div>
    );
}

export default Menu;
