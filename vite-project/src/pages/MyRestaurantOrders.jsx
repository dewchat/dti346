import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Package, 
  CheckCircle, 
  XCircle,
  User,
  ChevronRight,
  Plus,
  Trash2,
  UtensilsCrossed,
  ClipboardList
} from 'lucide-react';
import { orderAPI, restaurantAPI, menuAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/MyRestaurantOrders.css';

function MyRestaurantOrders() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Add menu form state
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    description: '',
    image_url: ''
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    fetchData();
  }, [restaurantId, navigate]);

  const fetchData = async () => {
    try {
      const [restaurantData, ordersData, menuData] = await Promise.all([
        restaurantAPI.getById(restaurantId),
        orderAPI.getRestaurantOrders(restaurantId),
        menuAPI.getByRestaurant(restaurantId)
      ]);
      setRestaurant(restaurantData);
      setOrders(ordersData);
      setMenuItems(menuData.menu || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      const ordersData = await orderAPI.getRestaurantOrders(restaurantId);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!newMenuItem.name || !newMenuItem.price) {
      alert('กรุณากรอกชื่อเมนูและราคา');
      return;
    }

    setAdding(true);
    try {
      await menuAPI.addItem(restaurantId, {
        name: newMenuItem.name,
        price: parseFloat(newMenuItem.price),
        description: newMenuItem.description,
        image_url: newMenuItem.image_url
      });
      
      // Refresh menu
      const menuData = await menuAPI.getByRestaurant(restaurantId);
      setMenuItems(menuData.menu || []);
      
      // Reset form
      setNewMenuItem({ name: '', price: '', description: '', image_url: '' });
      setShowAddMenu(false);
    } catch (error) {
      console.error('Error adding menu item:', error);
      alert('เพิ่มเมนูไม่สำเร็จ');
    } finally {
      setAdding(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    return order.status === activeFilter;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="my-orders-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <header className="my-orders-header">
        <button className="back-button" onClick={() => navigate('/profile')}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-info">
          <h1>{restaurant?.name}</h1>
          <p className="subtitle">จัดการร้าน</p>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`main-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={18} />
          <span>ออเดอร์</span>
          {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
        </button>
        <button 
          className={`main-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <UtensilsCrossed size={18} />
          <span>เมนูอาหาร</span>
          <span className="tab-count">({menuItems.length})</span>
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <>
          {/* Status Filter */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              ทั้งหมด ({orders.length})
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              รอยืนยัน {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('confirmed')}
            >
              กำลังดำเนินการ
            </button>
            <button 
              className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              เสร็จสิ้น
            </button>
          </div>

          <main className="my-orders-content">
            {filteredOrders.length === 0 ? (
              <div className="empty-orders">
                <Package size={64} />
                <h2>ยังไม่มีออเดอร์</h2>
                <p>เมื่อมีคนสั่งหิ้ว จะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="customer-info">
                        <div className="customer-avatar">
                          <User size={20} />
                        </div>
                        <div>
                          <h3>{order.customer_name}</h3>
                          <p className="order-time">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <span className={`order-status ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="order-items">
                      <h4>รายการสั่ง:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="item-row">
                          <span className="item-name">{item.name} x{item.quantity}</span>
                          <span className="item-price">฿{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {order.items.some(item => item.note) && (
                        <div className="item-notes">
                          {order.items.filter(item => item.note).map((item, index) => (
                            <p key={index} className="note">📝 {item.name}: {item.note}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <span>รวม</span>
                        <span className="total-amount">฿{order.total_price}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <button 
                        className="action-btn chat-btn"
                        onClick={() => navigate(`/chat/${order.id}`)}
                      >
                        <MessageCircle size={18} />
                        <span>แชทกับลูกค้า</span>
                      </button>

                      {order.status === 'pending' && (
                        <div className="status-actions">
                          <button 
                            className="action-btn confirm-btn"
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          >
                            <CheckCircle size={18} />
                            <span>ยืนยัน</span>
                          </button>
                          <button 
                            className="action-btn cancel-btn"
                            onClick={() => {
                              if (window.confirm('ยืนยันการยกเลิกออเดอร์นี้?')) {
                                handleUpdateStatus(order.id, 'cancelled');
                              }
                            }}
                          >
                            <XCircle size={18} />
                            <span>ยกเลิก</span>
                          </button>
                        </div>
                      )}

                      {order.status === 'confirmed' && (
                        <button 
                          className="action-btn complete-btn"
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                        >
                          <CheckCircle size={18} />
                          <span>ส่งมอบแล้ว</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Menu Tab Content */}
      {activeTab === 'menu' && (
        <main className="my-orders-content">
          {/* Add Menu Button */}
          <button 
            className="add-menu-btn"
            onClick={() => setShowAddMenu(true)}
          >
            <Plus size={20} />
            <span>เพิ่มเมนูอาหาร</span>
          </button>

          {/* Add Menu Modal */}
          {showAddMenu && (
            <div className="modal-overlay" onClick={() => setShowAddMenu(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>เพิ่มเมนูอาหาร</h3>
                <form onSubmit={handleAddMenuItem}>
                  <div className="form-group">
                    <label>ชื่อเมนู *</label>
                    <input
                      type="text"
                      value={newMenuItem.name}
                      onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})}
                      placeholder="เช่น ข้าวผัดกระเพรา"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ราคา (บาท) *</label>
                    <input
                      type="number"
                      value={newMenuItem.price}
                      onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})}
                      placeholder="เช่น 50"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>รายละเอียด</label>
                    <textarea
                      value={newMenuItem.description}
                      onChange={e => setNewMenuItem({...newMenuItem, description: e.target.value})}
                      placeholder="รายละเอียดเมนู (ไม่บังคับ)"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL รูปภาพ</label>
                    <input
                      type="url"
                      value={newMenuItem.image_url}
                      onChange={e => setNewMenuItem({...newMenuItem, image_url: e.target.value})}
                      placeholder="https://... (ไม่บังคับ)"
                    />
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="cancel-modal-btn"
                      onClick={() => setShowAddMenu(false)}
                    >
                      ยกเลิก
                    </button>
                    <button 
                      type="submit" 
                      className="submit-modal-btn"
                      disabled={adding}
                    >
                      {adding ? 'กำลังเพิ่ม...' : 'เพิ่มเมนู'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Menu List */}
          {menuItems.length === 0 ? (
            <div className="empty-orders">
              <UtensilsCrossed size={64} />
              <h2>ยังไม่มีเมนูอาหาร</h2>
              <p>เพิ่มเมนูอาหารเพื่อให้ลูกค้าสั่งได้</p>
            </div>
          ) : (
            <div className="menu-list">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="placeholder">🍽️</div>
                    )}
                  </div>
                  <div className="menu-item-info">
                    <h4>{item.name}</h4>
                    {item.description && <p className="description">{item.description}</p>}
                    <p className="price">฿{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      <Navbar activeTab="profile" />
    </div>
  );
}

export default MyRestaurantOrders;
