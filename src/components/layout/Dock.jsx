import React from 'react';
import { FloatingDockDemo } from '../ui/floating-dock-demo';

export function Dock({ activeTab = 'Study', onTabChange }) {
  return <FloatingDockDemo activeTab={activeTab} onTabChange={onTabChange} />;
}

export default Dock;
