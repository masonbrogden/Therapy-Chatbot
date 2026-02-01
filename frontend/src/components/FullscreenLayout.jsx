import React from 'react';
import { Outlet } from 'react-router-dom';
import './FullscreenLayout.css';

export default function FullscreenLayout() {
  return (
    <div className="fullscreen-layout">
      <Outlet />
    </div>
  );
}
