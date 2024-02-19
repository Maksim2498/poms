package ru.fominmv.poms.server.mc.status.io

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.Version

import java.net.InetAddress
import java.net.InetSocketAddress

class LegacyNetServerStatusProvider(
    val address:  InetSocketAddress = DEFAULT_SERVER_SOCKET_ADDRESS,
    val protocol: Int               = Version.DEFAULT_PROTOCOL,
) : ServerStatusProvider {
    constructor(
        address:  InetAddress = DEFAULT_SERVER_ADDRESS,
        port:     UShort      = DEFAULT_SERVER_PORT,
        protocol: Int         = Version.DEFAULT_PROTOCOL,
    ): this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address:  String = DEFAULT_SERVER_HOST_NAME,
        protocol: Int    = Version.DEFAULT_PROTOCOL,
    ): this(resolveServerAddress(address), protocol)

    override val serverStatus: ServerStatus
        get() = TODO("Not yet implemented")
}