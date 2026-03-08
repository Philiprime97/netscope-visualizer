const AGENT_URL = 'http://localhost:5111';

export interface PingResult {
  ip: string;
  reachable: boolean;
  latency?: number;
  output?: string;
  error?: string;
}

export interface SnmpInterface {
  name: string;
  speed: string;
  speedBps: number;
  operStatus: 'up' | 'down';
  adminStatus: 'up' | 'down';
}

export interface SnmpSystemInfo {
  sysDescr?: string;
  sysName?: string;
  sysContact?: string;
  sysLocation?: string;
  sysObjectID?: string;
  sysUpTime?: string;
}

export interface DiscoveredHost {
  ip: string;
  hostname: string;
  deviceType: string;
  description: string;
  ports: { port: number; service: string }[];
  vendor?: string | null;
  model?: string | null;
  snmp?: SnmpSystemInfo | null;
  snmpInterfaces?: SnmpInterface[];
  macAddress?: string | null;
}

export interface ScanResult {
  alive: string[];
  hosts?: DiscoveredHost[];
  snmpEnabled?: boolean;
}

export interface SnmpQueryResult {
  ip: string;
  snmpReachable: boolean;
  system?: SnmpSystemInfo;
  interfaces?: SnmpInterface[];
  vendor?: string | null;
  model?: string | null;
  deviceType?: string | null;
  error?: string;
}

export const pingDevice = async (ip: string): Promise<PingResult> => {
  try {
    const res = await fetch(`${AGENT_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    if (!res.ok) throw new Error('Agent unreachable');
    return await res.json();
  } catch {
    return { ip, reachable: false, error: 'Agent not running. Start the Python agent on port 5111.' };
  }
};

export const scanSubnet = async (subnet: string, community?: string): Promise<ScanResult> => {
  try {
    const body: Record<string, string> = { subnet };
    if (community) body.community = community;
    const res = await fetch(`${AGENT_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Agent unreachable');
    return await res.json();
  } catch {
    return { alive: [] };
  }
};

export const snmpQuery = async (ip: string, community: string): Promise<SnmpQueryResult> => {
  try {
    const res = await fetch(`${AGENT_URL}/snmp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, community }),
    });
    if (!res.ok) throw new Error('Agent unreachable');
    return await res.json();
  } catch {
    return { ip, snmpReachable: false, error: 'Agent not running.' };
  }
};

export const checkAgentHealth = async (): Promise<{ ok: boolean; snmp?: boolean }> => {
  try {
    const res = await fetch(`${AGENT_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, snmp: data.snmp };
  } catch {
    return { ok: false };
  }
};
