import React from 'react';
import './Badge.css';

export default function Badge({ children, tone = 'default', className = '' }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`.trim()}>{children}</span>;
}
