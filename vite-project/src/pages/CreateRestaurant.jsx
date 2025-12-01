import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Clock, MapPin, Calendar } from 'lucide-react';
import { restaurantAPI } from '../services/api';
import '../styles/CreateRestaurant.css';

function CreateRestaurant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    open_time: '',
    close_time: '',
    location: '',
    pickup_time: '',
    pickup_location: '',
    image_url: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.open_time || !formData.close_time || 
        !formData.location || !formData.pickup_time || !formData.pickup_location) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      await restaurantAPI.create(formData);
      alert('เปิดรับหิ้วสำเร็จ!');
      navigate('/profile');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert('เปิดรับหิ้วไม่สำเร็จ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-restaurant-container">
      <header className="create-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>เปิดรับหิ้ว</h1>
      </header>

      <main className="create-content">
        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Store size={18} />
              ชื่อร้านอาหาร
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="เช่น ร้านข้าวแกงป้าแมว"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Clock size={18} />
                เวลาเปิดรับ
              </label>
              <input
                type="time"
                name="open_time"
                value={formData.open_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Clock size={18} />
                เวลาปิดรับ
              </label>
              <input
                type="time"
                name="close_time"
                value={formData.close_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <MapPin size={18} />
              ตำแหน่งร้าน
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="เช่น ตลาดมหาวิทยาลัย"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Calendar size={18} />
              เวลานัดรับอาหาร
            </label>
            <input
              type="text"
              name="pickup_time"
              value={formData.pickup_time}
              onChange={handleChange}
              placeholder="เช่น 12:30 น."
              required
            />
          </div>

          <div className="form-group">
            <label>
              <MapPin size={18} />
              สถานที่นัดรับอาหาร
            </label>
            <input
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="เช่น หน้าตึก IT"
              required
            />
          </div>

          <div className="form-group">
            <label>รูปภาพร้าน (URL)</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'กำลังสร้าง...' : 'เปิดรับหิ้ว'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateRestaurant;
