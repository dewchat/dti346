import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, Package, MessageCircle } from 'lucide-react';
import { orderAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/History.css';

function History() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getHistory();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'รอยืนยัน';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
        <Navbar activeTab="history" />
      </div>
    );
  }

  return (
    <div className="history-container">
      <header className="history-header">
        <h1>ประวัติการสั่งหิ้ว</h1>
      </header>

      <main className="history-content">
        {orders.length === 0 ? (
          <div className="empty-history">
            <Package size={64} />
            <h2>ยังไม่มีประวัติการสั่งหิ้ว</h2>
            <p>เริ่มสั่งหิ้วอาหารเลย!</p>
            <button className="browse-btn" onClick={() => navigate('/home')}>
              ดูร้านที่เปิดรับหิ้ว
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="order-card"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <div className="order-header">
                  <div className="order-restaurant">
                    <h3>{order.restaurant_name}</h3>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="order-date">{formatDate(order.created_at)}</p>
                </div>

                <div className="order-items">
                  {order.items.slice(0, 3).map((item, index) => (
                    <p key={index} className="order-item">
                      {item.name} x{item.quantity}
                    </p>
                  ))}
                  {order.items.length > 3 && (
                    <p className="more-items">+{order.items.length - 3} รายการ</p>
                  )}
                </div>

                <div className="order-footer">
                  <div className="pickup-info">
                    <div className="info-item">
                      <Clock size={14} />
                      <span>{order.pickup_time}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={14} />
                      <span>{order.pickup_location}</span>
                    </div>
                  </div>
                  
                  <div className="order-total">
                    <span>รวม</span>
                    <span className="total-amount">฿{order.total_price}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    className="chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${order.id}`);
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>แชท</span>
                  </button>
                  <ChevronRight size={20} className="chevron-icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navbar activeTab="history" />
    </div>
  );
}

export default History;
