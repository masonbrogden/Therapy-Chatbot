import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CrisisFloatingBtn from './CrisisFloatingBtn';

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <CrisisFloatingBtn />
    </>
  );
}
