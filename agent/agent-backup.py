"""
NetScope Local Agent - Run this on your machine to enable ping, SNMP, metrics & network scanning.

Usage:
  pip install flask flask-cors pysnmp psutil
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
import time
import threading

# Try psutil for local machine metrics
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

app = Flask(__name__)
CORS(app)

PING_COUNT = '-n' if platform.system() == 'Windows' else '-c'
PING_TIMEOUT = '-w' if platform.system() == 'Windows' else '-W'

# Try to import pysnmp; gracefully degrade if not installed
try:
    from pysnmp.hlapi import (
        getCmd, nextCmd, SnmpEngine, CommunityData, UdpTransportTarget,
        ContextData, ObjectType, ObjectIdentity
    )
    SNMP_AVAILABLE = True
except ImportError:
    SNMP_AVAILABLE = False


# ── SNMP helpers ─────────────────────────────────────────────────────

# Common OIDs
OIDS = {
    'sysDescr':    '1.3.6.1.2.1.1.1.0',
    'sysName':     '1.3.6.1.2.1.1.5.0',
    'sysContact':  '1.3.6.1.2.1.1.4.0',
    'sysLocation': '1.3.6.1.2.1.1.6.0',
    'sysObjectID': '1.3.6.1.2.1.1.2.0',
    'sysUpTime':   '1.3.6.1.2.1.1.3.0',
}

IF_OIDS = {
    'ifDescr':       '1.3.6.1.2.1.2.2.1.2',
    'ifType':        '1.3.6.1.2.1.2.2.1.3',
    'ifSpeed':       '1.3.6.1.2.1.2.2.1.5',
    'ifOperStatus':  '1.3.6.1.2.1.2.2.1.8',
    'ifAdminStatus': '1.3.6.1.2.1.2.2.1.7',
}


def snmp_get(ip, community, oid, timeout=2, retries=1):
    """Get a single SNMP OID value."""
    if not SNMP_AVAILABLE:
        return None
    try:
        engine = SnmpEngine()
        iterator = getCmd(
            engine,
            CommunityData(community),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        if errorIndication or errorStatus:
            return None
        for _, val in varBinds:
            return str(val)
    except Exception:
        return None


def snmp_walk(ip, community, oid, timeout=2, retries=1):
    """Walk an SNMP OID subtree."""
    if not SNMP_AVAILABLE:
        return []
    results = []
    try:
        engine = SnmpEngine()
        for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
            engine,
            CommunityData(community),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid)),
            lexicographicMode=False
        ):
            if errorIndication or errorStatus:
                break
            for oid_val, val in varBinds:
                results.append({'oid': str(oid_val), 'value': str(val)})
    except Exception:
        pass
    return results


def snmp_get_system_info(ip, community):
    """Retrieve system-level SNMP info."""
    info = {}
    for key, oid in OIDS.items():
        val = snmp_get(ip, community, oid)
        if val:
            info[key] = val
    return info if info else None


def snmp_get_interfaces(ip, community):
    """Retrieve interface table via SNMP."""
    names = snmp_walk(ip, community, IF_OIDS['ifDescr'])
    speeds = snmp_walk(ip, community, IF_OIDS['ifSpeed'])
    oper_statuses = snmp_walk(ip, community, IF_OIDS['ifOperStatus'])
    admin_statuses = snmp_walk(ip, community, IF_OIDS['ifAdminStatus'])

    interfaces = []
    for i, name_entry in enumerate(names):
        speed_val = int(speeds[i]['value']) if i < len(speeds) else 0
        oper = oper_statuses[i]['value'] if i < len(oper_statuses) else '2'
        admin = admin_statuses[i]['value'] if i < len(admin_statuses) else '2'

        # Convert speed to human readable
        if speed_val >= 10_000_000_000:
            speed_str = f'{speed_val // 1_000_000_000}G'
        elif speed_val >= 1_000_000_000:
            speed_str = f'{speed_val // 1_000_000_000}G'
        elif speed_val >= 1_000_000:
            speed_str = f'{speed_val // 1_000_000}M'
        elif speed_val > 0:
            speed_str = f'{speed_val // 1_000}K'
        else:
            speed_str = 'Unknown'

        interfaces.append({
            'name': name_entry['value'],
            'speed': speed_str,
            'speedBps': speed_val,
            'operStatus': 'up' if oper == '1' else 'down',
            'adminStatus': 'up' if admin == '1' else 'down',
        })

    return interfaces


def parse_vendor_from_sysdescr(sys_descr):
    """Try to extract vendor and model from sysDescr."""
    if not sys_descr:
        return None, None

    sd = sys_descr.lower()
    vendor = None
    model = None

    vendor_patterns = {
        'Cisco': ['cisco'],
        'Juniper': ['juniper', 'junos'],
        'Arista': ['arista', 'eos'],
        'HPE/Aruba': ['aruba', 'procurve', 'hp ', 'hewlett'],
        'Fortinet': ['fortinet', 'fortigate', 'fortios'],
        'Palo Alto': ['palo alto', 'pan-os'],
        'MikroTik': ['mikrotik', 'routeros'],
        'Ubiquiti': ['ubiquiti', 'ubnt', 'unifi', 'edgeos'],
        'Dell': ['dell', 'force10'],
        'Huawei': ['huawei', 'vrp'],
        'TP-Link': ['tp-link'],
        'Netgear': ['netgear'],
        'D-Link': ['d-link'],
        'Linux': ['linux'],
        'Windows': ['windows', 'microsoft'],
        'FreeBSD': ['freebsd'],
        'pfSense': ['pfsense'],
        'VMware': ['vmware', 'esxi'],
        'Synology': ['synology'],
        'QNAP': ['qnap'],
    }

    for v, keywords in vendor_patterns.items():
        if any(k in sd for k in keywords):
            vendor = v
            break

    # Try to extract model - look for patterns like "Model: XXX" or common formats
    model_match = re.search(r'(?:model|hardware)[:\s]+([^\s,]+)', sys_descr, re.IGNORECASE)
    if model_match:
        model = model_match.group(1)
    elif vendor == 'Cisco':
        m = re.search(r'(C\d{4}|WS-C\d{4}|ASR\d+|ISR\d+|Nexus\s?\d+)', sys_descr, re.IGNORECASE)
        if m:
            model = m.group(1)
    elif vendor == 'MikroTik':
        m = re.search(r'(RB\d+|CCR\d+|CRS\d+|hAP|hEX)', sys_descr, re.IGNORECASE)
        if m:
            model = m.group(1)

    return vendor, model


def guess_type_from_snmp(sys_descr, sys_oid):
    """Guess device type from SNMP system info."""
    if not sys_descr:
        return None

    sd = sys_descr.lower()

    # Firewall indicators
    if any(k in sd for k in ['fortigate', 'fortios', 'palo alto', 'pan-os', 'pfsense', 'asa', 'firewall']):
        return 'firewall'

    # Router indicators
    if any(k in sd for k in ['router', 'routeros', 'ios xr', 'junos', 'edgeos', 'vyos', 'isr', 'asr']):
        return 'router'

    # Switch indicators
    if any(k in sd for k in ['switch', 'catalyst', 'procurve', 'aruba', 'nexus', 'eos', 'crs', 'layer 2']):
        return 'switch'

    # Server indicators
    if any(k in sd for k in ['linux', 'windows', 'freebsd', 'esxi', 'vmware', 'synology', 'qnap']):
        return 'server'

    return None


# ── Local machine metrics ─────────────────────────────────────────────

# Traffic history buffer (keeps last 60 samples at ~5s intervals = 5 min)
traffic_history = []
traffic_lock = threading.Lock()

def collect_traffic():
    """Background thread collecting network I/O every 5 seconds."""
    if not PSUTIL_AVAILABLE:
        return
    prev = psutil.net_io_counters()
    prev_time = time.time()
    while True:
        time.sleep(5)
        curr = psutil.net_io_counters()
        curr_time = time.time()
        dt = curr_time - prev_time
        rx_rate = (curr.bytes_recv - prev.bytes_recv) / dt  # bytes/s
        tx_rate = (curr.bytes_sent - prev.bytes_sent) / dt
        sample = {
            'timestamp': int(curr_time * 1000),
            'rxBytesPerSec': round(rx_rate),
            'txBytesPerSec': round(tx_rate),
            'rxMbps': round(rx_rate * 8 / 1_000_000, 2),
            'txMbps': round(tx_rate * 8 / 1_000_000, 2),
        }
        with traffic_lock:
            traffic_history.append(sample)
            # Keep last 120 samples (10 min)
            if len(traffic_history) > 120:
                traffic_history.pop(0)
        prev = curr
        prev_time = curr_time


# SNMP CPU/Memory OIDs (Host Resources MIB)
SNMP_CPU_OID = '1.3.6.1.2.1.25.3.3.1.2'       # hrProcessorLoad
SNMP_STORAGE_TYPE = '1.3.6.1.2.1.25.2.3.1.2'   # hrStorageType
SNMP_STORAGE_DESCR = '1.3.6.1.2.1.25.2.3.1.3'  # hrStorageDescr
SNMP_STORAGE_SIZE = '1.3.6.1.2.1.25.2.3.1.5'    # hrStorageSize
SNMP_STORAGE_USED = '1.3.6.1.2.1.25.2.3.1.6'    # hrStorageUsed
SNMP_STORAGE_UNIT = '1.3.6.1.2.1.25.2.3.1.4'    # hrStorageAllocationUnits
SNMP_RAM_TYPE = '1.3.6.1.2.1.25.2.1.2'          # hrStorageRam


def snmp_get_cpu_usage(ip, community):
    """Get average CPU usage via SNMP hrProcessorLoad."""
    if not SNMP_AVAILABLE:
        return None
    loads = snmp_walk(ip, community, SNMP_CPU_OID)
    if not loads:
        return None
    values = []
    for entry in loads:
        try:
            values.append(int(entry['value']))
        except (ValueError, TypeError):
            pass
    return round(sum(values) / len(values)) if values else None


def snmp_get_memory_usage(ip, community):
    """Get RAM usage via SNMP hrStorage."""
    if not SNMP_AVAILABLE:
        return None
    types = snmp_walk(ip, community, SNMP_STORAGE_TYPE)
    sizes = snmp_walk(ip, community, SNMP_STORAGE_SIZE)
    useds = snmp_walk(ip, community, SNMP_STORAGE_USED)
    units = snmp_walk(ip, community, SNMP_STORAGE_UNIT)

    for i, t in enumerate(types):
        if SNMP_RAM_TYPE in t.get('value', ''):
            try:
                size = int(sizes[i]['value'])
                used = int(useds[i]['value'])
                if size > 0:
                    return round(used / size * 100)
            except (IndexError, ValueError, TypeError, ZeroDivisionError):
                pass
    return None


# ── Core scanning ────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'platform': platform.system(),
        'snmp': SNMP_AVAILABLE,
        'psutil': PSUTIL_AVAILABLE,
    })


@app.route('/metrics/local', methods=['GET'])
def local_metrics():
    """Get CPU, RAM and network traffic from the local machine."""
    if not PSUTIL_AVAILABLE:
        return jsonify({'error': 'psutil not installed. Run: pip install psutil'}), 400

    cpu_percent = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    net = psutil.net_io_counters()

    with traffic_lock:
        history = list(traffic_history)

    return jsonify({
        'cpu': round(cpu_percent),
        'memory': round(mem.percent),
        'memoryTotal': mem.total,
        'memoryUsed': mem.used,
        'netBytesSent': net.bytes_sent,
        'netBytesRecv': net.bytes_recv,
        'trafficHistory': history,
    })


@app.route('/metrics/snmp', methods=['POST'])
def snmp_metrics():
    """Get CPU & RAM from a remote device via SNMP."""
    ip = request.json.get('ip', '')
    community = request.json.get('community', 'public')

    if not SNMP_AVAILABLE:
        return jsonify({'error': 'pysnmp not installed'}), 400

    cpu = snmp_get_cpu_usage(ip, community)
    memory = snmp_get_memory_usage(ip, community)

    return jsonify({
        'ip': ip,
        'cpu': cpu,
        'memory': memory,
    })


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


# ── SNMP endpoint ────────────────────────────────────────────────────

@app.route('/snmp', methods=['POST'])
def snmp_query():
    """Query a single device via SNMP."""
    ip = request.json.get('ip', '')
    community = request.json.get('community', 'public')

    if not SNMP_AVAILABLE:
        return jsonify({'error': 'pysnmp not installed. Run: pip install pysnmp'}), 400

    if not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
        return jsonify({'error': 'Invalid IP'}), 400

    system_info = snmp_get_system_info(ip, community)
    if not system_info:
        return jsonify({
            'ip': ip,
            'snmpReachable': False,
            'error': 'SNMP not responding or wrong community string',
        })

    interfaces = snmp_get_interfaces(ip, community)
    vendor, model = parse_vendor_from_sysdescr(system_info.get('sysDescr', ''))
    device_type = guess_type_from_snmp(system_info.get('sysDescr', ''), system_info.get('sysObjectID', ''))

    return jsonify({
        'ip': ip,
        'snmpReachable': True,
        'system': system_info,
        'interfaces': interfaces,
        'vendor': vendor,
        'model': model,
        'deviceType': device_type,
    })


# ── Scan helpers ─────────────────────────────────────────────────────

def resolve_host(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror, OSError):
        return None


def guess_device_type(hostname, ip):
    if not hostname:
        return 'pc', 'Unknown Device'

    hn = hostname.lower()
    if any(k in hn for k in ['router', 'gateway', 'gw', 'rt-', 'rtr']):
        return 'router', 'Router/Gateway'
    if any(k in hn for k in ['switch', 'sw-', 'swt']):
        return 'switch', 'Network Switch'
    if any(k in hn for k in ['firewall', 'fw-', 'pfsense', 'fortinet', 'fortigate', 'palo']):
        return 'firewall', 'Firewall'
    if any(k in hn for k in ['server', 'srv', 'nas', 'esxi', 'proxmox', 'vmware', 'host-', 'dc-', 'dns', 'dhcp', 'mail', 'web', 'db-', 'sql', 'apache', 'nginx']):
        return 'server', 'Server'
    if any(k in hn for k in ['docker', 'container', 'portainer']):
        return 'docker', 'Docker Host'
    if any(k in hn for k in ['kube', 'k8s', 'k3s', 'rancher', 'node-']):
        return 'kubernetes', 'K8s Node'
    if any(k in hn for k in ['ap-', 'access-point', 'wifi', 'wlan', 'unifi']):
        return 'router', 'Access Point'
    if any(k in hn for k in ['printer', 'print', 'hp-', 'canon', 'epson', 'brother']):
        return 'pc', 'Printer'

    last_octet = int(ip.split('.')[-1])
    if last_octet == 1 or last_octet == 254:
        return 'router', 'Gateway (likely)'

    return 'pc', 'Endpoint'


def check_common_ports(ip):
    open_ports = []
    common_ports = {
        22: 'SSH', 80: 'HTTP', 443: 'HTTPS', 8080: 'HTTP-Alt',
        3389: 'RDP', 445: 'SMB', 53: 'DNS', 161: 'SNMP',
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


def scan_single_host(base, i, community=None):
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
            port_nums = {p['port'] for p in ports}

            snmp_info = None
            vendor = None
            model = None
            snmp_interfaces = []

            # Try SNMP if community is provided and port 161 is open (or always try)
            if community and SNMP_AVAILABLE:
                sys_info = snmp_get_system_info(ip, community)
                if sys_info:
                    snmp_info = sys_info
                    vendor, model = parse_vendor_from_sysdescr(sys_info.get('sysDescr', ''))
                    snmp_type = guess_type_from_snmp(sys_info.get('sysDescr', ''), sys_info.get('sysObjectID', ''))
                    if snmp_type:
                        device_type = snmp_type
                        description = f'{vendor or "Unknown"} {model or device_type.title()}'
                    if sys_info.get('sysName'):
                        hostname = sys_info['sysName']
                    snmp_interfaces = snmp_get_interfaces(ip, community)

            # Fallback type from ports
            if not snmp_info and not hostname:
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
                'vendor': vendor,
                'model': model,
                'snmp': snmp_info,
                'snmpInterfaces': snmp_interfaces,
                'macAddress': None,
            }
    except:
        pass
    return None


@app.route('/scan', methods=['POST'])
def scan():
    subnet = request.json.get('subnet', '192.168.1.0/24')
    community = request.json.get('community', None)
    base = subnet.rsplit('.', 1)[0]
    hosts = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(scan_single_host, base, i, community): i for i in range(1, 255)}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                hosts.append(result)

    hosts.sort(key=lambda h: [int(x) for x in h['ip'].split('.')])

    return jsonify({
        'alive': [h['ip'] for h in hosts],
        'hosts': hosts,
        'subnet': subnet,
        'snmpEnabled': community is not None and SNMP_AVAILABLE,
    })


# ── LLDP / CDP neighbor discovery ────────────────────────────────────

LLDP_REM_TABLE = '1.0.8802.1.1.2.1.4.1.1'  # lldpRemTable
LLDP_REM_SYS_NAME  = '1.0.8802.1.1.2.1.4.1.1.9'   # lldpRemSysName
LLDP_REM_PORT_ID   = '1.0.8802.1.1.2.1.4.1.1.7'   # lldpRemPortId
LLDP_REM_PORT_DESC = '1.0.8802.1.1.2.1.4.1.1.8'   # lldpRemPortDesc
LLDP_REM_MAN_ADDR  = '1.0.8802.1.1.2.1.4.2.1.4'   # lldpRemManAddrIfId (management address)
LLDP_LOC_PORT_DESC = '1.0.8802.1.1.2.1.3.7.1.4'   # lldpLocPortDesc

CDP_CACHE_TABLE     = '1.3.6.1.4.1.9.9.23.1.2.1.1'
CDP_CACHE_DEVICE_ID = '1.3.6.1.4.1.9.9.23.1.2.1.1.6'  # cdpCacheDeviceId
CDP_CACHE_PORT      = '1.3.6.1.4.1.9.9.23.1.2.1.1.7'  # cdpCacheDevicePort
CDP_CACHE_ADDRESS   = '1.3.6.1.4.1.9.9.23.1.2.1.1.4'  # cdpCacheAddress
CDP_CACHE_PLATFORM  = '1.3.6.1.4.1.9.9.23.1.2.1.1.8'  # cdpCachePlatform


def snmp_get_lldp_neighbors(ip, community):
    """Get LLDP neighbor table."""
    if not SNMP_AVAILABLE:
        return []

    remote_names = snmp_walk(ip, community, LLDP_REM_SYS_NAME)
    remote_ports = snmp_walk(ip, community, LLDP_REM_PORT_ID)
    remote_port_descs = snmp_walk(ip, community, LLDP_REM_PORT_DESC)
    local_port_descs = snmp_walk(ip, community, LLDP_LOC_PORT_DESC)

    neighbors = []
    for i, name_entry in enumerate(remote_names):
        neighbor = {
            'protocol': 'LLDP',
            'remoteDevice': name_entry['value'],
            'remotePort': remote_ports[i]['value'] if i < len(remote_ports) else '',
            'remotePortDesc': remote_port_descs[i]['value'] if i < len(remote_port_descs) else '',
            'localPort': local_port_descs[i]['value'] if i < len(local_port_descs) else '',
        }
        # Try to extract local port index from OID
        # LLDP OID format: ...9.<timeMark>.<localPortNum>.<index>
        oid_parts = name_entry['oid'].split('.')
        if len(oid_parts) >= 2:
            try:
                neighbor['localPortIndex'] = int(oid_parts[-2])
            except (ValueError, IndexError):
                pass
        neighbors.append(neighbor)

    return neighbors


def snmp_get_cdp_neighbors(ip, community):
    """Get CDP neighbor table (Cisco devices)."""
    if not SNMP_AVAILABLE:
        return []

    device_ids = snmp_walk(ip, community, CDP_CACHE_DEVICE_ID)
    ports = snmp_walk(ip, community, CDP_CACHE_PORT)
    platforms = snmp_walk(ip, community, CDP_CACHE_PLATFORM)

    neighbors = []
    for i, dev_entry in enumerate(device_ids):
        # Extract local interface index from OID (cdpCacheIfIndex.cdpCacheDeviceIndex)
        oid_parts = dev_entry['oid'].split('.')
        local_if_index = None
        if len(oid_parts) >= 2:
            try:
                local_if_index = int(oid_parts[-2])
            except (ValueError, IndexError):
                pass

        neighbor = {
            'protocol': 'CDP',
            'remoteDevice': dev_entry['value'],
            'remotePort': ports[i]['value'] if i < len(ports) else '',
            'platform': platforms[i]['value'] if i < len(platforms) else '',
            'localPortIndex': local_if_index,
        }
        neighbors.append(neighbor)

    return neighbors


@app.route('/snmp-topology', methods=['POST'])
def snmp_topology():
    """Discover devices and their LLDP/CDP neighbors to build a topology."""
    subnet = request.json.get('subnet', '192.168.1.0/24')
    community = request.json.get('community', 'public')

    if not SNMP_AVAILABLE:
        return jsonify({'error': 'pysnmp not installed. Run: pip install pysnmp'}), 400

    base = subnet.rsplit('.', 1)[0]
    devices = []
    all_neighbors = []

    def probe_device(i):
        ip = f"{base}.{i}"
        try:
            result = subprocess.run(
                ['ping', PING_COUNT, '1', PING_TIMEOUT, '1', ip],
                capture_output=True, text=True, timeout=3
            )
            if result.returncode != 0:
                return None

            # Try SNMP system info
            sys_info = snmp_get_system_info(ip, community)
            if not sys_info:
                # Device alive but no SNMP — still include it
                hostname = resolve_host(ip) or f'Host-{i}'
                device_type, desc = guess_device_type(hostname, ip)
                return {
                    'ip': ip,
                    'hostname': hostname,
                    'deviceType': device_type,
                    'description': desc,
                    'snmpReachable': False,
                    'interfaces': [],
                    'neighbors': [],
                    'vendor': None,
                    'model': None,
                }

            hostname = sys_info.get('sysName', f'Host-{i}')
            vendor, model = parse_vendor_from_sysdescr(sys_info.get('sysDescr', ''))
            device_type = guess_type_from_snmp(sys_info.get('sysDescr', ''), sys_info.get('sysObjectID', ''))
            if not device_type:
                device_type, _ = guess_device_type(hostname, ip)

            interfaces = snmp_get_interfaces(ip, community)

            # Get LLDP + CDP neighbors
            lldp = snmp_get_lldp_neighbors(ip, community)
            cdp = snmp_get_cdp_neighbors(ip, community)
            neighbors = lldp + cdp

            # Resolve local port names from interface table
            for n in neighbors:
                idx = n.get('localPortIndex')
                if idx is not None and idx > 0 and idx <= len(interfaces):
                    n['localPort'] = interfaces[idx - 1]['name']

            return {
                'ip': ip,
                'hostname': hostname,
                'deviceType': device_type or 'pc',
                'description': f'{vendor or "Unknown"} {model or ""}',
                'snmpReachable': True,
                'system': sys_info,
                'interfaces': interfaces,
                'neighbors': neighbors,
                'vendor': vendor,
                'model': model,
            }
        except Exception:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(probe_device, i): i for i in range(1, 255)}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                devices.append(result)

    devices.sort(key=lambda h: [int(x) for x in h['ip'].split('.')])

    # Build links from neighbor data
    links = []
    seen_links = set()
    ip_to_hostname = {d['ip']: d['hostname'] for d in devices}
    hostname_to_ip = {d['hostname']: d['ip'] for d in devices}
    # Also map partial hostnames (e.g., CDP often returns FQDN)
    for d in devices:
        short = d['hostname'].split('.')[0]
        if short not in hostname_to_ip:
            hostname_to_ip[short] = d['ip']

    for device in devices:
        for neighbor in device.get('neighbors', []):
            remote_name = neighbor.get('remoteDevice', '')
            remote_short = remote_name.split('.')[0]
            remote_ip = hostname_to_ip.get(remote_name) or hostname_to_ip.get(remote_short)

            if not remote_ip:
                continue

            # Create a canonical link key to avoid duplicates
            pair = tuple(sorted([device['ip'], remote_ip]))
            local_port = neighbor.get('localPort', '')
            remote_port = neighbor.get('remotePort', '')
            link_key = (pair[0], pair[1], local_port, remote_port)
            reverse_key = (pair[0], pair[1], remote_port, local_port)

            if link_key in seen_links or reverse_key in seen_links:
                continue
            seen_links.add(link_key)

            links.append({
                'sourceIp': device['ip'],
                'sourceHostname': device['hostname'],
                'sourcePort': local_port,
                'targetIp': remote_ip,
                'targetHostname': ip_to_hostname.get(remote_ip, remote_name),
                'targetPort': remote_port,
                'protocol': neighbor.get('protocol', 'unknown'),
            })

    return jsonify({
        'devices': devices,
        'links': links,
        'subnet': subnet,
        'deviceCount': len(devices),
        'linkCount': len(links),
    })


if __name__ == '__main__':
    print("NetScope Agent running on http://localhost:5111")
    if SNMP_AVAILABLE:
        print("  ✓ SNMP support enabled (pysnmp)")
    else:
        print("  ✗ SNMP disabled (pip install pysnmp)")
    if PSUTIL_AVAILABLE:
        print("  ✓ Local metrics enabled (psutil)")
        # Start background traffic collection
        t = threading.Thread(target=collect_traffic, daemon=True)
        t.start()
    else:
        print("  ✗ Local metrics disabled (pip install psutil)")
    app.run(host='0.0.0.0', port=5111, debug=False)
