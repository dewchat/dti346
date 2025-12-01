import React from 'react';
import Input from '../components/ui/input';
import Button from '../components/ui/button';
import { User, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSignIn = () => {
    if (username.trim() !== "" && password.trim() !== "") {
      navigate("/home");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="logo-login">Logo</h1>

        <div className="form-group">
          <Input
            type="text"
            placeholder="Username"
            icon={User}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            icon={LockKeyhole}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleSignIn}>
            Sign in
          </Button>
        </div>

        <p className="signup-text">
          Don't have an account ? <span className="signup-link">Sign up Now</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
