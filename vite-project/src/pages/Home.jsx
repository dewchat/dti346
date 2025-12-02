import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Search, Store } from 'lucide-react';
import { restaurantAPI } from '../services/api';
import Navbar from '../components/ui/navbar';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.location && restaurant.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
        <Navbar activeTab="home" />
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">🍱 หิ้วหิว</h1>
          <p className="welcome-text">สวัสดี, {user?.display_name || 'User'}</p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาร้านอาหาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <main className="main-content">
        {/* Restaurants Section */}
        <section className="restaurants-section">
          <div className="section-header">
            <Store size={24} />
            <h2>ร้านที่เปิดรับหิ้ว</h2>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className="empty-state">
              <p>ไม่พบร้านอาหารที่เปิดรับหิ้ว</p>
            </div>
          ) : (
            <div className="restaurants-grid">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="restaurant-card"
                  onClick={() => handleRestaurantClick(restaurant.id)}
                >
                  <div className="restaurant-image">
                    {restaurant.image_url ? (
                      <img src={restaurant.image_url} alt={restaurant.name} />
                    ) : (
                      <div className="placeholder-image">
                        <Store size={40} />
                      </div>
                    )}
                  </div>
                  <div className="restaurant-info">
                    <h3 className="restaurant-name">{restaurant.name}</h3>
                    <p className="restaurant-owner">โดย {restaurant.owner_name}</p>
                    
                    <div className="restaurant-details">
                      <div className="detail-item">
                        <Clock size={14} />
                        <span>รับหิ้ว {restaurant.open_time} - {restaurant.close_time}</span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>{restaurant.pickup_location}</span>
                      </div>
                    </div>

                    <div className="restaurant-footer">
                      <span className="menu-count">{restaurant.menu_count} เมนู</span>
                      <span className="pickup-time">นัดรับ: {restaurant.pickup_time}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="chevron-icon" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Navbar activeTab="home" />
    </div>
  );
}

export default Home;
