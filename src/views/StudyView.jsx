import React from 'react';
import StudyDashboard from '../components/dashboard/StudyDashboard';

export function StudyView({ onNavigate }) {
  return <StudyDashboard onNavigate={onNavigate} />;
}

export default StudyView;
