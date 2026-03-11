from flask import jsonify
import psutil


def register_metrics_routes(app):

    @app.route("/metrics/local")
    def local_metrics():

        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()

        return jsonify({
            "cpu": cpu,
            "memory": mem.percent,
            "memoryTotal": mem.total,
            "memoryUsed": mem.used
        })