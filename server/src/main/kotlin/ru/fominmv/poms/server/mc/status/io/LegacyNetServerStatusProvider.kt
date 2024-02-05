package ru.fominmv.poms.server.mc.status.io

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider

import java.net.InetAddress
import java.net.InetSocketAddress

class LegacyNetServerStatusProvider(
    val address:  InetSocketAddress = InetSocketAddress(InetAddress.getLocalHost(), 25565),
    val hostname: String            = address.hostString,
    val protocol: Int               = -1,
) : ServerStatusProvider {
    constructor(
        address:  InetAddress = InetAddress.getLocalHost(),
        port:     UShort      = 25565u,
        hostname: String      = address.hostAddress,
        protocol: Int         = 0,
    ): this(
        InetSocketAddress(address, port.toInt()),
        hostname,
        protocol
    )

    override val serverStatus: ServerStatus
        get() = TODO("Not yet implemented")
}