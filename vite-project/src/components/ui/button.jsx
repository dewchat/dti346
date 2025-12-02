import React from 'react';
import '../../styles/Button.css';

const Button = ({ children, onClick, disabled }) => {
  return (
    <button className="btn-primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;