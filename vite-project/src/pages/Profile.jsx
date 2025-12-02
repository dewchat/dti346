import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Store, ChevronRight, ShoppingCart, History } from 'lucide-react';
import { authAPI, userAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('ต้องการออกจากระบบหรือไม่?')) {
      try {
        await authAPI.logout();
        localStorage.removeItem('user');
        navigate('/');
      } catch (error) {
        console.error('Error logging out:', error);
        // Still navigate to login even if API fails
        localStorage.removeItem('user');
        navigate('/');
      }
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
        <Navbar activeTab="profile" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>โปรไฟล์</h1>
      </header>

      <main className="profile-content">
        <div className="profile-card">
          <div className="avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <h2>{profile?.display_name}</h2>
            <p className="username">@{profile?.username}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="profile-section">
          <h3 className="section-title">เมนูด่วน</h3>
          
          <div className="quick-actions">
            <button 
              className="action-card"
              onClick={() => navigate('/history')}
            >
              <div className="action-icon history">
                <History size={24} />
              </div>
              <span>ประวัติ</span>
            </button>
            
            <button 
              className="action-card"
              onClick={() => navigate('/cart')}
            >
              <div className="action-icon cart">
                <ShoppingCart size={24} />
              </div>
              <span>ตะกร้า</span>
            </button>
          </div>
        </section>

        <section className="profile-section">
          <h3 className="section-title">ร้านที่ฉันเปิดรับหิ้ว</h3>
          
          {profile?.restaurants?.length === 0 ? (
            <div className="empty-restaurants">
              <Store size={32} />
              <p>ยังไม่มีร้านที่เปิดรับหิ้ว</p>
              <button 
                className="create-restaurant-btn"
                onClick={() => navigate('/create-restaurant')}
              >
                เปิดรับหิ้ว
              </button>
            </div>
          ) : (
            <div className="restaurants-list">
              {profile?.restaurants?.map((restaurant) => (
                <div 
                  key={restaurant.id} 
                  className="restaurant-item"
                  onClick={() => navigate(`/my-restaurant/${restaurant.id}`)}
                >
                  <Store size={20} />
                  <span>{restaurant.name}</span>
                  <ChevronRight size={20} />
                </div>
              ))}
              <button 
                className="add-restaurant-btn"
                onClick={() => navigate('/create-restaurant')}
              >
                + เปิดรับหิ้วใหม่
              </button>
            </div>
          )}
        </section>

        <section className="profile-section">
          <h3 className="section-title">บัญชี</h3>
          
          <div className="menu-list">
            <button className="menu-item logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </section>
      </main>

      <Navbar activeTab="profile" />
    </div>
  );
}

export default Profile;
