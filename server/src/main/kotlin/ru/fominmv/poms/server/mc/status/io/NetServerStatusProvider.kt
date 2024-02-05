package ru.fominmv.poms.server.mc.status.io

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider

import java.net.ConnectException
import java.net.InetAddress
import java.net.InetSocketAddress

class NetServerStatusProvider(
    val address:  InetSocketAddress = InetSocketAddress(InetAddress.getLocalHost(), 25565),
    val protocol: Int               = -1,
) : ServerStatusProvider {
    private val new    = NewNetServerStatusProvider(address, protocol)
    private val legacy = LegacyNetServerStatusProvider(address, protocol)

    constructor(
        address:  InetAddress = InetAddress.getLocalHost(),
        port:     UShort      = 25565u,
        protocol: Int         = -1,
    ): this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address:  String = "localhost",
        protocol: Int    = -1,
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