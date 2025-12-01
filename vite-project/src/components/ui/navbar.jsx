import React, { useState } from 'react';
import { Home, FileText, MessageCircle, User } from 'lucide-react';
import '../../styles/Navbar.css';

const Navbar = () => {
  const [activeNav, setActiveNav] = useState('home');

  const navItems = [
    { id: 'home', icon: Home, label: 'หน้าหลัก' },
    { id: 'documents', icon: FileText, label: 'ประวัติการสั่งซื้อ' },
    { id: 'messages', icon: MessageCircle, label: 'ข้อความ' },
    { id: 'profile', icon: User, label: 'โปรไฟล์' }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </nav>

      {/* Always Open Sidebar */}
      <div className="sidebar open">
        <div className="sidebar-header">
          <div className="logo">Logo</div>
        </div>

        <div className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
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
