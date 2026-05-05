import React from 'react';
import './Container.css';

export default function Container({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`ui-container ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
