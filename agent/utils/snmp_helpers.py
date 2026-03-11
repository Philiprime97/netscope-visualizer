from pysnmp.hlapi import *
from config import Config

engine = SnmpEngine()


def snmp_get(ip, community, oid):

    iterator = getCmd(
        engine,
        CommunityData(community),
        UdpTransportTarget((ip, 161),
        timeout=Config.SNMP_TIMEOUT,
        retries=Config.SNMP_RETRIES),
        ContextData(),
        ObjectType(ObjectIdentity(oid))
    )

    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

    if errorIndication or errorStatus:
        return None

    for _, val in varBinds:
        return str(val)