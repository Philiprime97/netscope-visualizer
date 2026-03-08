const AGENT_URL = 'http://localhost:5111';

export interface PingResult {
  ip: string;
  reachable: boolean;
  latency?: number;
  output?: string;
  error?: string;
}

export interface DiscoveredHost {
  ip: string;
  hostname: string;
  deviceType: string;
  description: string;
  ports: { port: number; service: string }[];
  macAddress?: string | null;
}

export interface ScanResult {
  alive: string[];
  hosts?: DiscoveredHost[];
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

export const scanSubnet = async (subnet: string): Promise<ScanResult> => {
  try {
    const res = await fetch(`${AGENT_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subnet }),
    });
    if (!res.ok) throw new Error('Agent unreachable');
    return await res.json();
  } catch {
    return { alive: [] };
  }
};

export const checkAgentHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${AGENT_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
};
