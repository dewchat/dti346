import React, { useState } from 'react';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import { User, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (username.trim() === "" || password.trim() === "") {
      setError('กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate("/home");
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="logo-login">🍱 หิ้วให้</h1>

        <div className="form-group">
          {error && <p className="error-message">{error}</p>}
          
          <Input
            type="text"
            placeholder="Username"
            icon={User}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <Input
            type="password"
            placeholder="Password"
            icon={LockKeyhole}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <Button onClick={handleSignIn} disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </div>

        <p className="signup-text">
          ทดลองใช้งาน: user1 / password1
        </p>
      </div>
    </div>
  );
};

export default Login;
