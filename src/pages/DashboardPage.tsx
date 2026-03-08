import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/pages/Dashboard';
import Login from './Login';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Login />;

  return <Dashboard />;
};

export default DashboardPage;
