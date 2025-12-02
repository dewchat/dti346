import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, MapPin, Clock, ShoppingBag } from 'lucide-react';
import { cartAPI, orderAPI } from '../services/api';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState({ restaurants: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const data = await cartAPI.get();
      setCartData(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await cartAPI.remove(itemId);
      } else {
        await cartAPI.update(itemId, { quantity: newQuantity });
      }
      fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('ต้องการล้างตะกร้าทั้งหมดหรือไม่?')) {
      try {
        await cartAPI.clear();
        fetchCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (cartData.item_count === 0) {
      alert('ตะกร้าว่างเปล่า');
      return;
    }

    setOrdering(true);
    try {
      await orderAPI.create();
      alert('สั่งหิ้วสำเร็จ! ดูรายละเอียดได้ที่ประวัติการสั่งซื้อ');
      navigate('/history');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('สั่งหิ้วไม่สำเร็จ: ' + error.message);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <header className="cart-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>ตะกร้าของฉัน</h1>
        {cartData.item_count > 0 && (
          <button className="clear-cart-btn" onClick={handleClearCart}>
            <Trash2 size={20} />
          </button>
        )}
      </header>

      <main className="cart-content">
        {cartData.restaurants.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={64} />
            <h2>ตะกร้าว่างเปล่า</h2>
            <p>เริ่มเลือกเมนูที่ต้องการหิ้วเลย!</p>
            <button className="browse-btn" onClick={() => navigate('/home')}>
              ดูร้านที่เปิดรับหิ้ว
            </button>
          </div>
        ) : (
          <div className="cart-restaurants">
            {cartData.restaurants.map((restaurantGroup, index) => (
              <div key={index} className="restaurant-group">
                <div className="restaurant-header">
                  <h2>{restaurantGroup.restaurant.name}</h2>
                  <div className="pickup-info">
                    <div className="info-item">
                      <Clock size={14} />
                      <span>{restaurantGroup.restaurant.pickup_time}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={14} />
                      <span>{restaurantGroup.restaurant.pickup_location}</span>
                    </div>
                  </div>
                </div>

                <div className="cart-items">
                  {restaurantGroup.items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <p className="item-price">฿{item.price} x {item.quantity}</p>
                        {item.note && <p className="item-note">หมายเหตุ: {item.note}</p>}
                      </div>
                      
                      <div className="item-actions">
                        <div className="quantity-control">
                          <button 
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <p className="item-total">฿{item.total}</p>
                        
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="subtotal">
                  <span>รวม</span>
                  <span>฿{restaurantGroup.subtotal}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {cartData.item_count > 0 && (
        <div className="cart-footer">
          <div className="total-section">
            <div className="total-row">
              <span>รวมทั้งหมด ({cartData.item_count} รายการ)</span>
              <span className="total-amount">฿{cartData.total}</span>
            </div>
          </div>
          
          <button 
            className="order-btn"
            onClick={handlePlaceOrder}
            disabled={ordering}
          >
            {ordering ? 'กำลังสั่งหิ้ว...' : 'สั่งหิ้วเลย'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
