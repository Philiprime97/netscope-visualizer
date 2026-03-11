from flask import request, jsonify
from utils.snmp_helpers import snmp_get


def register_snmp_routes(app):

    @app.route("/snmp", methods=["POST"])
    def snmp_query():

        ip = request.json.get("ip")
        community = request.json.get("community", "public")

        sysdescr = snmp_get(ip, community, "1.3.6.1.2.1.1.1.0")

        if not sysdescr:
            return jsonify({
                "ip": ip,
                "snmpReachable": False
            })

        return jsonify({
            "ip": ip,
            "snmpReachable": True,
            "sysDescr": sysdescr
        })