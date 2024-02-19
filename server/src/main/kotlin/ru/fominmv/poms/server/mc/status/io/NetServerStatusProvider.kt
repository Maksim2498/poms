package ru.fominmv.poms.server.mc.status.io

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.Version

import java.net.ConnectException
import java.net.InetAddress
import java.net.InetSocketAddress

class NetServerStatusProvider(
    val address:  InetSocketAddress = DEFAULT_SERVER_SOCKET_ADDRESS,
    val protocol: Int               = Version.DEFAULT_PROTOCOL,
) : ServerStatusProvider {
    private val new    = NewNetServerStatusProvider(address, protocol)
    private val legacy = LegacyNetServerStatusProvider(address, protocol)

    constructor(
        address:  InetAddress = InetAddress.getLocalHost(),
        port:     UShort      = DEFAULT_SERVER_PORT,
        protocol: Int         = Version.DEFAULT_PROTOCOL,
    ): this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address:  String = DEFAULT_SERVER_HOST_NAME,
        protocol: Int    = Version.DEFAULT_PROTOCOL,
    ): this(resolveServerAddress(address), protocol)

    override val serverStatus: ServerStatus
        get() =
            try {
                new.serverStatus
            } catch (exception: ConnectException) {
                throw exception
            } catch (_: Exception) {
                legacy.serverStatus
            }
}