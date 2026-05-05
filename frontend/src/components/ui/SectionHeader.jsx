import React from 'react';
import './SectionHeader.css';

export default function SectionHeader({
  title,
  subtitle,
  subtitleClassName = '',
  action = null,
  align = 'center',
}) {
  return (
    <header className={`section-header section-header--${align}`}>
      <div className="section-header-text">
        <h2 className="section-header-title">{title}</h2>
        {subtitle ? (
          <p className={`section-header-subtitle ${subtitleClassName}`.trim()}>{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="section-header-action">{action}</div> : null}
    </header>
  );
}
