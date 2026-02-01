import React from 'react';
import './SectionIntro.css';

export default function SectionIntro({
  badgeText,
  heading,
  subheading,
  supportingText,
  className = '',
}) {
  return (
    <div className={`section-intro ${className}`.trim()}>
      {badgeText ? <span className="section-intro-pill">{badgeText}</span> : null}
      <h1>{heading}</h1>
      <p className="section-intro-subheading">{subheading}</p>
      <p className="section-intro-supporting">{supportingText}</p>
    </div>
  );
}
