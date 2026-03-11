from flask import request, jsonify
import subprocess
import platform

from utils.validators import valid_ip

PING_COUNT = '-n' if platform.system() == 'Windows' else '-c'
PING_TIMEOUT = '-w' if platform.system() == 'Windows' else '-W'


def ping_host(ip):

    try:
        result = subprocess.run(
            ['ping', PING_COUNT, '1', PING_TIMEOUT, '2', ip],
            capture_output=True,
            text=True,
            timeout=5
        )

        return result.returncode == 0

    except Exception:
        return False


def register_ping_routes(app):

    @app.route("/ping", methods=["POST"])
    def ping():

        ip = request.json.get("ip")

        if not valid_ip(ip):
            return jsonify({"error": "Invalid IP"}), 400

        reachable = ping_host(ip)

        return jsonify({
            "ip": ip,
            "reachable": reachable
        })