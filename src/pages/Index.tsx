import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTopology } from '@/contexts/TopologyContext';
import TopologyCanvas from '@/components/topology/TopologyCanvas';
import DashboardBar from '@/components/dashboard/DashboardBar';
import DevicePanel from '@/components/panels/DevicePanel';
import LinkPanel from '@/components/panels/LinkPanel';
import NetworkScanner from '@/components/panels/NetworkScanner';
import SnmpDiscoveryPanel from '@/components/panels/SnmpDiscoveryPanel';
import TopologyNotes from '@/components/panels/TopologyNotes';
import Login from './Login';

const TopologyView: React.FC = () => {
  const { selectedDeviceId, selectedLinkId, loadTopology } = useTopology();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [showSnmp, setShowSnmp] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

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
        onToggleScanner={() => { setShowScanner(s => !s); setShowSnmp(false); }}
        onToggleSnmp={() => { setShowSnmp(s => !s); setShowScanner(false); }}
        onToggleNotes={() => setShowNotes(s => !s)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1">
          <TopologyCanvas />
        </div>
        {selectedDeviceId && <DevicePanel />}
        {selectedLinkId && !selectedDeviceId && <LinkPanel />}
        {showScanner && !selectedDeviceId && !selectedLinkId && <NetworkScanner onClose={() => setShowScanner(false)} />}
        {showSnmp && !selectedDeviceId && !selectedLinkId && !showScanner && <SnmpDiscoveryPanel onClose={() => setShowSnmp(false)} />}
        {showNotes && <TopologyNotes onClose={() => setShowNotes(false)} />}
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Login />;

  return <TopologyView />;
};

export default Index;
