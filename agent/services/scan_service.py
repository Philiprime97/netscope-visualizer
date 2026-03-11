from flask import request, jsonify
import concurrent.futures
import subprocess
import platform

PING_COUNT = '-n' if platform.system() == 'Windows' else '-c'


def ping(ip):

    try:
        result = subprocess.run(
            ['ping', PING_COUNT, '1', ip],
            stdout=subprocess.DEVNULL
        )

        return result.returncode == 0

    except:
        return False


def scan_host(base, i):

    ip = f"{base}.{i}"

    if ping(ip):

        return {"ip": ip}

    return None


def register_scan_routes(app):

    @app.route("/scan", methods=["POST"])
    def scan():

        subnet = request.json.get("subnet", "192.168.1.0/24")

        base = subnet.rsplit('.', 1)[0]

        hosts = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:

            futures = [executor.submit(scan_host, base, i) for i in range(1,255)]

            for future in futures:
                result = future.result()

                if result:
                    hosts.append(result)

        return jsonify({"hosts": hosts})