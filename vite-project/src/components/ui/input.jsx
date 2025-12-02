import React from 'react';
import '../../styles/Input.css';

const Input = ({ type, placeholder, icon: Icon, value, onChange, onKeyPress }) => {
  return (
    <div className="input-wrapper">
      <div className="input-icon">
        <Icon />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="input-field"
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
      />
    </div>
  );
};

export default Input;
