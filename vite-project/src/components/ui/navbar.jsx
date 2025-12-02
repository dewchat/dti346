import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, ShoppingCart, User } from 'lucide-react';
import '../../styles/Navbar.css';

const Navbar = ({ activeTab = 'home' }) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', icon: Home, label: 'หน้าหลัก', path: '/home' },
    { id: 'history', icon: FileText, label: 'ประวัติ', path: '/history' },
    { id: 'cart', icon: ShoppingCart, label: 'ตะกร้า', path: '/cart' },
    { id: 'profile', icon: User, label: 'โปรไฟล์', path: '/profile' }
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <div className="sidebar open">
        <div className="sidebar-header">
          <div className="logo">🍱 หิ้วหิว</div>
        </div>

        <div className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
