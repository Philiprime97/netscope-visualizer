"""
NetScope Local Agent - Run this on your machine to enable ping & network scanning.

Usage:
  pip install flask flask-cors
  python agent.py

The agent runs on http://localhost:5111
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import platform
import re
import socket
import concurrent.futures

app = Flask(__name__)
CORS(app)

PING_COUNT = '-n' if platform.system() == 'Windows' else '-c'
PING_TIMEOUT = '-w' if platform.system() == 'Windows' else '-W'


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'platform': platform.system()})


@app.route('/ping', methods=['POST'])
def ping():
    ip = request.json.get('ip', '')
    if not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
        return jsonify({'ip': ip, 'reachable': False, 'error': 'Invalid IP'}), 400

    try:
        result = subprocess.run(
            ['ping', PING_COUNT, '1', PING_TIMEOUT, '2', ip],
            capture_output=True, text=True, timeout=5
        )
        return jsonify({
            'ip': ip,
            'reachable': result.returncode == 0,
            'output': result.stdout.strip()
        })
    except subprocess.TimeoutExpired:
        return jsonify({'ip': ip, 'reachable': False, 'error': 'Timeout'})
    except Exception as e:
        return jsonify({'ip': ip, 'reachable': False, 'error': str(e)})


def resolve_host(ip):
    """Try to resolve hostname for an IP."""
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except (socket.herror, socket.gaierror, OSError):
        return None


def guess_device_type(hostname, ip):
    """Guess device type based on hostname patterns."""
    if not hostname:
        return 'pc', 'Unknown Device'
    
    hn = hostname.lower()
    
    # Router patterns
    if any(k in hn for k in ['router', 'gateway', 'gw', 'rt-', 'rtr']):
        return 'router', 'Router/Gateway'
    
    # Switch patterns
    if any(k in hn for k in ['switch', 'sw-', 'swt']):
        return 'switch', 'Network Switch'
    
    # Firewall patterns
    if any(k in hn for k in ['firewall', 'fw-', 'pfsense', 'fortinet', 'fortigate', 'palo']):
        return 'firewall', 'Firewall'
    
    # Server patterns
    if any(k in hn for k in ['server', 'srv', 'nas', 'esxi', 'proxmox', 'vmware', 'host-', 'dc-', 'dns', 'dhcp', 'mail', 'web', 'db-', 'sql', 'apache', 'nginx']):
        return 'server', 'Server'
    
    # Docker / container
    if any(k in hn for k in ['docker', 'container', 'portainer']):
        return 'docker', 'Docker Host'
    
    # Kubernetes
    if any(k in hn for k in ['kube', 'k8s', 'k3s', 'rancher', 'node-']):
        return 'kubernetes', 'K8s Node'
    
    # Access points / wireless
    if any(k in hn for k in ['ap-', 'access-point', 'wifi', 'wlan', 'unifi']):
        return 'router', 'Access Point'
    
    # Printer
    if any(k in hn for k in ['printer', 'print', 'hp-', 'canon', 'epson', 'brother']):
        return 'pc', 'Printer'
    
    # Common gateway IPs
    last_octet = int(ip.split('.')[-1])
    if last_octet == 1 or last_octet == 254:
        return 'router', 'Gateway (likely)'
    
    return 'pc', 'Endpoint'


def check_common_ports(ip):
    """Quick check of common ports to help identify device type."""
    open_ports = []
    common_ports = {
        22: 'SSH',
        80: 'HTTP',
        443: 'HTTPS',
        8080: 'HTTP-Alt',
        3389: 'RDP',
        445: 'SMB',
        53: 'DNS',
        161: 'SNMP',
    }
    
    for port, name in common_ports.items():
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.3)
            result = sock.connect_ex((ip, port))
            if result == 0:
                open_ports.append({'port': port, 'service': name})
            sock.close()
        except:
            pass
    
    return open_ports


def scan_single_host(base, i):
    """Scan a single host and return details."""
    ip = f"{base}.{i}"
    try:
        result = subprocess.run(
            ['ping', PING_COUNT, '1', PING_TIMEOUT, '1', ip],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0:
            hostname = resolve_host(ip)
            device_type, description = guess_device_type(hostname, ip)
            ports = check_common_ports(ip)
            
            # Refine guess based on open ports
            port_nums = {p['port'] for p in ports}
            if not hostname:
                if 53 in port_nums:
                    device_type, description = 'server', 'DNS Server'
                elif 161 in port_nums:
                    device_type, description = 'switch', 'SNMP Device'
                elif 80 in port_nums or 443 in port_nums:
                    if 22 in port_nums:
                        device_type, description = 'server', 'Server'
                    else:
                        last_octet = int(ip.split('.')[-1])
                        if last_octet == 1 or last_octet == 254:
                            device_type, description = 'router', 'Gateway/Router'
            
            return {
                'ip': ip,
                'hostname': hostname or f'Host-{ip.split(".")[-1]}',
                'deviceType': device_type,
                'description': description,
                'ports': ports,
                'macAddress': None,
            }
    except:
        pass
    return None


@app.route('/scan', methods=['POST'])
def scan():
    subnet = request.json.get('subnet', '192.168.1.0/24')
    base = subnet.rsplit('.', 1)[0]
    hosts = []
    
    # Use thread pool for parallel scanning
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(scan_single_host, base, i): i for i in range(1, 255)}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                hosts.append(result)
    
    # Sort by IP
    hosts.sort(key=lambda h: [int(x) for x in h['ip'].split('.')])
    
    return jsonify({
        'alive': [h['ip'] for h in hosts],
        'hosts': hosts,
        'subnet': subnet,
    })


if __name__ == '__main__':
    print("NetScope Agent running on http://localhost:5111")
    app.run(host='0.0.0.0', port=5111, debug=False)
