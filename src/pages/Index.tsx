import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TopologyProvider, useTopology } from '@/contexts/TopologyContext';
import TopologyCanvas from '@/components/topology/TopologyCanvas';
import DashboardBar from '@/components/dashboard/DashboardBar';
import DevicePanel from '@/components/panels/DevicePanel';
import LinkPanel from '@/components/panels/LinkPanel';
import Login from './Login';

const TopologyView: React.FC = () => {
  const { selectedDeviceId, selectedLinkId, loadTopology } = useTopology();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const stored = sessionStorage.getItem('netscope-load-topology');
    if (stored) {
      sessionStorage.removeItem('netscope-load-topology');
      try {
        loadTopology(JSON.parse(stored));
      } catch {}
    }
  }, [loadTopology]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DashboardBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <TopologyCanvas />
        </div>
        {selectedDeviceId && <DevicePanel />}
        {selectedLinkId && !selectedDeviceId && <LinkPanel />}
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <TopologyProvider>
      <TopologyView />
    </TopologyProvider>
  );
};

export default Index;
