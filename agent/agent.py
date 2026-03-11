from flask import Flask
from flask_cors import CORS
import logging

from config import Config

from services.ping_service import register_ping_routes
from services.snmp_service import register_snmp_routes
from services.metrics_service import register_metrics_routes
from services.scan_service import register_scan_routes

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)


def register_services():

    register_ping_routes(app)
    register_snmp_routes(app)
    register_metrics_routes(app)
    register_scan_routes(app)


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":

    register_services()

    print("NetScope Agent running")

    app.run(
        host="0.0.0.0",
        port=Config.PORT
    )