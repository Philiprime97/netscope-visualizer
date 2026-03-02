import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TopologyProvider } from '@/contexts/TopologyContext';
import Dashboard from '@/pages/Dashboard';
import Login from './Login';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Login />;

  return (
    <TopologyProvider>
      <Dashboard />
    </TopologyProvider>
  );
};

export default DashboardPage;
