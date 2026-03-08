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


@app.route('/scan', methods=['POST'])
def scan():
    subnet = request.json.get('subnet', '192.168.1.0/24')
    base = subnet.rsplit('.', 1)[0]
    alive = []

    for i in range(1, 255):
        ip = f"{base}.{i}"
        try:
            result = subprocess.run(
                ['ping', PING_COUNT, '1', PING_TIMEOUT, '1', ip],
                capture_output=True, text=True, timeout=3
            )
            if result.returncode == 0:
                alive.append(ip)
        except:
            pass

    return jsonify({'alive': alive, 'subnet': subnet})


if __name__ == '__main__':
    print("NetScope Agent running on http://localhost:5111")
    app.run(host='0.0.0.0', port=5111, debug=False)
