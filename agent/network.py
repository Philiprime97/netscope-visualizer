import socket


def check_port(ip, port):

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(0.5)

            if sock.connect_ex((ip, port)) == 0:
                return True

    except Exception:
        pass

    return False