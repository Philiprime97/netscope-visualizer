import React from 'react';
import { DeviceType } from '@/types/network';
import { Button } from '@/components/ui/button';

// ── SVG Icon Factories ──────────────────────────────────────────────

const svg = (d: string, stroke = false) => {
  const C: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) =>
    stroke ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>{React.createElement('path', { d })}</svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>{React.createElement('path', { d })}</svg>
    );
  return C;
};

const multiSvg = (children: React.ReactNode, stroke = true) => {
  const C: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill={stroke ? 'none' : 'currentColor'} stroke={stroke ? 'currentColor' : 'none'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      {children}
    </svg>
  );
  return C;
};

// ── ROUTER icons (10 variations) ────────────────────────────────────
const routerIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'router-classic', icon: multiSvg(<><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><path d="m8 8 4 4 4-4M16 16l-4-4-4 4"/></>) },
  { name: 'router-box', icon: multiSvg(<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="15" y1="10" x2="20" y2="10"/><line x1="15" y1="14" x2="20" y2="14"/></>) },
  { name: 'router-antenna', icon: multiSvg(<><rect x="3" y="10" width="18" height="8" rx="2"/><line x1="7" y1="10" x2="5" y2="4"/><line x1="17" y1="10" x2="19" y2="4"/><circle cx="5" cy="3" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="3" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="14" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'router-globe', icon: multiSvg(<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>) },
  { name: 'router-wifi', icon: multiSvg(<><rect x="3" y="12" width="18" height="7" rx="2"/><path d="M8 12V9a4 4 0 0 1 8 0v3"/><circle cx="7" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'router-rack', icon: multiSvg(<><rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="1" fill="currentColor" stroke="none"/><line x1="11" y1="7" x2="17" y2="7"/><line x1="11" y1="17" x2="17" y2="17"/><line x1="12" y1="10" x2="12" y2="14"/></>) },
  { name: 'router-arrows', icon: multiSvg(<><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8V5l-3 3"/><path d="M17 8V5l3 3"/><circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'router-hub', icon: multiSvg(<><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/><circle cx="12" cy="2" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="22" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="22" cy="12" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'router-signal', icon: multiSvg(<><rect x="4" y="11" width="16" height="8" rx="2"/><path d="M8 11V8"/><path d="M12 11V6"/><path d="M16 11V8"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'router-mesh', icon: multiSvg(<><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><line x1="12" y1="7" x2="5" y2="16"/><line x1="12" y1="7" x2="19" y2="16"/><line x1="7" y1="18" x2="17" y2="18"/></>) },
];

// ── SWITCH icons (10 variations) ────────────────────────────────────
const switchIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'switch-layers', icon: multiSvg(<><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 12 10 6 10-6"/><path d="m2 16 10 6 10-6"/></>) },
  { name: 'switch-box', icon: multiSvg(<><rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'switch-ports', icon: multiSvg(<><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></>) },
  { name: 'switch-rack', icon: multiSvg(<><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/><line x1="7" y1="6.5" x2="17" y2="6.5"/><line x1="7" y1="17.5" x2="17" y2="17.5"/></>) },
  { name: 'switch-hub', icon: multiSvg(<><rect x="6" y="8" width="12" height="8" rx="2"/><line x1="3" y1="10" x2="6" y2="10"/><line x1="3" y1="14" x2="6" y2="14"/><line x1="18" y1="10" x2="21" y2="10"/><line x1="18" y1="14" x2="21" y2="14"/></>) },
  { name: 'switch-network', icon: multiSvg(<><rect x="2" y="8" width="20" height="8" rx="2"/><line x1="6" y1="8" x2="6" y2="4"/><line x1="12" y1="8" x2="12" y2="4"/><line x1="18" y1="8" x2="18" y2="4"/><line x1="6" y1="16" x2="6" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="18" y1="16" x2="18" y2="20"/></>) },
  { name: 'switch-managed', icon: multiSvg(<><rect x="2" y="6" width="20" height="12" rx="2"/><rect x="5" y="9" width="4" height="3" rx="0.5"/><circle cx="14" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="10.5" r="1" fill="currentColor" stroke="none"/><line x1="5" y1="15" x2="19" y2="15"/></>) },
  { name: 'switch-stacked', icon: multiSvg(<><rect x="3" y="2" width="18" height="5" rx="1"/><rect x="3" y="9" width="18" height="5" rx="1"/><rect x="3" y="16" width="18" height="5" rx="1"/><circle cx="6" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="6" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="6" cy="18.5" r="0.8" fill="currentColor" stroke="none"/></>) },
  { name: 'switch-modular', icon: multiSvg(<><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="2" y1="16" x2="22" y2="16"/><circle cx="6" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="13" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'switch-crossbar', icon: multiSvg(<><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="16" x2="20" y2="16"/><line x1="8" y1="4" x2="8" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="16" y1="4" x2="16" y2="20"/></>) },
];

// ── FIREWALL icons (10 variations) ──────────────────────────────────
const firewallIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'fw-shield', icon: multiSvg(<><path d="M12 2s-7 3-7 9v4l7 5 7-5v-4c0-6-7-9-7-9z"/></>) },
  { name: 'fw-shield-check', icon: multiSvg(<><path d="M12 2s-7 3-7 9v4l7 5 7-5v-4c0-6-7-9-7-9z"/><path d="m9 12 2 2 4-4"/></>) },
  { name: 'fw-shield-x', icon: multiSvg(<><path d="M12 2s-7 3-7 9v4l7 5 7-5v-4c0-6-7-9-7-9z"/><line x1="10" y1="10" x2="14" y2="14"/><line x1="14" y1="10" x2="10" y2="14"/></>) },
  { name: 'fw-wall', icon: multiSvg(<><rect x="2" y="4" width="20" height="16" rx="1"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="16" x2="22" y2="16"/><line x1="7" y1="4" x2="7" y2="8"/><line x1="15" y1="4" x2="15" y2="8"/><line x1="11" y1="8" x2="11" y2="12"/><line x1="7" y1="12" x2="7" y2="16"/><line x1="15" y1="12" x2="15" y2="16"/><line x1="11" y1="16" x2="11" y2="20"/></>) },
  { name: 'fw-lock', icon: multiSvg(<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none"/></>) },
  { name: 'fw-gate', icon: multiSvg(<><rect x="3" y="8" width="18" height="10" rx="2"/><line x1="8" y1="8" x2="8" y2="18"/><line x1="16" y1="8" x2="16" y2="18"/><line x1="3" y1="13" x2="8" y2="13"/><line x1="16" y1="13" x2="21" y2="13"/><path d="M10 11v4h4v-4"/></>) },
  { name: 'fw-shield-bolt', icon: multiSvg(<><path d="M12 2s-7 3-7 9v4l7 5 7-5v-4c0-6-7-9-7-9z"/><path d="M13 9l-2 4h3l-2 4"/></>) },
  { name: 'fw-barrier', icon: multiSvg(<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/><circle cx="6" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="16" r="1.5" fill="currentColor" stroke="none"/></>) },
  { name: 'fw-shield-key', icon: multiSvg(<><path d="M12 2s-7 3-7 9v4l7 5 7-5v-4c0-6-7-9-7-9z"/><circle cx="12" cy="11" r="2"/><line x1="12" y1="13" x2="12" y2="16"/></>) },
  { name: 'fw-hex', icon: multiSvg(<><path d="M12 2l8 4.5v7L12 18l-8-4.5v-7z"/><path d="M12 7v5l4 2"/></>) },
];

// ── SERVER icons (10 variations) ────────────────────────────────────
const serverIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'srv-tower', icon: multiSvg(<><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="10" y1="6" x2="14" y2="6"/><line x1="10" y1="10" x2="14" y2="10"/><circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none"/></>) },
  { name: 'srv-rack', icon: multiSvg(<><rect x="4" y="2" width="16" height="6" rx="1"/><rect x="4" y="10" width="16" height="6" rx="1"/><circle cx="7" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1" fill="currentColor" stroke="none"/><line x1="11" y1="5" x2="17" y2="5"/><line x1="11" y1="13" x2="17" y2="13"/><line x1="8" y1="18" x2="8" y2="22"/><line x1="16" y1="18" x2="16" y2="22"/></>) },
  { name: 'srv-blade', icon: multiSvg(<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="3" y1="15" x2="21" y2="15"/><circle cx="6" cy="5" r="0.8" fill="currentColor" stroke="none"/><circle cx="6" cy="9" r="0.8" fill="currentColor" stroke="none"/><circle cx="6" cy="13" r="0.8" fill="currentColor" stroke="none"/><circle cx="6" cy="17" r="0.8" fill="currentColor" stroke="none"/></>) },
  { name: 'srv-database', icon: multiSvg(<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>) },
  { name: 'srv-cloud', icon: multiSvg(<><path d="M18 10a4 4 0 0 0-7.5-2A3.5 3.5 0 0 0 7 11.5 3 3 0 0 0 8 17h10a3 3 0 0 0 0-6z"/></>) },
  { name: 'srv-cpu', icon: multiSvg(<><rect x="6" y="6" width="12" height="12" rx="2"/><line x1="6" y1="10" x2="2" y2="10"/><line x1="6" y1="14" x2="2" y2="14"/><line x1="18" y1="10" x2="22" y2="10"/><line x1="18" y1="14" x2="22" y2="14"/><line x1="10" y1="6" x2="10" y2="2"/><line x1="14" y1="6" x2="14" y2="2"/><line x1="10" y1="18" x2="10" y2="22"/><line x1="14" y1="18" x2="14" y2="22"/></>) },
  { name: 'srv-hdd', icon: multiSvg(<><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="16" cy="12" r="2"/><line x1="6" y1="10" x2="10" y2="10"/><line x1="6" y1="14" x2="10" y2="14"/></>) },
  { name: 'srv-mainframe', icon: multiSvg(<><rect x="5" y="2" width="14" height="20" rx="2"/><rect x="8" y="5" width="8" height="4" rx="1"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r="1" fill="currentColor" stroke="none"/><line x1="8" y1="18" x2="16" y2="18"/></>) },
  { name: 'srv-cluster', icon: multiSvg(<><rect x="2" y="4" width="8" height="7" rx="1"/><rect x="14" y="4" width="8" height="7" rx="1"/><rect x="8" y="13" width="8" height="7" rx="1"/><circle cx="5" cy="7.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="17" cy="7.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="11" cy="16.5" r="0.8" fill="currentColor" stroke="none"/></>) },
  { name: 'srv-nas', icon: multiSvg(<><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><line x1="6" y1="16" x2="18" y2="16"/></>) },
];

// ── PC icons (10 variations) ────────────────────────────────────────
const pcIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'pc-monitor', icon: multiSvg(<><rect x="3" y="3" width="18" height="12" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="15" x2="12" y2="21"/></>) },
  { name: 'pc-laptop', icon: multiSvg(<><rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 18h20"/><line x1="8" y1="18" x2="8" y2="20"/><line x1="16" y1="18" x2="16" y2="20"/></>) },
  { name: 'pc-desktop', icon: multiSvg(<><rect x="6" y="2" width="12" height="16" rx="2"/><line x1="10" y1="6" x2="14" y2="6"/><circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="18" x2="12" y2="20"/></>) },
  { name: 'pc-phone', icon: multiSvg(<><rect x="7" y="2" width="10" height="20" rx="3"/><line x1="10" y1="18" x2="14" y2="18"/></>) },
  { name: 'pc-tablet', icon: multiSvg(<><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></>) },
  { name: 'pc-all-in-one', icon: multiSvg(<><rect x="3" y="2" width="18" height="14" rx="2"/><line x1="9" y1="20" x2="15" y2="20"/><path d="M10 16l-1 4"/><path d="M14 16l1 4"/></>) },
  { name: 'pc-workstation', icon: multiSvg(<><rect x="5" y="2" width="14" height="17" rx="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="9" x2="15" y2="9"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/></>) },
  { name: 'pc-imac', icon: multiSvg(<><rect x="2" y="3" width="20" height="13" rx="2"/><line x1="2" y1="13" x2="22" y2="13"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></>) },
  { name: 'pc-terminal', icon: multiSvg(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8l4 4-4 4"/><line x1="13" y1="16" x2="17" y2="16"/></>) },
  { name: 'pc-thin-client', icon: multiSvg(<><rect x="8" y="2" width="8" height="18" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/><line x1="10" y1="5" x2="14" y2="5"/><line x1="6" y1="22" x2="18" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/></>) },
];

// ── DOCKER icons (10 variations) ────────────────────────────────────
const DockerWhale: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 640 512" fill="currentColor" className={className} style={style}>
    <path d="M349.9 236.3h-66.1v-59.4h66.1v59.4zm0-204.3h-66.1v60.7h66.1V32zm78.2 144.8H362v59.4h66.1v-59.4zm-156.3-72.1h-66.1v60.1h66.1v-60.1zm78.1 0h-66.1v60.1h66.1v-60.1zm276.8 100c-14.4-9.7-47.6-13.2-73.1-8.4-3.3-24-16.7-44.9-41.1-63.7l-14-9.3-9.3 14c-18.4 27.8-23.4 73.6-3.7 103.8-8.7 4.7-25.8 11.1-48.4 10.7H2.4c-8.7 50.4 5.8 116.8 44 162.1 37.1 43.9 92.7 66.2 165.4 66.2 157.4 0 273.9-72.5 328.4-204.2 21.4.4 67.6.1 91.3-45.2 1.5-2.5 6.6-13.2 8.5-17.1l-13.3-8.9zm-511.1-27.9h-66v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm78.1 0h-66.1v59.4h66.1v-59.4zm-78.1-72.1h-66.1v60.1h66.1v-60.1z"/>
  </svg>
);

const dockerIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'docker-whale', icon: DockerWhale },
  { name: 'docker-container', icon: multiSvg(<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="0.8" fill="currentColor" stroke="none"/><rect x="6" y="13" width="5" height="4" rx="0.5"/><rect x="13" y="13" width="5" height="4" rx="0.5"/></>) },
  { name: 'docker-box', icon: multiSvg(<><path d="M12 2L2 7v10l10 5 10-5V7z"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="2" y1="7" x2="12" y2="12"/><line x1="22" y1="7" x2="12" y2="12"/></>) },
  { name: 'docker-crate', icon: multiSvg(<><rect x="3" y="5" width="18" height="14" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></>) },
  { name: 'docker-ship', icon: multiSvg(<><path d="M2 18c1.5 2 4 3 6 3s4-1 6-3c2 2 4 3 6 3"/><rect x="6" y="8" width="12" height="7" rx="1"/><rect x="8" y="4" width="3" height="4" rx="0.5"/><rect x="13" y="4" width="3" height="4" rx="0.5"/></>) },
  { name: 'docker-package', icon: multiSvg(<><path d="M12 2l9 5v10l-9 5-9-5V7z"/><line x1="12" y1="12" x2="21" y2="7"/><line x1="12" y1="12" x2="3" y2="7"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="7.5" y1="4.5" x2="16.5" y2="9.5"/></>) },
  { name: 'docker-stack', icon: multiSvg(<><rect x="4" y="2" width="16" height="5" rx="1"/><rect x="4" y="9" width="16" height="5" rx="1"/><rect x="4" y="16" width="16" height="5" rx="1"/><circle cx="7" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="7" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="7" cy="18.5" r="0.8" fill="currentColor" stroke="none"/></>) },
  { name: 'docker-cube', icon: multiSvg(<><path d="M12 2l8 4v8l-8 4-8-4V6z"/><path d="M12 10l8-4"/><path d="M12 10L4 6"/><path d="M12 10v8"/></>) },
  { name: 'docker-compose', icon: multiSvg(<><rect x="2" y="3" width="8" height="8" rx="1.5"/><rect x="14" y="3" width="8" height="8" rx="1.5"/><rect x="8" y="13" width="8" height="8" rx="1.5"/><line x1="6" y1="11" x2="10" y2="13"/><line x1="18" y1="11" x2="14" y2="13"/></>) },
  { name: 'docker-micro', icon: multiSvg(<><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><line x1="9" y1="9" x2="10" y2="15"/><line x1="15" y1="9" x2="14" y2="15"/><line x1="10" y1="7" x2="14" y2="7"/></>) },
];

// ── KUBERNETES icons (10 variations) ────────────────────────────────
const kubeIcons: { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'k8s-wheel', icon: multiSvg(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="9.9" y2="9.9"/><line x1="14.1" y1="14.1" x2="18.4" y2="18.4"/></>) },
  { name: 'k8s-hexagon', icon: multiSvg(<><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><circle cx="12" cy="12" r="3"/></>) },
  { name: 'k8s-pod', icon: multiSvg(<><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><circle cx="12" cy="15" r="2"/></>) },
  { name: 'k8s-node', icon: multiSvg(<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></>) },
  { name: 'k8s-deploy', icon: multiSvg(<><circle cx="12" cy="6" r="4"/><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><line x1="10" y1="9" x2="7" y2="14"/><line x1="14" y1="9" x2="17" y2="14"/></>) },
  { name: 'k8s-service', icon: multiSvg(<><path d="M12 2l9 5v10l-9 5-9-5V7z"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="9.5" x2="17" y2="14.5"/><line x1="17" y1="9.5" x2="7" y2="14.5"/></>) },
  { name: 'k8s-ingress', icon: multiSvg(<><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 8v4l3 2"/><path d="M12 12l-3 2"/></>) },
  { name: 'k8s-cluster', icon: multiSvg(<><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 8l4 2v4l-4 2-4-2v-4z"/></>) },
  { name: 'k8s-namespace', icon: multiSvg(<><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/><path d="M12 7l5 3v4l-5 3-5-3v-4z"/></>) },
  { name: 'k8s-helm', icon: multiSvg(<><circle cx="12" cy="12" r="9"/><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3.5 8l3.5 2"/><path d="M17 14l3.5 2"/><path d="M3.5 16l3.5-2"/><path d="M17 10l3.5-2"/></>) },
];

// ── Exported maps ───────────────────────────────────────────────────

export const deviceIconOptions: Record<DeviceType, { name: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[]> = {
  router: routerIcons,
  switch: switchIcons,
  firewall: firewallIcons,
  server: serverIcons,
  pc: pcIcons,
  docker: dockerIcons,
  kubernetes: kubeIcons,
};

// Build a flat lookup from icon name → component
const allIcons = [...routerIcons, ...switchIcons, ...firewallIcons, ...serverIcons, ...pcIcons, ...dockerIcons, ...kubeIcons];
export const iconNameMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {};
for (const i of allIcons) iconNameMap[i.name] = i.icon;

// ── Color options ───────────────────────────────────────────────────

export const colorOptions = [
  { name: 'Default', value: '' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#64748b' },
  { name: 'White', value: '#f1f5f9' },
];

// ── Component ───────────────────────────────────────────────────────

interface DeviceAppearanceProps {
  deviceType: DeviceType;
  currentIcon?: string;
  currentColor?: string;
  onIconChange: (iconName: string) => void;
  onColorChange: (color: string) => void;
}

const DeviceAppearance: React.FC<DeviceAppearanceProps> = ({
  deviceType, currentIcon, currentColor, onIconChange, onColorChange,
}) => {
  const icons = deviceIconOptions[deviceType] || [];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Icon Style</h4>
        <div className="grid grid-cols-5 gap-1.5">
          {icons.map(({ name, icon: Icon }) => (
            <Button
              key={name}
              variant={currentIcon === name ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => onIconChange(name)}
              title={name}
            >
              <Icon className="w-5 h-5" style={currentColor && currentIcon !== name ? { color: currentColor } : undefined} />
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Color</h4>
        <div className="flex gap-1.5 flex-wrap">
          {colorOptions.map(({ name, value }) => (
            <button
              key={name}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${currentColor === value ? 'border-primary scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: value || 'hsl(var(--muted-foreground))' }}
              onClick={() => onColorChange(value)}
              title={name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceAppearance;
